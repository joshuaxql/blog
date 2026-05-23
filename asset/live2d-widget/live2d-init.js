const widgetBaseUrl = new URL("./", import.meta.url);

function ensureStyle(url) {
  const href = url.href;
  if (document.querySelector(`link[data-live2d-style="${href}"]`)) {
    return;
  }

  const tag = document.createElement("link");
  tag.rel = "stylesheet";
  tag.href = href;
  tag.dataset.live2dStyle = href;
  document.head.appendChild(tag);
}

function patchImageCrossOrigin() {
  if (window.__joshuaxqlLive2dImagePatched) {
    return;
  }

  const OriginalImage = window.Image;
  window.Image = function (...args) {
    const img = new OriginalImage(...args);
    img.crossOrigin = "anonymous";
    return img;
  };
  window.Image.prototype = OriginalImage.prototype;
  window.__joshuaxqlLive2dImagePatched = true;
}

async function initLive2dWidget() {
  if (window.__joshuaxqlLive2dBooted) {
    return;
  }

  window.__joshuaxqlLive2dBooted = true;
  // Clear persisted hidden state so shell-mode navigation does not make the widget
  // look "missing" after a previous close action.
  localStorage.removeItem("waifu-disabled");
  localStorage.removeItem("waifu-display");
  ensureStyle(new URL("./waifu.css", widgetBaseUrl));
  patchImageCrossOrigin();

  await import(new URL("./waifu-tips.js", widgetBaseUrl).href);

  if (typeof window.initWidget !== "function") {
    throw new Error("Live2D initWidget is unavailable.");
  }

  window.initWidget({
    waifuPath: new URL("./waifu-tips.json", widgetBaseUrl).href,
    cubism2Path: new URL("./live2d.min.js", widgetBaseUrl).href,
    cubism5Path: "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js",
    tools: ["hitokoto", "photo", "quit"],
    drag: false,
    showToggleAfterQuit: true,
    logLevel: "warn"
  });
}

function scheduleWidgetInit() {
  let started = false;

  function start() {
    if (started) {
      return;
    }

    started = true;
    initLive2dWidget().catch((error) => {
      console.warn("[Live2D Widget] failed to initialize.", error);
    });
  }

  function queue() {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(start, { timeout: 2500 });
      return;
    }

    window.setTimeout(start, 1200);
  }

  if (document.readyState === "complete") {
    queue();
    return;
  }

  window.addEventListener("load", queue, { once: true });
}

scheduleWidgetInit();
