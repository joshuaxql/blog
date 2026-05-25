const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { URL } = require("url");

const matter = require("gray-matter");
const hljs = require("highlight.js");
const { marked } = require("marked");

const ROOT_DIR = __dirname;
const BLOG_DIR = path.join(ROOT_DIR, "blog");
const PORT = Number(process.env.PORT) || 3000;
const SHELL_CONTENT_PATHS = new Set(["/", "/index.html", "/blog.html", "/post.html"]);

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

marked.setOptions({
  gfm: true,
  breaks: false
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function normalizeCodeLanguage(lang) {
  const source = typeof lang === "string" ? lang.trim().toLowerCase() : "";
  if (!source) {
    return "";
  }

  const aliases = {
    shell: "bash",
    sh: "bash",
    zsh: "bash",
    ps1: "powershell",
    yml: "yaml",
    text: "plaintext",
    plaintext: "plaintext"
  };

  return aliases[source] || source;
}

function renderCodeBlock(text, lang) {
  const normalizedLang = normalizeCodeLanguage(lang);
  let codeHtml = "";

  if (normalizedLang && hljs.getLanguage(normalizedLang)) {
    const highlighted = hljs.highlight(text, {
      language: normalizedLang,
      ignoreIllegals: true
    }).value;

    codeHtml = `<code class="hljs language-${escapeHtml(normalizedLang)}">${highlighted}</code>`;
  } else {
    const autoHighlighted = hljs.highlightAuto(text);
    const languageClass = autoHighlighted.language
      ? ` language-${escapeHtml(autoHighlighted.language)}`
      : "";

    codeHtml = `<code class="hljs${languageClass}">${autoHighlighted.value}</code>`;
  }

  return `<div class="code-block"><button class="code-copy-btn" type="button" aria-label="复制代码" data-label-default="复制" data-label-success="已复制" data-label-failure="重试">复制</button><pre>${codeHtml}</pre></div>\n`;
}

marked.use({
  renderer: {
    code({ text, lang }) {
      return renderCodeBlock(text, lang);
    }
  }
});

function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function formatMonthDay(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "--.--";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}`;
}

function formatWeekday(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "---";
  }

  return new Intl.DateTimeFormat("en-US", { weekday: "short" })
    .format(date)
    .toUpperCase();
}

function parseDate(value, fallbackDate) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return fallbackDate;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => normalizeString(tag))
      .filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\(([^)]+)\)/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>-]/g, " ")
    .replace(/\r/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(content, fallback) {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1].trim();
  }

  return fallback;
}

function extractSummary(content) {
  const plainText = stripMarkdown(content);
  if (!plainText) {
    return "暂无摘要。";
  }

  if (plainText.length <= 120) {
    return plainText;
  }

  return `${plainText.slice(0, 120).trim()}...`;
}

function countWords(content) {
  const plainText = stripMarkdown(content);
  const cjkChars = plainText.match(/[\u3400-\u9FFF]/g) || [];
  const latinWords =
    plainText
      .replace(/[\u3400-\u9FFF]/g, " ")
      .match(/[A-Za-z0-9_]+(?:['-][A-Za-z0-9_]+)*/g) || [];

  return cjkChars.length + latinWords.length;
}

function estimateReadMinutes(wordCount) {
  return Math.max(1, Math.ceil(wordCount / 240));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

async function loadPost(fileName) {
  const filePath = path.join(BLOG_DIR, fileName);
  const raw = await fsp.readFile(filePath, "utf8");
  const fileStat = await fsp.stat(filePath);
  const { data, content } = matter(raw);

  const slug = path.basename(fileName, path.extname(fileName));
  const fallbackTitle = slug;
  const title = normalizeString(data.title) || extractTitle(content, fallbackTitle);
  const date = parseDate(data.date, fileStat.mtime);
  const summary = normalizeString(data.summary) || extractSummary(content);
  const tags = normalizeTags(data.tags);
  const wordCount = countWords(content);
  const readMinutes = estimateReadMinutes(wordCount);
  const primaryTag = tags[0] || "未分类";

  return {
    slug,
    fileName,
    title,
    summary,
    tags,
    primaryTag,
    content,
    contentHtml: marked.parse(content),
    wordCount,
    readMinutes,
    timestamp: date.getTime(),
    year: date.getFullYear(),
    dateIso: date.toISOString(),
    dateLabel: formatDate(date),
    monthDay: formatMonthDay(date),
    weekday: formatWeekday(date)
  };
}

async function loadPosts() {
  let entries = [];

  try {
    entries = await fsp.readdir(BLOG_DIR, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const postFiles = entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".md")
    .map((entry) => entry.name);

  const posts = await Promise.all(postFiles.map((fileName) => loadPost(fileName)));

  return posts.sort((left, right) => {
    if (right.timestamp !== left.timestamp) {
      return right.timestamp - left.timestamp;
    }
    return left.slug.localeCompare(right.slug, "zh-CN");
  });
}

function buildTagStats(posts) {
  const bucket = new Map();

  for (const post of posts) {
    for (const tag of post.tags) {
      const key = tag.toLowerCase();
      const item = bucket.get(key);
      if (item) {
        item.count += 1;
      } else {
        bucket.set(key, { name: tag, count: 1 });
      }
    }
  }

  return Array.from(bucket.values()).sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }
    return left.name.localeCompare(right.name, "zh-CN");
  });
}

function buildSiteStats(posts) {
  const totalPosts = posts.length;
  const totalWords = posts.reduce((sum, post) => sum + post.wordCount, 0);
  const totalReadMinutes = posts.reduce((sum, post) => sum + post.readMinutes, 0);
  const tagStats = buildTagStats(posts);
  const latestPost = posts[0] || null;

  return {
    totalPosts,
    totalWords,
    totalWordsLabel: formatNumber(totalWords),
    totalReadMinutes,
    lastUpdated: latestPost ? latestPost.dateLabel : "--",
    lastUpdatedIso: latestPost ? latestPost.dateIso : "",
    uniqueTags: tagStats.length,
    topTags: tagStats.slice(0, 6),
    latestPostTitle: latestPost ? latestPost.title : "暂无文章"
  };
}

function toPublicPost(post, includeContent = false) {
  const base = {
    slug: post.slug,
    fileName: post.fileName,
    title: post.title,
    summary: post.summary,
    tags: post.tags,
    primaryTag: post.primaryTag,
    wordCount: post.wordCount,
    readMinutes: post.readMinutes,
    year: post.year,
    dateIso: post.dateIso,
    dateLabel: post.dateLabel,
    monthDay: post.monthDay,
    weekday: post.weekday
  };

  if (includeContent) {
    base.contentHtml = post.contentHtml;
  }

  return base;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": CONTENT_TYPES[".json"],
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, { error: message });
}

function resolveStaticPath(requestPath) {
  const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);
  const decodedPath = decodeURIComponent(relativePath);
  const filePath = path.normalize(path.join(ROOT_DIR, decodedPath));

  if (!filePath.startsWith(ROOT_DIR)) {
    return null;
  }

  return filePath;
}

function shouldServeShell(requestUrl) {
  return SHELL_CONTENT_PATHS.has(requestUrl.pathname) && requestUrl.searchParams.get("shell-frame") !== "1";
}

async function serveStatic(requestUrl, response) {
  const effectivePath = shouldServeShell(requestUrl) ? "/shell.html" : requestUrl.pathname;
  const filePath = resolveStaticPath(effectivePath);
  if (!filePath) {
    sendError(response, 403, "非法路径。");
    return;
  }

  let stat;
  try {
    stat = await fsp.stat(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendError(response, 404, "资源不存在。");
      return;
    }
    throw error;
  }

  if (!stat.isFile()) {
    sendError(response, 404, "资源不存在。");
    return;
  }

  const extName = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": CONTENT_TYPES[extName] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  fs.createReadStream(filePath).pipe(response);
}

async function handleApi(requestUrl, response) {
  const posts = await loadPosts();
  const stats = buildSiteStats(posts);

  if (requestUrl.pathname === "/api/posts") {
    sendJson(response, 200, {
      stats,
      tagStats: buildTagStats(posts),
      posts: posts.map((post) => toPublicPost(post))
    });
    return;
  }

  if (requestUrl.pathname.startsWith("/api/posts/")) {
    const slug = decodeURIComponent(requestUrl.pathname.slice("/api/posts/".length));
    const index = posts.findIndex((post) => post.slug === slug);

    if (index === -1) {
      sendError(response, 404, "文章不存在。");
      return;
    }

    const newer = index > 0 ? toPublicPost(posts[index - 1]) : null;
    const older = index < posts.length - 1 ? toPublicPost(posts[index + 1]) : null;

    sendJson(response, 200, {
      stats,
      post: toPublicPost(posts[index], true),
      neighbors: {
        newer,
        older
      }
    });
    return;
  }

  sendError(response, 404, "接口不存在。");
}

function createServer() {
  return http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

      if (request.method !== "GET") {
        sendError(response, 405, "只支持 GET 请求。");
        return;
      }

      if (requestUrl.pathname.startsWith("/api/")) {
        await handleApi(requestUrl, response);
        return;
      }

      await serveStatic(requestUrl, response);
    } catch (error) {
      console.error(error);
      sendError(response, 500, "服务器内部错误。");
    }
  });
}

function startServer() {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`Blog server running at http://localhost:${PORT}`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  buildSiteStats,
  buildTagStats,
  countWords,
  createServer,
  estimateReadMinutes,
  loadPosts,
  startServer,
  toPublicPost
};
