/* narratives.runtime.js
   - Load assets/data/narratives/chapters.registry.json
   - Render cards (JSON narratives)
   - Governance: only published items appear
*/

(function bootNarratives(){
  const grid = document.getElementById("chapters-grid");
  if (!grid) return;

  // ✅ Root page (narratives.html) => relative is stable
  // (If you later move narratives.html into a folder, change to "/assets/..." accordingly)
  const registryUrl = "assets/data/narratives/chapters.registry.json";

  function esc(s){
    return String(s ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function renderError(msg){
    grid.innerHTML = `
      <div class="card">
        <span class="badge not">REGISTRY ERROR</span>
        <h2>Registry load failed</h2>
        <p>${esc(msg)}</p>
        <p><code>${esc(registryUrl)}</code></p>
      </div>
    `;
  }

  function isPublished(ch){
    // ✅ governance: default is NOT published unless explicitly published
    const status = String(ch.status || "").toLowerCase().trim();
    return status === "published";
  }

  function toCaseHref(ch){
    // ✅ unified param: id
    // prefer id; fallback to slug if id missing
    const id = String(ch.id || "").trim();
    const slug = String(ch.slug || "").trim();
    const key = id || slug;
    return "pages/narrative-case.html?id=" + encodeURIComponent(key);
  }

  fetch(registryUrl, { cache: "no-store" })
    .then(r => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(reg => {
      const list = Array.isArray(reg?.chapters) ? reg.chapters : [];
      if (!list.length){
        renderError("No chapters found in registry.");
        return;
      }

      const published = list.filter(isPublished);

      if (!published.length){
        renderError("No published chapters available.");
        return;
      }

      const cards = published.map(ch => {
        const id = String(ch.id || "").trim();
        const slug = String(ch.slug || "").trim();
        const title = String(ch.title || slug || id || "Untitled").trim();
        const subtitle = String(ch.subtitle || "").trim();
        const tags = Array.isArray(ch.tags) ? ch.tags : [];
        const date = String(ch.published_at || ch.date || "").trim();
        const href = toCaseHref(ch);

        return `
          <article class="card" data-id="${esc(id || slug)}">
            <span class="badge must">NON-NORMATIVE</span>
            <h2>${esc(title)}</h2>
            ${subtitle ? `<p>${esc(subtitle)}</p>` : ""}

            <div class="meta">
              ${date ? `<span class="tag">${esc(date)}</span>` : ""}
              ${tags.slice(0,5).map(t => `<span class="tag">#${esc(t)}</span>`).join("")}
            </div>

            <a class="link" href="${esc(href)}">阅读例证 →</a>
          </article>
        `;
      }).join("");

      grid.innerHTML = cards;
    })
    .catch(err => renderError(err?.message || String(err)));
})();
