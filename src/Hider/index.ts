import { Unit } from "../Unit";
import { HIDER } from "../";
export class Hider extends Unit {
  public type = HIDER;
  constructor(x: number, y: number, id: number) {
    super(x, y, id);
  }
}