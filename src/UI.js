export const MODE_LABELS = {
  classic: "Classic",
  god: "God mode",
  walls: "Walls",
  portal: "Portal",
  speed: "Speed",
};

export class GameUI {
  constructor() {
    this.bestScore = document.querySelector("#bestScore");
    this.currentScore = document.querySelector("#currentScore");
    this.statusText = document.querySelector("#statusText");
    this.playButton = document.querySelector("#playButton");
    this.exitButton = document.querySelector("#exitButton");
    this.menuButton = document.querySelector("#menuButton");
    this.modeList = document.querySelector("#modeList");
    this.message = document.querySelector("#gameMessage");
    this.messageTitle = document.querySelector("#gameMessageTitle");
    this.messageText = document.querySelector("#gameMessageText");
  }

  get selectedMode() {
    return document.querySelector("input[name='mode']:checked").value;
  }

  connect(game) {
    this.playButton.addEventListener("click", () => game.start(this.selectedMode));
    this.exitButton.addEventListener("click", () => game.exit());
    this.menuButton.addEventListener("click", () => game.goToMenu("Paused"));
  }

  setPlaying(isPlaying) {
    this.playButton.hidden = isPlaying;
    this.exitButton.hidden = isPlaying;
    this.menuButton.hidden = !isPlaying;
    this.modeList.disabled = isPlaying;
  }

  update(game) {
    this.bestScore.textContent = game.bestScore;
    this.currentScore.textContent = game.score;
    this.statusText.textContent =
      game.state === "playing"
        ? `${MODE_LABELS[game.mode]}`
        : game.overlaySubtitle;

    this.updateMessage(game);
  }

  updateMessage(game) {
    const isGameOver = game.state === "gameover";
    this.message.hidden = !isGameOver;

    if (isGameOver) {
      this.messageTitle.textContent = "Game Over";
      this.messageText.textContent = "";
      this.messageText.hidden = true;
    }
  }
}
