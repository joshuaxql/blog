import { postPayloadBySlug, summaryPayload } from "./.generated/posts-data.mjs";

const SHELL_CONTENT_PATHS = new Set(["/", "/index.html", "/blog.html", "/post.html"]);

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300, stale-while-revalidate=3600"
    }
  });
}

function buildNotFound(message) {
  return jsonResponse({ error: message }, 404);
}

function shouldServeShell(url) {
  return SHELL_CONTENT_PATHS.has(url.pathname) && url.searchParams.get("shell-frame") !== "1";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/posts" || url.pathname === "/api/posts/") {
      return jsonResponse(summaryPayload);
    }

    if (url.pathname.startsWith("/api/posts/")) {
      const slug = decodeURIComponent(url.pathname.slice("/api/posts/".length)).trim();

      if (!slug || slug.includes("/")) {
        return buildNotFound("文章不存在。");
      }

      const payload = postPayloadBySlug[slug];
      if (!payload) {
        return buildNotFound("文章不存在。");
      }

      return jsonResponse(payload);
    }

    if (shouldServeShell(url)) {
      const shellUrl = new URL(request.url);
      shellUrl.pathname = "/shell.html";
      return env.ASSETS.fetch(shellUrl.toString());
    }

    return env.ASSETS.fetch(request);
  }
};
