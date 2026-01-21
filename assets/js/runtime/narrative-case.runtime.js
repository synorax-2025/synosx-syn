/* narrative-case.runtime.js (B Standard)
   - Read ?id=case-01 (or slug)
   - Load ../assets/data/narratives/chapters.registry.json to resolve case_ref
   - Load case json and render blocks
*/

(function bootNarrativeCase(){
  const titleEl = document.getElementById("case-title");
  const subtitleEl = document.getElementById("case-subtitle");
  const contentEl = document.getElementById("case-content");
  if (!titleEl || !subtitleEl || !contentEl) return;

  const params = new URLSearchParams(location.search);
  const idRaw = (params.get("id") || "").trim();

  // pages/narrative-case.html lives in /pages/, so registry is one level up
  const registryUrl = "../assets/data/narratives/chapters.registry.json";

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
      <div class="block-code"><code>${esc("id=" + (idRaw || "null"))}</code></div>
      <div class="block-code"><code>${esc("registry=" + registryUrl)}</code></div>
    `;
  }

  function renderCase(doc){
    const pageTitle = doc?.title
      ? `${doc.title} · Narrative Case · SynOSX`
      : `Narrative Case · SynOSX`;

    document.title = pageTitle;
    setMetaDescription(doc?.subtitle || doc?.summary || "Non-normative illustrative case.");

    titleEl.textContent = doc?.title || (idRaw || "Unknown");
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

        // fallback: don't swallow content
        if (b && (b.text || b.heading)){
          return `<p class="block-p">${esc(b.text || "")}</p>`;
        }

        return "";
      }).join("");

      return `<section class="case-sec">${h}${bhtml}</section>`;
    }).join("");

    contentEl.innerHTML = html;
  }

  /**
   * Convert a case_ref into a URL that works from /pages/
   * Accepts:
   *   - "/assets/..." => "../assets/..."
   *   - "assets/..."  => "../assets/..."
   *   - "./assets/..."=> "../assets/..."
   *   - "../assets/..." stays
   *   - "/registry/..." => "../registry/..."
   *   - "registry/..."  => "../registry/..."
   */
  function resolveCaseUrlFromRef(caseRef){
    const ref = String(caseRef || "").trim();
    if (!ref) return null;

    const cleaned = ref.replaceAll("\\", "/").replace(/^\.\//, "");

    if (cleaned.startsWith("../")) return cleaned;

    if (cleaned.startsWith("/")) {
      // absolute-from-site-root => from /pages/ we need "../"
      return ".." + cleaned;
    }

    // relative-from-site-root-like => from /pages/ we need "../"
    return "../" + cleaned;
  }

  function matchChapter(ch, id){
    if (!ch) return false;
    const cid = String(ch.id || "").trim();
    const slug = String(ch.slug || "").trim();
    return cid === id || slug === id;
  }

  if (!idRaw){
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
      const hit = list.find(x => matchChapter(x, idRaw));

      if (!hit) throw new Error("Chapter not found in registry: " + idRaw);
      if (!hit.case_ref) throw new Error("Missing case_ref in registry for: " + (hit.id || hit.slug || idRaw));

      const caseUrl = resolveCaseUrlFromRef(hit.case_ref);
      if (!caseUrl) throw new Error("Invalid case_ref for: " + (hit.id || hit.slug || idRaw));

      return fetch(caseUrl, { cache: "no-store" })
        .then(r => {
          if (!r.ok) throw new Error("Case HTTP " + r.status + " (" + caseUrl + ")");
          return r.json();
        });
    })
    .then(doc => renderCase(doc))
    .catch(err => renderError(err?.message || String(err)));
})();
