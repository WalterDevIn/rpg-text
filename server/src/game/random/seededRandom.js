export function createSeededRandom(seed = 1) {
  let state = Number.isInteger(seed) ? seed >>> 0 : 1;

  return {
    next() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    },
    roll(sides) {
      if (!Number.isInteger(sides) || sides < 1) {
        throw new Error("Dice sides must be a positive integer");
      }
      return Math.floor(this.next() * sides) + 1;
    },
  };
}
