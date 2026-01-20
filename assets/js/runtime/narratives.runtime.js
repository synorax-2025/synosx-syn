/* narratives.runtime.js
   - Load /assets/data/narratives/chapters.registry.json
   - Render cards (JSON narratives)
   - Governance: only published items appear
*/

(function bootNarratives(){
  const grid = document.getElementById("chapters-grid");
  if (!grid) return;

  // ✅ root-absolute: stable no matter where the page lives
  const registryUrl = "./assets/data/narratives/chapters.registry.json";

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

  function toCaseHref(ch){
    // ✅ canonical param: ch = slug (preferred), fallback to id
    const slug = (ch.slug || "").trim();
    const id = (ch.id || "").trim();
    const key = slug || id;
    return "pages/narrative-case.html?ch=" + encodeURIComponent(key);
  }

  function isPublished(ch){
    // ✅ governance: default is NOT published unless explicitly published
    const status = String(ch.status || "").toLowerCase().trim();
    return status === "published";
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

      // ✅ only published (you can change this rule later)
      const published = list.filter(isPublished);

      if (!published.length){
        renderError("No published chapters available.");
        return;
      }

      const cards = published.map(ch => {
        const id = (ch.id || "").trim();
        const title = (ch.title || ch.slug || id || "Untitled").trim();
        const subtitle = (ch.subtitle || "").trim();
        const tags = Array.isArray(ch.tags) ? ch.tags : [];
        const date = (ch.published_at || ch.date || "").trim();
        const href = toCaseHref(ch);

        return `
          <article class="card" data-id="${esc(id)}">
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
