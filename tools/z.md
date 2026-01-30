tools/
  build-includes.mjs          # main (读配置 + copy + rebuild)
  lib/
    html.fs.mjs               # readText/readJson/copyDir/listHtmlFilesRec
    html.util.mjs             # escapeHtml/attr/joinClasses/safeId/mergeDeep
    html.render.nav.mjs       # renderNavShell + desktop/drawer/actions
    html.render.docmenu.mjs   # document-menu 注入修正（assets prefix）
