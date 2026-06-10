import { Game } from "./Game.js?v=7";
import { GameUI } from "./UI.js?v=7";

window.addEventListener("DOMContentLoaded", () => {
  const ui = new GameUI();
  const game = new Game(document.querySelector("#gameCanvas"), ui);
  ui.connect(game);
});
