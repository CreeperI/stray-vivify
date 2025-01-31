export namespace utils {
  /** return whether a value is between the given states */
  export function between(val: number, vs: [number, number]): boolean{
    let [v1, v2] = vs
    if (v1 > v2) [v1, v2] = [v2, v1]; // Ensure v1 < v2
    return val >= v1 && val <= v2;
  }
}

