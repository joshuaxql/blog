import { postPayloadBySlug, summaryPayload } from "./.generated/posts-data.mjs";

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function buildNotFound(message) {
  return jsonResponse({ error: message }, 404);
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

    return env.ASSETS.fetch(request);
  }
};
