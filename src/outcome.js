import { EMPTY_STRING, POSSIBLES } from "./constants";

function do_winning_pattern(signature) {
  for (let i = 0, length = POSSIBLES.length; i < length; i++) {
    let possible = POSSIBLES[i];
    if (possible.every(value => signature.indexOf(value) !== -1)) {
      return possible;
    }
  }
  return EMPTY_STRING;
}

/**
 *
 * @param {string[]} board
 * @param {string} player
 * @returns {string}
 */
export function winning_pattern(board, player) {
  if (board.filter(x => x === player).length > 2) {
    return do_winning_pattern(
      board.reduce((accum, x, pos) => {
        if (x === player) {
          accum.push(pos);
        }
        return accum;
      }, [])
    );
  }
  return EMPTY_STRING;
}
