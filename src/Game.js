import { Food } from "./Food.js?v=7";
import { FIELD_SIZE, Point, Snake } from "./Snake.js?v=7";

const CELL_SIZE = 32;
const START_INTERVAL = 220;
const MIN_INTERVAL = 58;

const DIRECTIONS = {
  ArrowUp: new Point(0, -1),
  ArrowDown: new Point(0, 1),
  ArrowLeft: new Point(-1, 0),
  ArrowRight: new Point(1, 0),
};

class CellSet {
  constructor() {
    this.cells = [];
  }

  clear() {
    this.cells = [];
  }

  add(cell) {
    this.cells.push(cell);
  }

  contains(cell) {
    return this.cells.some((item) => item.equals(cell));
  }
}

class BoardRenderer {
  constructor(root) {
    this.root = root;
    this.app = new PIXI.Application({
      width: FIELD_SIZE * CELL_SIZE,
      height: FIELD_SIZE * CELL_SIZE,
      backgroundAlpha: 0,
      antialias: true,
      forceCanvas: true,
    });

    root.appendChild(this.app.view);
    this.wallLayer = new PIXI.Graphics();
    this.foodLayer = new PIXI.Graphics();
    this.snakeLayer = new PIXI.Graphics();
    this.app.stage.addChild(this.wallLayer, this.foodLayer, this.snakeLayer);
  }

  focus() {
    this.root.focus({ preventScroll: true });
  }

  draw(game) {
    this.drawWalls(game.walls.cells);
    this.drawFood(game.foods, game.mode);
    this.drawSnake(game.snake.body);
  }

  drawCell(layer, point, color, inset = 3, radius = 5) {
    layer.beginFill(color);
    layer.drawRoundedRect(
      point.x * CELL_SIZE + inset,
      point.y * CELL_SIZE + inset,
      CELL_SIZE - inset * 2,
      CELL_SIZE - inset * 2,
      radius,
    );
    layer.endFill();
  }

  drawSnake(body) {
    this.snakeLayer.clear();

    body.forEach((segment, index) => {
      this.drawCell(this.snakeLayer, segment, index === 0 ? 0xa8ff78 : 0x64d66f, 4, 7);
    });

    const head = body[0];
    this.snakeLayer.beginFill(0x102016);
    this.snakeLayer.drawCircle(head.x * CELL_SIZE + 12, head.y * CELL_SIZE + 12, 4);
    this.snakeLayer.drawCircle(head.x * CELL_SIZE + 21, head.y * CELL_SIZE + 12, 4);
    this.snakeLayer.endFill();
  }

  drawFood(foods, mode) {
    this.foodLayer.clear();

    foods.forEach((food, index) => {
      const isSecondPortal = mode === "portal" && index === 1;
      this.foodLayer.beginFill(isSecondPortal ? 0x6eb8ff : 0xff5d5d);
      this.foodLayer.drawCircle(food.x * CELL_SIZE + CELL_SIZE / 2, food.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE * 0.34);
      this.foodLayer.endFill();

      if (mode === "portal") {
        this.foodLayer.lineStyle(2, index === 0 ? 0xf3c969 : 0xb7dcff, 0.95);
        this.foodLayer.drawCircle(
          food.x * CELL_SIZE + CELL_SIZE / 2,
          food.y * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE * 0.42,
        );
      }
    });
  }

  drawWalls(walls) {
    this.wallLayer.clear();
    walls.forEach((wall) => this.drawCell(this.wallLayer, wall, 0x87908a, 2, 2));
  }

}

export class Game {
  constructor(root, ui) {
    this.renderer = new BoardRenderer(root);
    this.ui = ui;
    this.snake = new Snake();
    this.walls = new CellSet();
    this.foods = [];
    this.mode = "classic";
    this.score = 0;
    this.bestScore = Number(localStorage.getItem("snake-best-score") || 0);
    this.state = "menu";
    this.interval = START_INTERVAL;
    this.loopId = null;
    this.overlayTitle = "Snake";
    this.overlaySubtitle = "Ready";

    this.bindInput();
    this.spawnFoods();
    this.ui.update(this);
    this.renderer.draw(this);
  }

  bindInput() {
    window.addEventListener("keydown", (event) => {
      const direction = DIRECTIONS[event.key];
      if (!direction) {
        return;
      }

      event.preventDefault();
      if (this.state === "playing") {
        this.snake.setDirection(direction);
      }
    });
  }

  start(mode) {
    this.mode = mode;
    this.score = 0;
    this.interval = START_INTERVAL;
    this.state = "playing";
    this.overlayTitle = "";
    this.overlaySubtitle = "";
    this.snake.reset();
    this.walls.clear();
    this.spawnFoods();
    this.ui.setPlaying(true);
    this.ui.update(this);
    this.renderer.draw(this);
    this.renderer.focus();
    this.startLoop();
  }

  goToMenu(message = "Ready") {
    this.state = "menu";
    this.stopLoop();
    this.overlayTitle = "Snake";
    this.overlaySubtitle = message;
    this.ui.setPlaying(false);
    this.ui.update(this);
    this.renderer.draw(this);
  }

  exit() {
    this.score = 0;
    this.snake.reset();
    this.walls.clear();
    this.spawnFoods();
    this.goToMenu("Closed");
  }

  gameOver() {
    this.state = "gameover";
    this.stopLoop();
    this.overlayTitle = "Game Over";
    this.overlaySubtitle = "Game Over";
    this.ui.setPlaying(false);
    this.ui.update(this);
    this.renderer.draw(this);
  }

  startLoop() {
    this.stopLoop();
    this.loopId = window.setInterval(() => this.step(), this.interval);
  }

  stopLoop() {
    if (this.loopId !== null) {
      window.clearInterval(this.loopId);
      this.loopId = null;
    }
  }

  step() {
    if (this.state !== "playing") {
      return;
    }

    let next = this.snake.nextHead();
    const wrapped = this.wrapIfNeeded(next);

    if (!wrapped && this.isOutside(next)) {
      this.gameOver();
      return;
    }

    next = wrapped || next;

    const eatenIndex = this.foods.findIndex((food) => food.equals(next));
    const ateFood = eatenIndex !== -1;
    const finalHead = this.mode === "portal" && ateFood ? this.getPortalTarget(eatenIndex) : next;

    if (!this.canEnter(finalHead, ateFood)) {
      return;
    }

    this.snake.moveTo(finalHead, ateFood);

    if (ateFood) {
      this.onFoodEaten();
    }

    this.renderer.draw(this);
  }

  canEnter(point, willGrow) {
    if (this.mode !== "god" && this.snake.occupies(point, !willGrow)) {
      this.gameOver();
      return false;
    }

    if (this.mode === "walls" && this.walls.contains(point)) {
      this.gameOver();
      return false;
    }

    return true;
  }

  onFoodEaten() {
    this.score += 1;
    this.bestScore = Math.max(this.bestScore, this.score);
    localStorage.setItem("snake-best-score", String(this.bestScore));

    if (this.mode === "walls") {
      this.spawnWall();
    }

    if (this.mode === "speed") {
      this.interval = Math.max(MIN_INTERVAL, this.interval * 0.9);
      this.startLoop();
    }

    this.spawnFoods();
    this.ui.update(this);
  }

  spawnFoods() {
    const count = this.mode === "portal" ? 2 : 1;
    this.foods = [];

    for (let i = 0; i < count; i += 1) {
      const food = this.randomFreeCell(this.foods);
      if (food) {
        this.foods.push(Food.fromPoint(food));
      }
    }
  }

  spawnWall() {
    const wall = this.randomFreeCell(this.foods.concat(this.walls.cells));
    if (wall) {
      this.walls.add(wall);
    }
  }

  randomFreeCell(extraBlocked = []) {
    const blocked = new Set([
      ...this.snake.body.map((cell) => cell.key()),
      ...extraBlocked.map((cell) => cell.key()),
    ]);
    const candidates = [];

    for (let y = 0; y < FIELD_SIZE; y += 1) {
      for (let x = 0; x < FIELD_SIZE; x += 1) {
        const point = new Point(x, y);
        if (!blocked.has(point.key())) {
          candidates.push(point);
        }
      }
    }

    if (!candidates.length) {
      this.gameOver();
      return null;
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  getPortalTarget(eatenIndex) {
    return this.foods[eatenIndex === 0 ? 1 : 0];
  }

  wrapIfNeeded(point) {
    if (this.mode !== "god") {
      return null;
    }

    return new Point((point.x + FIELD_SIZE) % FIELD_SIZE, (point.y + FIELD_SIZE) % FIELD_SIZE);
  }

  isOutside(point) {
    return point.x < 0 || point.x >= FIELD_SIZE || point.y < 0 || point.y >= FIELD_SIZE;
  }
}
