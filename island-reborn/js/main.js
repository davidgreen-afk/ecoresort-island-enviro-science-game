/* Island Reborn: entry point. */
(function () {
  const saved = window.Model.load();
  window.UI.boot(saved && saved.v === 1 ? saved : null);
})();
