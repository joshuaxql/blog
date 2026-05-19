(function () {
  function parsePixels(value) {
    return Number.parseFloat(value) || 0;
  }

  function createCursorElement(className, id) {
    const element = document.createElement("div");
    element.className = className;
    element.id = id;
    document.body.appendChild(element);
    return element;
  }

  function initCursor() {
    if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
      return;
    }

    document.documentElement.classList.add("cursor-ready");

    const cross = document.getElementById("cursor-cross") || createCursorElement("cursor-cross", "cursor-cross");
    const frame = document.getElementById("cursor-frame") || createCursorElement("cursor-frame", "cursor-frame");

    const state = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      visible: false,
      suppressed: false,
      frameTarget: null,
      rafId: 0,
      frameRafId: 0
    };

    function setCrossVisibility() {
      cross.style.opacity = state.visible && !state.suppressed ? "1" : "0";
    }

    function renderCross() {
      cross.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
      setCrossVisibility();
    }

    function renderFrame() {
      if (!state.frameTarget || !state.visible || state.suppressed) {
        frame.style.opacity = "0";
        setCrossVisibility();
        return;
      }

      const rect = state.frameTarget.getBoundingClientRect();
      frame.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
      frame.style.width = `${rect.width}px`;
      frame.style.height = `${rect.height}px`;
      frame.style.opacity = "1";
      setCrossVisibility();
    }

    function isPointerInViewportScrollbar(event) {
      const root = document.documentElement;
      const verticalScrollbarWidth = window.innerWidth - root.clientWidth;
      const horizontalScrollbarHeight = window.innerHeight - root.clientHeight;

      if (verticalScrollbarWidth > 0 && event.clientX >= root.clientWidth) {
        return true;
      }

      if (horizontalScrollbarHeight > 0 && event.clientY >= root.clientHeight) {
        return true;
      }

      return false;
    }

    function isPointerInElementScrollbar(element, event) {
      const rect = element.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        return false;
      }

      const styles = window.getComputedStyle(element);
      const borderTop = parsePixels(styles.borderTopWidth);
      const borderRight = parsePixels(styles.borderRightWidth);
      const borderBottom = parsePixels(styles.borderBottomWidth);
      const borderLeft = parsePixels(styles.borderLeftWidth);
      const overflowX = styles.overflowX;
      const overflowY = styles.overflowY;
      const verticalScrollbarWidth = Math.max(0, element.offsetWidth - element.clientWidth - borderLeft - borderRight);
      const horizontalScrollbarHeight = Math.max(0, element.offsetHeight - element.clientHeight - borderTop - borderBottom);
      const supportsVerticalScrollbar = /auto|scroll|overlay/.test(overflowY) && element.scrollHeight > element.clientHeight;
      const supportsHorizontalScrollbar = /auto|scroll|overlay/.test(overflowX) && element.scrollWidth > element.clientWidth;

      if (supportsVerticalScrollbar && verticalScrollbarWidth > 0) {
        const scrollbarLeft = rect.right - borderRight - verticalScrollbarWidth;
        if (event.clientX >= scrollbarLeft && event.clientX <= rect.right - borderRight) {
          return true;
        }
      }

      if (supportsHorizontalScrollbar && horizontalScrollbarHeight > 0) {
        const scrollbarTop = rect.bottom - borderBottom - horizontalScrollbarHeight;
        if (event.clientY >= scrollbarTop && event.clientY <= rect.bottom - borderBottom) {
          return true;
        }
      }

      return false;
    }

    function isPointerOverNativeScrollbar(event) {
      if (isPointerInViewportScrollbar(event)) {
        return true;
      }

      const path = typeof event.composedPath === "function" ? event.composedPath() : [];
      for (const node of path) {
        if (!(node instanceof HTMLElement)) {
          continue;
        }

        if (isPointerInElementScrollbar(node, event)) {
          return true;
        }
      }

      return false;
    }

    function stopFrameTracking() {
      if (state.frameRafId) {
        window.cancelAnimationFrame(state.frameRafId);
        state.frameRafId = 0;
      }
    }

    function trackFrame() {
      if (!state.frameTarget) {
        state.frameRafId = 0;
        return;
      }

      renderFrame();
      state.frameRafId = window.requestAnimationFrame(trackFrame);
    }

    function ensureFrameTracking() {
      if (!state.frameRafId) {
        state.frameRafId = window.requestAnimationFrame(trackFrame);
      }
    }

    function flush() {
      state.rafId = 0;
      renderCross();
    }

    function schedule() {
      if (!state.rafId) {
        state.rafId = window.requestAnimationFrame(flush);
      }
    }

    function setFrameTarget(nextTarget) {
      if (state.frameTarget === nextTarget) {
        return;
      }

      state.frameTarget = nextTarget;
      if (state.frameTarget) {
        renderFrame();
        ensureFrameTracking();
        return;
      }

      stopFrameTracking();
      renderFrame();
    }

    document.addEventListener("pointermove", (event) => {
      state.x = event.clientX;
      state.y = event.clientY;
      state.visible = true;
      state.suppressed = isPointerOverNativeScrollbar(event);
      schedule();

      const nextTarget = !state.suppressed && event.target instanceof Element
        ? event.target.closest("[data-cursor-frame]")
        : null;
      setFrameTarget(nextTarget);
      if (!nextTarget) {
        renderFrame();
      }
    }, { passive: true });

    document.addEventListener("pointerleave", () => {
      state.visible = false;
      state.suppressed = false;
      state.frameTarget = null;
      stopFrameTracking();
      cross.style.opacity = "0";
      frame.style.opacity = "0";
    });

    window.addEventListener("scroll", () => {
      if (state.frameTarget) {
        renderFrame();
      }
    }, { passive: true });

    window.addEventListener("resize", () => {
      if (state.frameTarget) {
        renderFrame();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCursor, { once: true });
  } else {
    initCursor();
  }
})();
