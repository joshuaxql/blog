const fs = require("fs/promises");
const path = require("path");

const { buildSiteStats, buildTagStats, loadPosts, toPublicPost } = require("./server");

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, "dist");
const GENERATED_DIR = path.join(ROOT_DIR, ".generated");
const STATIC_FILES = [
  "index.html",
  "blog.html",
  "post.html",
  "shell.html",
  "shell-bridge.js",
  "cursor.css",
  "cursor.js"
];
const STATIC_DIRECTORIES = ["asset"];

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function cleanDir(dirPath) {
  await ensureDir(dirPath);
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  await Promise.all(
    entries.map((entry) =>
      fs.rm(path.join(dirPath, entry.name), { recursive: true, force: true })
    )
  );
}

async function copyStaticFiles() {
  await Promise.all(
    STATIC_FILES.map(async (fileName) => {
      const sourcePath = path.join(ROOT_DIR, fileName);
      const targetPath = path.join(DIST_DIR, fileName);
      await fs.copyFile(sourcePath, targetPath);
    })
  );
}

async function copyStaticDirectories() {
  await Promise.all(
    STATIC_DIRECTORIES.map(async (directoryName) => {
      const sourcePath = path.join(ROOT_DIR, directoryName);
      const targetPath = path.join(DIST_DIR, directoryName);
      await fs.cp(sourcePath, targetPath, { recursive: true, force: true });
    })
  );
}

function buildApiPayload(posts) {
  const stats = buildSiteStats(posts);
  const summaryPayload = {
    stats,
    tagStats: buildTagStats(posts),
    posts: posts.map((post) => toPublicPost(post))
  };

  const postPayloadBySlug = {};

  posts.forEach((post, index) => {
    const newer = index > 0 ? toPublicPost(posts[index - 1]) : null;
    const older = index < posts.length - 1 ? toPublicPost(posts[index + 1]) : null;

    postPayloadBySlug[post.slug] = {
      stats,
      post: toPublicPost(post, true),
      neighbors: {
        newer,
        older
      }
    };
  });

  return {
    summaryPayload,
    postPayloadBySlug
  };
}

async function writeGeneratedModule(payload) {
  await ensureDir(GENERATED_DIR);
  const moduleSource = [
    "export const summaryPayload = ",
    JSON.stringify(payload.summaryPayload, null, 2),
    ";\n\nexport const postPayloadBySlug = ",
    JSON.stringify(payload.postPayloadBySlug, null, 2),
    ";\n"
  ].join("");

  await fs.writeFile(path.join(GENERATED_DIR, "posts-data.mjs"), moduleSource, "utf8");
}

async function main() {
  const posts = await loadPosts();
  const payload = buildApiPayload(posts);

  await cleanDir(DIST_DIR);
  await copyStaticFiles();
  await copyStaticDirectories();
  await writeGeneratedModule(payload);

  console.log(`Built ${posts.length} post(s) for Cloudflare Worker deployment.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
