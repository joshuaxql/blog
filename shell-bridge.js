(function () {
  const CONTENT_FRAME_PARAM = "shell-frame";
  const INTERNAL_PAGE_PATHS = new Set(["/", "/index.html", "/blog.html", "/post.html"]);

  function toCleanPath(input) {
    const nextUrl = new URL(input, window.location.origin);
    nextUrl.searchParams.delete(CONTENT_FRAME_PARAM);
    return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  }

  function toFramedPath(input) {
    const nextUrl = new URL(input, window.location.origin);
    nextUrl.searchParams.set(CONTENT_FRAME_PARAM, "1");
    return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  }

  function isInternalPageUrl(url) {
    return url.origin === window.location.origin && INTERNAL_PAGE_PATHS.has(url.pathname);
  }

  function getCurrentPagePath() {
    return toCleanPath(window.location.href);
  }

  if (window.top === window.self) {
    if (!window.__joshuaxqlStandaloneLive2dLoaded) {
      const moduleScript = document.createElement("script");
      moduleScript.type = "module";
      moduleScript.src = new URL("asset/live2d-widget/live2d-init.js", window.location.href).href;
      document.head.appendChild(moduleScript);
      window.__joshuaxqlStandaloneLive2dLoaded = true;
    }
    return;
  }

  let lastPayload = "";

  function postToParent(payload) {
    const nextPayload = JSON.stringify(payload);
    if (nextPayload === lastPayload) {
      return;
    }

    lastPayload = nextPayload;
    window.parent.postMessage(payload, window.location.origin);
  }

  function sendShellState() {
    postToParent({
      type: "shell:navigate",
      path: getCurrentPagePath(),
      title: document.title
    });
  }

  const titleElement = document.querySelector("title");
  if (titleElement) {
    new MutationObserver(sendShellState).observe(titleElement, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const link = event.target.closest("a[href]");
    if (!link || link.target || link.hasAttribute("download")) {
      return;
    }

    const rawHref = link.getAttribute("href");
    if (!rawHref || rawHref.startsWith("#")) {
      return;
    }

    try {
      const targetUrl = new URL(rawHref, window.location.href);
      const isExternal = targetUrl.origin !== window.location.origin;
      const isSpecialProtocol = targetUrl.protocol === "mailto:" || targetUrl.protocol === "tel:";

      if (isExternal || isSpecialProtocol) {
        link.target = "_top";
        return;
      }

      if (!isInternalPageUrl(targetUrl)) {
        return;
      }

      const currentUrl = new URL(window.location.href);
      const isSameDocumentAnchor =
        targetUrl.pathname === currentUrl.pathname &&
        targetUrl.search === currentUrl.search &&
        targetUrl.hash;

      if (isSameDocumentAnchor) {
        return;
      }

      event.preventDefault();

      const cleanPath = toCleanPath(targetUrl);
      postToParent({
        type: "shell:navigate-start",
        path: cleanPath
      });

      window.location.assign(toFramedPath(targetUrl));
    } catch {
      // Ignore malformed href values and let the browser handle them.
    }
  });

  window.addEventListener("DOMContentLoaded", sendShellState);
  window.addEventListener("load", sendShellState);
  window.addEventListener("pageshow", sendShellState);
  window.addEventListener("hashchange", sendShellState);
  window.setTimeout(sendShellState, 0);
})();
