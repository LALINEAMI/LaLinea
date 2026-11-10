import { randomInt } from "node:crypto";

const SYMBOLS = [
  { id: 'rider', name: 'Rider', payouts: { 2: 4, 3: 60, 4: 120, 5: 240 } },
  { id: 'seed', name: 'Seme', payouts: { 2: 4, 3: 24, 4: 48, 5: 96 } },
  { id: 'flower', name: 'Fiore', payouts: { 2: 4, 3: 28, 4: 56, 5: 112 } },
  { id: 'customer', name: 'Cliente', payouts: { 2: 4, 3: 32, 4: 64, 5: 128 } },
  { id: 'police', name: 'Poliziotto', payouts: { 2: 4, 3: 36, 4: 72, 5: 144 } },
  { id: 'money', name: 'Soldi', payouts: { 2: 4, 3: 48, 4: 96, 5: 192 } },
  { id: 'duomo', name: 'Duomo', payouts: { 2: 4, 3: 54, 4: 108, 5: 216 } },
  { id: 'snow', name: 'Fiocco di neve', payouts: { 2: 4, 3: 40, 4: 80, 5: 160 } },
  { id: 'chocolate', name: 'Cioccolato', payouts: { 2: 4, 3: 38, 4: 76, 5: 152 } },
];
const LINES = [
  [0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1],
  [0, 1, 0, 1, 0],
];
export const BETS = Object.freeze([5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);

const byId = new Map(SYMBOLS.map(symbol => [symbol.id, symbol]));

function makeBoard(rand = randomInt) {
  return Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => SYMBOLS[rand(9)].id));
}
function evaluate(board, bet) {
  if (!BETS.includes(bet)) throw new Error('Scegli una puntata da 5 a 50 punti.');
  if (!Array.isArray(board) || board.length !== 5 || board.some(c => !Array.isArray(c) || c.length !== 3 || c.some(id => !byId.has(id)))) {
    throw new Error('Rulli non validi.');
  }
  const wins = [];
  LINES.forEach((rows, index) => {
    const id = board[0][rows[0]];
    let count = 1;
    while (count < 5 && board[count][rows[count]] === id) count++;
    const multiplier = byId.get(id).payouts[count] || 0;
    if (multiplier) {
      // All multipliers are even, so multiples of 5 points always produce whole LL.
      wins.push({ line: index + 1, symbol: id, count, multiplier, amount: bet * multiplier / LINES.length, cells: rows.slice(0, count).map((row, col) => [col, row]) });
    }
  });
  return { wins, amount: wins.reduce((sum, w) => sum + w.amount, 0) };
}
export function drawSpin() {
  const board = makeBoard();
  // I premi sono lineari: il database applica la puntata effettiva.
  return { board, baseLl: evaluate(board, 5).amount };
}
