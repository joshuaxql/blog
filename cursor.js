(function () {
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

    document.body.classList.add("cursor-ready");

    const cross = document.getElementById("cursor-cross") || createCursorElement("cursor-cross", "cursor-cross");
    const frame = document.getElementById("cursor-frame") || createCursorElement("cursor-frame", "cursor-frame");

    const state = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      visible: false,
      frameTarget: null,
      rafId: 0
    };

    function renderCross() {
      cross.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
    }

    function renderFrame() {
      if (!state.frameTarget) {
        frame.style.opacity = "0";
        cross.style.opacity = state.visible ? "1" : "0";
        return;
      }

      const rect = state.frameTarget.getBoundingClientRect();
      frame.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
      frame.style.width = `${rect.width}px`;
      frame.style.height = `${rect.height}px`;
      frame.style.opacity = "1";
      cross.style.opacity = state.visible ? "1" : "0";
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
      renderFrame();
    }

    document.addEventListener("pointermove", (event) => {
      state.x = event.clientX;
      state.y = event.clientY;
      state.visible = true;
      schedule();

      const nextTarget = event.target.closest("[data-cursor-frame]");
      setFrameTarget(nextTarget);
      if (!nextTarget) {
        cross.style.opacity = "1";
      }
    }, { passive: true });

    document.addEventListener("pointerleave", () => {
      state.visible = false;
      state.frameTarget = null;
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
