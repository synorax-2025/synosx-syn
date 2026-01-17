/* narrative-case.runtime.js
   - Read ?id=case-01
   - Load ../registry/narratives/chapters.registry.json to resolve case_ref
   - Load case json and render blocks
*/

(function bootNarrativeCase(){
  const titleEl = document.getElementById("case-title");
  const subtitleEl = document.getElementById("case-subtitle");
  const contentEl = document.getElementById("case-content");
  if (!titleEl || !subtitleEl || !contentEl) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const registryUrl = "../registry/narratives/chapters.registry.json";

  function esc(s){
    return String(s ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function setMetaDescription(text){
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", String(text || ""));
  }

  function renderError(msg){
    titleEl.textContent = "Case not available";
    subtitleEl.textContent = "章节加载失败";
    contentEl.innerHTML = `
      <p class="block-p">${esc(msg)}</p>
      <div class="block-code"><code>${esc("id=" + (id ?? "null"))}</code></div>
      <div class="block-code"><code>${esc("registry=" + registryUrl)}</code></div>
    `;
  }

  function renderCase(doc){
    const pageTitle = doc?.title ? `${doc.title} · Narrative Case · SynOSX` : `Narrative Case · SynOSX`;
    document.title = pageTitle;
    setMetaDescription(doc?.subtitle || doc?.summary || "Non-normative illustrative case.");

    titleEl.textContent = doc?.title || (id || "Unknown");
    subtitleEl.textContent = doc?.subtitle || (doc?.summary || "Non-normative illustrative case.");

    const sections = Array.isArray(doc?.sections) ? doc.sections : [];
    if (!sections.length){
      contentEl.innerHTML = `<p class="block-p">No content.</p>`;
      return;
    }

    const html = sections.map(sec => {
      const h = sec?.heading ? `<h2 class="block-h">${esc(sec.heading)}</h2>` : "";
      const blocks = Array.isArray(sec?.blocks) ? sec.blocks : [];

      const bhtml = blocks.map(b => {
        const t = b?.type;

        if (t === "p"){
          return `<p class="block-p">${esc(b.text)}</p>`;
        }

        if (t === "list"){
          const items = Array.isArray(b.items) ? b.items : [];
          return `
            <ul class="block-list">
              ${items.map(it => `<li>${esc(it)}</li>`).join("")}
            </ul>
          `;
        }

        if (t === "quote"){
          const by = b.by ? `<div class="by">— ${esc(b.by)}</div>` : "";
          return `<div class="block-quote">${esc(b.text)}${by}</div>`;
        }

        if (t === "code"){
          return `<div class="block-code"><code>${esc(b.text)}</code></div>`;
        }

        // ✅ fallback: 不吞内容，至少把未知块吐出来，方便你发现 schema 问题
        if (b && (b.text || b.heading)){
          return `<p class="block-p">${esc(b.text || "")}</p>`;
        }

        return "";
      }).join("");

      return `<section class="case-sec">${h}${bhtml}</section>`;
    }).join("");

    contentEl.innerHTML = html;
  }

  function resolveCaseUrlFromRef(caseRef){
    const ref = String(caseRef || "").trim();
    if (!ref) return null;

    // Normalize:
    // - remove leading "./"
    // - if starts with "/", treat as site-root relative: "/registry/..." => "../registry/..." from /pages/
    // - if starts with "../", keep as-is (already relative to /pages/)
    // - else treat as site-root relative path string, prefix "../"
    const cleaned = ref.replace(/^\.\//, "");

    if (cleaned.startsWith("../")) return cleaned;
    if (cleaned.startsWith("/")) return ".." + cleaned; // from /pages/
    return "../" + cleaned;
  }

  // ✅ 必须有 id，否则直接报错（不要默认 case-01）
  if (!id){
    renderError("Missing query param: ?id=...");
    return;
  }

  fetch(registryUrl, { cache: "no-store" })
    .then(r => {
      if (!r.ok) throw new Error("Registry HTTP " + r.status);
      return r.json();
    })
    .then(reg => {
      const list = Array.isArray(reg?.chapters) ? reg.chapters : [];
      const hit = list.find(x => x && x.id === id);

      if (!hit) throw new Error("Chapter not found in registry: " + id);
      if (!hit.case_ref) throw new Error("Missing case_ref in registry for: " + id);

      const caseUrl = resolveCaseUrlFromRef(hit.case_ref);
      if (!caseUrl) throw new Error("Invalid case_ref for: " + id);

      return fetch(caseUrl, { cache: "no-store" })
        .then(r => {
          if (!r.ok) throw new Error("Case HTTP " + r.status + " (" + caseUrl + ")");
          return r.json();
        });
    })
    .then(doc => renderCase(doc))
    .catch(err => renderError(err?.message || String(err)));
})();
