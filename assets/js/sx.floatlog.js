// sx.floatlog.js — SynOSX Audit Engine Log Writer (兼容旧 API 版本)
// - 不负责拖动 / Dock（这些交给 sx.dock.js）
// - 只负责：往 .sx-floatlog__body 里写行、分隔线、清空等
// - 对外暴露 window.SXFloatLog.append(...) 等旧方法

(function () {
  "use strict";

  // 找到当前 Audit Dock 里的元素
  const root =
    document.getElementById("sxDockAudit") ||
    document.querySelector(".sx-dock") ||
    null;

  const bodyEl =
    document.getElementById("sxFloatlogBody") ||
    (root ? root.querySelector(".sx-floatlog__body") : null);

  const titleEl = root ? root.querySelector(".sx-floatlog__titleText") : null;
  const dotEl = root ? root.querySelector(".sx-floatlog__dot") : null;

  if (!root || !bodyEl) {
    console.warn("[SX-FLOATLOG] Dock root or body not found; logging disabled.");
    return;
  }

  // ------- 工具函数 -------

  function scrollToBottom() {
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function mkLine(entry) {
    const mark = entry.mark ?? ">";
    const text = entry.text ?? "";
    const muted = !!entry.muted;

    const line = document.createElement("div");
    line.className = "sx-floatlog__line" + (muted ? " is-muted" : "");
    line.innerHTML = `
      <span class="sx-floatlog__mark">${escapeHtml(mark)}</span>
      <span class="sx-floatlog__text">${escapeHtml(text)}</span>
    `;
    return line;
  }

  function mkHr() {
    const hr = document.createElement("div");
    hr.className = "sx-floatlog__hr";
    return hr;
  }

  // ------- 兼容旧 API 的对象 -------

  const api = {
    // 以前有 ensure()，现在简单返回元素
    ensure() {
      return { root, parts: { body: bodyEl, titleText: titleEl, dot: dotEl } };
    },

    open() {
      root.classList.remove("is-hidden");
      return this;
    },

    close() {
      root.classList.add("is-hidden");
      return this;
    },

    clear() {
      bodyEl.innerHTML = "";
      return this;
    },

    hr() {
      bodyEl.appendChild(mkHr());
      scrollToBottom();
      return this;
    },

    // 关键：兼容旧的 append(entry) 调用方式
    append(entry) {
      // 任何输出都会让窗口重新可见
      root.classList.remove("is-hidden");
      root.classList.remove("sx-dock--hidden"); // ⭐ 同时去掉 dock 的隐藏态

      if (typeof entry === "string") {
        bodyEl.appendChild(
          mkLine({ mark: ">", text: entry, muted: false })
        );
      } else {
        const e = entry || {};
        bodyEl.appendChild(
          mkLine({
            mark: e.mark,
            text: e.text,
            muted: e.muted,
          })
        );
      }

      scrollToBottom();
      return this;
    },

    setTitle(text) {
      if (titleEl) titleEl.textContent = String(text ?? "");
      return this;
    },

    setDot(on) {
      if (dotEl) dotEl.style.opacity = on ? "0.9" : "0.15";
      return this;
    },

    // 旧的 resetPosition / isOpen 保留签名，简单实现
    resetPosition() {
      // 位置现在交给 sx.dock.js，这里不再处理
      return this;
    },

    isOpen() {
      return !root.classList.contains("is-hidden");
    },
  };

  // 暴露兼容名：老代码用 SXFloatLog，新代码也可以用 SXFloatlog
  window.SXFloatLog = api;
  window.SXFloatlog = api;

})();
