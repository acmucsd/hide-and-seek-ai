import { Unit } from "../Unit";
import { SEEKER } from "../";
export class Seeker extends Unit {
  public type = SEEKER;
  constructor(x: number, y: number, id: number) {
    super(x, y, id);
  }
}