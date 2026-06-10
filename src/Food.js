import { Point } from "./Snake.js?v=7";

export class Food extends Point {
  constructor(x, y) {
    super(x, y);
  }

  static fromPoint(point) {
    return new Food(point.x, point.y);
  }
}
