(function () {
  const host = window.location.hostname;
  const isLocalHost = host === "127.0.0.1" || host === "localhost";
  const cacheTtlMs = isLocalHost ? 15 * 1000 : 5 * 60 * 1000;
  const summaryKey = "joshuaxql:summary:v1";
  const postKeyPrefix = "joshuaxql:post:v1:";
  const memoryCache = new Map();

  function now() {
    return Date.now();
  }

  function readCache(key) {
    const memoryEntry = memoryCache.get(key);
    if (memoryEntry && now() - memoryEntry.savedAt <= cacheTtlMs) {
      return memoryEntry.payload;
    }

    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || now() - parsed.savedAt > cacheTtlMs) {
        sessionStorage.removeItem(key);
        return null;
      }

      memoryCache.set(key, parsed);
      return parsed.payload;
    } catch {
      sessionStorage.removeItem(key);
      return null;
    }
  }

  function writeCache(key, payload) {
    const entry = {
      savedAt: now(),
      payload
    };

    memoryCache.set(key, entry);

    try {
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Ignore storage quota and privacy mode failures.
    }

    return payload;
  }

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}`);
    }
    return response.json();
  }

  async function cachedJson(key, url) {
    const cached = readCache(key);
    if (cached) {
      return cached;
    }

    const payload = await fetchJson(url);
    return writeCache(key, payload);
  }

  function ensureStylesheet(url) {
    const href = String(url);
    const selector = `link[data-runtime-style="${CSS.escape(href)}"]`;
    const existing = document.querySelector(selector);
    if (existing) {
      return Promise.resolve(existing);
    }

    return new Promise((resolve, reject) => {
      const tag = document.createElement("link");
      tag.rel = "stylesheet";
      tag.href = href;
      tag.dataset.runtimeStyle = href;
      tag.onload = () => resolve(tag);
      tag.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
      document.head.appendChild(tag);
    });
  }

  function ensureScript(url) {
    const src = String(url);
    const selector = `script[data-runtime-script="${CSS.escape(src)}"]`;
    const existing = document.querySelector(selector);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        return Promise.resolve(existing);
      }

      return new Promise((resolve, reject) => {
        existing.addEventListener("load", () => resolve(existing), { once: true });
        existing.addEventListener("error", () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
      });
    }

    return new Promise((resolve, reject) => {
      const tag = document.createElement("script");
      tag.src = src;
      tag.defer = true;
      tag.dataset.runtimeScript = src;
      tag.onload = () => {
        tag.dataset.loaded = "true";
        resolve(tag);
      };
      tag.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(tag);
    });
  }

  window.blogRuntime = {
    ensureScript,
    ensureStylesheet,
    loadPostBySlug(slug) {
      return cachedJson(`${postKeyPrefix}${slug}`, `/api/posts/${encodeURIComponent(slug)}`);
    },
    loadPostsSummary() {
      return cachedJson(summaryKey, "/api/posts");
    }
  };
})();
