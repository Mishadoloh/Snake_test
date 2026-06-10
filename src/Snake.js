export const FIELD_SIZE = 20;
export const START_LENGTH = 3;

export class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  equals(other) {
    return this.x === other.x && this.y === other.y;
  }

  add(other) {
    return new Point(this.x + other.x, this.y + other.y);
  }

  key() {
    return `${this.x},${this.y}`;
  }
}

export class Snake {
  constructor() {
    this.reset();
  }

  reset() {
    const center = Math.floor(FIELD_SIZE / 2);
    this.body = Array.from({ length: START_LENGTH }, (_, index) => new Point(center + 1 - index, center));
    this.direction = new Point(1, 0);
    this.pendingDirection = new Point(1, 0);
  }

  get head() {
    return this.body[0];
  }

  setDirection(next) {
    const isReverse = this.pendingDirection.x + next.x === 0 && this.pendingDirection.y + next.y === 0;
    if (!isReverse) {
      this.pendingDirection = new Point(next.x, next.y);
    }
  }

  nextHead() {
    this.direction = this.pendingDirection;
    return this.head.add(this.direction);
  }

  moveTo(point, grow = false) {
    this.body.unshift(point);
    if (!grow) {
      this.body.pop();
    }
  }

  occupies(point, ignoreTail = false) {
    const segments = ignoreTail ? this.body.slice(0, -1) : this.body;
    return segments.some((segment) => segment.equals(point));
  }
}
