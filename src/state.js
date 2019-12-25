import { CROSS, CIRCLE, EMPTY_STRING } from "./constants";
import { winning_pattern } from "./outcome";

export const initialState = {
  winner: "",
  winningPattern: [],
  finished: false,
  player: CROSS,
  board: new Array(9).join("|").split("|")
};

export const ACTION_TYPE_SELECT = 0;
export const ACTION_TYPE_RESET = 1;
export const ACTION_TYPE_UNDO = 2;

export function reducer(state, action) {
  switch (action.type) {
    case ACTION_TYPE_SELECT:
      return state.finished ? reset() : select(state, action.position);
    case ACTION_TYPE_RESET:
      return reset();
    case ACTION_TYPE_UNDO:
      return undo(state);
  }
  return state;
}

let history = [];

function select(state, position) {
  let { board, player, winner, winningPattern, finished } = state;

  if (finished || board[position] !== EMPTY_STRING) {
    return state;
  }

  // maintain history
  history.push({ board, player });

  board = board.slice();
  board[position] = player;

  const pattern = winning_pattern(board, player);
  const hasWinner = pattern !== EMPTY_STRING;

  return Object.assign({}, state, {
    winner: hasWinner ? player : winner,
    winningPattern: hasWinner ? pattern : winningPattern,
    player: player === CROSS ? CIRCLE : CROSS,
    board,
    finished: hasWinner || !board.some(x => x === EMPTY_STRING)
  });
}

function reset() {
  history = [];
  return initialState;
}

function undo(state) {
  const game = history.pop();
  return game === undefined ? state : Object.assign({}, initialState, game);
}
