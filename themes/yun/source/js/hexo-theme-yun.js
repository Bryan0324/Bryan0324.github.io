import { a as copyright, d as getScript, i as utils } from "./chunk-72ZP56JR.js";
import "./chunk-FEIY7W7S.js";

window.Yun.utils = utils;

function initTheme() {
  window.Yun.utils.registerToggleSidebar();
  window.Yun.utils.registerScrollPercent();
  window.Yun.utils.insertCopyCodeBtn();
  window.Yun.utils.wrapTable();
  
  // Initialize darken.js for dark mode support
  getScript(
    window.CONFIG.vendors.darken,
    () => {
      new window.darken({
        container: "html",
        class: "dark",
        toggle: "#toggle-mode-btn"
      });
    },
    window.darken
  );
}

copyright();
document.addEventListener("DOMContentLoaded", initTheme);

export { utils };

