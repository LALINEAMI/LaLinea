"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

const ROWS = 20;
const COLS = 10;

type Cell = PieceName | null;
type Board = Cell[][];
type PieceName = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

type Piece = {
  name: PieceName;
  shape: number[][];
  x: number;
  y: number;
};

type DisplayCell =
  | {
      name: PieceName;
      ghost?: boolean;
    }
  | null;

const SHAPES: Record<PieceName, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
};

const COLORS: Record<PieceName, string> = {
  I: "#22d3ee",
  O: "#facc15",
  T: "#e879f9",
  S: "#4ade80",
  Z: "#fb7185",
  J: "#60a5fa",
  L: "#fb923c",
};

const PIECES = Object.keys(SHAPES) as PieceName[];
const SCORE_TABLE = [0, 100, 300, 500, 800];

const emptyBoard = (): Board =>
  Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));

const cloneShape = (shape: number[][]) => shape.map((row) => [...row]);

const makePiece = (name: PieceName): Piece => {
  const shape = cloneShape(SHAPES[name]);
  return {
    name,
    shape,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0,
  };
};

const shuffle = (items: PieceName[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const rotateShape = (shape: number[][]) =>
  shape[0].map((_, columnIndex) =>
    shape.map((row) => row[columnIndex]).reverse()
  );

const collides = (
  board: Board,
  piece: Piece,
  offsetX = 0,
  offsetY = 0,
  shape = piece.shape
) => {
  for (let row = 0; row < shape.length; row += 1) {
    for (let col = 0; col < shape[row].length; col += 1) {
      if (!shape[row][col]) continue;

      const boardX = piece.x + col + offsetX;
      const boardY = piece.y + row + offsetY;

      if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return true;
      if (boardY >= 0 && board[boardY][boardX]) return true;
    }
  }
  return false;
};

const mergePiece = (board: Board, piece: Piece) => {
  const next = board.map((row) => [...row]);

  piece.shape.forEach((row, rowIndex) => {
    row.forEach((filled, colIndex) => {
      if (!filled) return;
      const x = piece.x + colIndex;
      const y = piece.y + rowIndex;
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
        next[y][x] = piece.name;
      }
    });
  });

  return next;
};

const clearCompletedLines = (board: Board) => {
  const remaining = board.filter((row) => row.some((cell) => cell === null));
  const cleared = ROWS - remaining.length;
  const newRows = Array.from({ length: cleared }, () =>
    Array<Cell>(COLS).fill(null)
  );

  return {
    board: [...newRows, ...remaining],
    cleared,
  };
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("it-IT").format(value);

function PiecePreview({ name }: { name: PieceName | null }) {
  if (!name) {
    return (
      <div className="flex min-h-[58px] items-center justify-center text-[9px] font-black uppercase tracking-[0.12em] text-zinc-700">
        Vuoto
      </div>
    );
  }

  const shape = SHAPES[name];

  return (
    <div className="flex min-h-[58px] items-center justify-center">
      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${shape[0].length}, 12px)` }}
      >
        {shape.flatMap((row, rowIndex) =>
          row.map((filled, colIndex) => (
            <div
              key={`${name}-${rowIndex}-${colIndex}`}
              className="h-3 w-3 rounded-[3px]"
              style={{
                background: filled
                  ? `linear-gradient(145deg, rgba(255,255,255,.48), ${COLORS[name]} 36%, ${COLORS[name]} 72%, rgba(0,0,0,.42))`
                  : "transparent",
                boxShadow: filled
                  ? `0 0 8px ${COLORS[name]}88, inset 0 0 0 1px rgba(255,255,255,.30)`
                  : "none",
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function TetrisGame() {
  const bagRef = useRef<PieceName[]>([]);
  const gestureStart = useRef<{ x: number; y: number } | null>(null);
  const flashTimer = useRef<number | null>(null);

  const [board, setBoard] = useState<Board>(() => emptyBoard());
  const [active, setActive] = useState<Piece>(() => makePiece("T"));
  const [nextNames, setNextNames] = useState<PieceName[]>(["I", "O", "L"]);
  const [holdName, setHoldName] = useState<PieceName | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [combo, setCombo] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lineFlash, setLineFlash] = useState(0);

  const level = Math.floor(lines / 10) + 1;
  const speed = Math.max(90, 730 - (level - 1) * 58);

  const takeName = useCallback((): PieceName => {
    if (bagRef.current.length === 0) {
      bagRef.current = shuffle(PIECES);
    }
    return bagRef.current.shift() as PieceName;
  }, []);

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem("lalinea-tetris-highscore") || 0);
      if (Number.isFinite(saved)) setHighScore(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (score <= highScore) return;
    setHighScore(score);
    try {
      window.localStorage.setItem("lalinea-tetris-highscore", String(score));
    } catch {}
  }, [highScore, score]);

  useEffect(() => {
    return () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const buzz = useCallback((pattern: number | number[]) => {
    try {
      navigator.vibrate?.(pattern);
    } catch {}
  }, []);

  const refillQueue = useCallback(
    (queue: PieceName[]) => {
      const next = [...queue];
      while (next.length < 3) next.push(takeName());
      return next;
    },
    [takeName]
  );

  const resetGame = useCallback(() => {
    bagRef.current = [];
    const first = takeName();
    const queue = refillQueue([]);

    setBoard(emptyBoard());
    setActive(makePiece(first));
    setNextNames(queue);
    setHoldName(null);
    setCanHold(true);
    setScore(0);
    setLines(0);
    setCombo(0);
    setLineFlash(0);
    setGameOver(false);
    setRunning(true);
    buzz(24);
  }, [buzz, refillQueue, takeName]);

  const spawnFromQueue = useCallback(() => {
    const [first, ...rest] = nextNames;
    const name = first ?? takeName();
    const queue = refillQueue(rest);
    setNextNames(queue);
    return makePiece(name);
  }, [nextNames, refillQueue, takeName]);

  const showLineEffect = useCallback(
    (cleared: number) => {
      if (!cleared) return;
      setLineFlash(cleared);
      buzz(cleared === 4 ? [35, 30, 80] : 35);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setLineFlash(0), 760);
    },
    [buzz]
  );

  const lockPiece = useCallback(
    (pieceToLock: Piece) => {
      const merged = mergePiece(board, pieceToLock);
      const result = clearCompletedLines(merged);
      const nextCombo = result.cleared > 0 ? combo + 1 : 0;
      const comboBonus = result.cleared > 0 ? Math.max(0, nextCombo - 1) * 50 * level : 0;
      const linePoints = (SCORE_TABLE[result.cleared] ?? 0) * level + comboBonus;
      const incoming = spawnFromQueue();

      setBoard(result.board);
      setLines((value) => value + result.cleared);
      setCombo(nextCombo);
      setScore((value) => value + linePoints + 10);
      setCanHold(true);
      showLineEffect(result.cleared);

      if (collides(result.board, incoming)) {
        setActive(incoming);
        setRunning(false);
        setGameOver(true);
        buzz([60, 45, 60]);
        return;
      }

      setActive(incoming);
    },
    [board, buzz, combo, level, showLineEffect, spawnFromQueue]
  );

  const move = useCallback(
    (dx: number, dy: number) => {
      if (!running || gameOver) return;

      if (!collides(board, active, dx, dy)) {
        setActive((piece) => ({ ...piece, x: piece.x + dx, y: piece.y + dy }));
        if (dy > 0) setScore((value) => value + 1);
        return;
      }

      if (dy > 0) lockPiece(active);
    },
    [active, board, gameOver, lockPiece, running]
  );

  const rotate = useCallback(() => {
    if (!running || gameOver) return;

    const rotated = rotateShape(active.shape);
    const kicks = [0, -1, 1, -2, 2];

    for (const kick of kicks) {
      if (!collides(board, active, kick, 0, rotated)) {
        setActive((piece) => ({ ...piece, x: piece.x + kick, shape: rotated }));
        buzz(8);
        return;
      }
    }
  }, [active, board, buzz, gameOver, running]);

  const hardDrop = useCallback(() => {
    if (!running || gameOver) return;

    let distance = 0;
    while (!collides(board, active, 0, distance + 1)) distance += 1;

    const dropped = { ...active, y: active.y + distance };
    setScore((value) => value + distance * 2);
    buzz(18);
    lockPiece(dropped);
  }, [active, board, buzz, gameOver, lockPiece, running]);

  const hold = useCallback(() => {
    if (!running || gameOver || !canHold) return;

    const currentName = active.name;

    if (holdName) {
      const incoming = makePiece(holdName);
      if (collides(board, incoming)) return;
      setActive(incoming);
      setHoldName(currentName);
    } else {
      setHoldName(currentName);
      setActive(spawnFromQueue());
    }

    setCanHold(false);
    buzz(12);
  }, [active.name, board, buzz, canHold, gameOver, holdName, running, spawnFromQueue]);

  useEffect(() => {
    if (!running || gameOver) return;
    const timer = window.setInterval(() => move(0, 1), speed);
    return () => window.clearInterval(timer);
  }, [gameOver, move, running, speed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " ", "Shift"].includes(
          event.key
        )
      ) {
        event.preventDefault();
      }

      if (event.key === "ArrowLeft") move(-1, 0);
      if (event.key === "ArrowRight") move(1, 0);
      if (event.key === "ArrowDown") move(0, 1);
      if (event.key === "ArrowUp") rotate();
      if (event.key === " ") hardDrop();
      if (event.key === "Shift" || event.key.toLowerCase() === "c") hold();
      if (event.key.toLowerCase() === "p" && !gameOver) setRunning((value) => !value);
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gameOver, hardDrop, hold, move, rotate]);

  const ghostY = useMemo(() => {
    let distance = 0;
    while (!collides(board, active, 0, distance + 1)) distance += 1;
    return active.y + distance;
  }, [active, board]);

  const displayBoard = useMemo(() => {
    const visible: DisplayCell[][] = board.map((row) =>
      row.map((cell) => (cell ? { name: cell } : null))
    );

    active.shape.forEach((row, rowIndex) => {
      row.forEach((filled, colIndex) => {
        if (!filled) return;
        const x = active.x + colIndex;
        const y = ghostY + rowIndex;
        if (y >= 0 && y < ROWS && x >= 0 && x < COLS && !visible[y][x]) {
          visible[y][x] = { name: active.name, ghost: true };
        }
      });
    });

    active.shape.forEach((row, rowIndex) => {
      row.forEach((filled, colIndex) => {
        if (!filled) return;
        const x = active.x + colIndex;
        const y = active.y + rowIndex;
        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
          visible[y][x] = { name: active.name };
        }
      });
    });

    return visible;
  }, [active, board, ghostY]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    gestureStart.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = gestureStart.current;
    gestureStart.current = null;
    if (!start || !running || gameOver) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX < 18 && absY < 18) {
      rotate();
      return;
    }

    if (absX > absY && absX > 24) {
      move(dx > 0 ? 1 : -1, 0);
      return;
    }

    if (dy > 82) {
      hardDrop();
      return;
    }

    if (dy > 24) move(0, 1);
  };

  const statusText = gameOver
    ? "GAME OVER"
    : running
      ? level >= 5
        ? "MILANO MODE"
        : "IN CORSA"
      : score > 0
        ? "IN PAUSA"
        : "PRONTO";

  return (
    <div className="relative mx-auto w-full max-w-[430px] select-none overflow-hidden rounded-[28px] border-2 border-yellow-300 bg-black p-3 text-white shadow-[0_0_42px_rgba(250,204,21,.25)] sm:p-4">
      <style>{`
        @keyframes llTetrisGlow {
          0%, 100% { opacity: .38; transform: scale(.96); }
          50% { opacity: .9; transform: scale(1.06); }
        }
        @keyframes llTetrisScan {
          0% { transform: translateY(-120%); opacity: 0; }
          15%, 85% { opacity: .35; }
          100% { transform: translateY(850%); opacity: 0; }
        }
        @keyframes llTetrisLine {
          0% { opacity: 0; transform: scale(.82); }
          28% { opacity: 1; transform: scale(1.08); }
          100% { opacity: 0; transform: scale(1); }
        }
        .ll-tetris-neon-title {
          background: linear-gradient(90deg,#facc15 0%,#4ade80 28%,#22d3ee 50%,#e879f9 72%,#facc15 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 8px rgba(250,204,21,.34));
        }
      `}</style>

      <div className="pointer-events-none absolute -left-20 -top-24 h-52 w-52 rounded-full bg-yellow-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative mb-3 overflow-hidden rounded-2xl border border-yellow-400/45 bg-zinc-950/95 px-3 py-3 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-70" />
        <p className="text-[9px] font-black uppercase tracking-[0.34em] text-yellow-400">
          LALINEA // MILANO EDITION
        </p>
        <h2 className="ll-tetris-neon-title mt-1 text-[1.55rem] font-black uppercase leading-none tracking-[-0.04em] sm:text-3xl">
          TETRIS: CHIUDI LA LINEA
        </h2>
        <div className="mt-2 flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">
          <span className="rounded-full border border-green-400/40 bg-green-400/10 px-2 py-1 text-green-300">
            {statusText}
          </span>
          <span>Blocca · Incastra · Fai Linea</span>
        </div>
      </div>

      <div className="relative mb-3 grid grid-cols-4 gap-1.5 text-center sm:gap-2">
        {[
          ["PUNTI", formatNumber(score), "text-cyan-300"],
          ["RECORD", formatNumber(highScore), "text-green-300"],
          ["LINEE", String(lines), "text-yellow-300"],
          ["LIVELLO", String(level), "text-fuchsia-300"],
        ].map(([label, value, color]) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-700 bg-zinc-950/95 px-1.5 py-2 shadow-[0_0_12px_rgba(250,204,21,0.06)]"
          >
            <p className="text-[7px] font-black uppercase tracking-[0.10em] text-zinc-500 sm:text-[8px]">
              {label}
            </p>
            <p className={`mt-0.5 truncate text-[13px] font-black sm:text-base ${color}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="relative grid grid-cols-[minmax(0,1fr)_74px] items-start gap-2.5 sm:grid-cols-[minmax(0,1fr)_92px] sm:gap-3">
        <div className="relative mx-auto w-full max-w-[270px] sm:max-w-[300px]">
          <div
            className={`relative grid aspect-[1/2] w-full touch-none overflow-hidden rounded-2xl border-2 bg-zinc-950 transition ${
              lineFlash
                ? "border-green-300 shadow-[0_0_34px_rgba(74,222,128,.46)]"
                : "border-yellow-300 shadow-[0_0_30px_rgba(250,204,21,.22)]"
            }`}
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
            aria-label="Campo di gioco Tetris LaLinea"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-20 h-10 bg-gradient-to-b from-yellow-300/5 to-transparent"
              style={{ animation: running ? "llTetrisScan 3.8s linear infinite" : "none" }}
            />

            {displayBoard.flatMap((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const color = cell ? COLORS[cell.name] : "#09090b";
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="aspect-square border border-black/50"
                    style={{
                      background: cell
                        ? cell.ghost
                          ? "rgba(255,255,255,.03)"
                          : `linear-gradient(145deg, rgba(255,255,255,.52), ${color} 34%, ${color} 73%, rgba(0,0,0,.46))`
                        : "linear-gradient(145deg,#0d0d10,#070709)",
                      boxShadow: cell
                        ? cell.ghost
                          ? `inset 0 0 0 1px ${color}99, 0 0 5px ${color}22`
                          : `inset 0 0 0 1px rgba(255,255,255,.25), inset 0 -4px 8px rgba(0,0,0,.20), 0 0 7px ${color}55`
                        : "inset 0 0 0 1px rgba(255,255,255,.018)",
                    }}
                  />
                );
              })
            )}
          </div>

          {lineFlash > 0 && (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
              <div
                className="rounded-2xl border-2 border-green-300 bg-black/88 px-4 py-3 text-center shadow-[0_0_35px_rgba(74,222,128,.62)]"
                style={{ animation: "llTetrisLine .76s ease-out forwards" }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-green-300">
                  {lineFlash === 4 ? "LALINEA SPECIAL" : "LINEA CHIUSA"}
                </p>
                <p className="mt-1 text-xl font-black uppercase text-white">
                  {lineFlash === 4 ? "TETRIS ×4" : `+${lineFlash} LINEA${lineFlash > 1 ? "E" : ""}`}
                </p>
              </div>
            </div>
          )}

          {!running && !gameOver && score === 0 && (
            <button
              type="button"
              onClick={resetGame}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-black/82 px-4 text-center backdrop-blur-[2px]"
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-yellow-300 bg-yellow-400/10 text-3xl text-yellow-300 shadow-[0_0_30px_rgba(250,204,21,.36)]"
                style={{ animation: "llTetrisGlow 1.5s ease-in-out infinite" }}
              >
                ▶
              </span>
              <span className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-yellow-300">
                Tocca e fai Linea
              </span>
              <span className="mt-1 max-w-[190px] text-[9px] font-bold uppercase leading-relaxed text-zinc-400">
                La città sale blocco dopo blocco. Non lasciare spazi.
              </span>
            </button>
          )}

          {!running && !gameOver && score > 0 && (
            <button
              type="button"
              onClick={() => setRunning(true)}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-black/82 text-center backdrop-blur-[2px]"
            >
              <span className="text-4xl text-yellow-300">Ⅱ</span>
              <span className="mt-2 text-sm font-black uppercase tracking-[0.16em] text-yellow-300">
                LaLinea in pausa
              </span>
              <span className="mt-1 text-[9px] font-bold uppercase text-zinc-400">
                Tocca per tornare in strada
              </span>
            </button>
          )}

          {gameOver && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-2xl bg-black/90 px-5 text-center backdrop-blur-[2px]">
              <p className="text-[10px] font-black uppercase tracking-[0.30em] text-red-300">
                Fine corsa
              </p>
              <p className="mt-1 text-3xl font-black uppercase text-white">Game Over</p>
              <p className="mt-2 text-xs font-black uppercase text-yellow-300">
                {formatNumber(score)} punti
              </p>
              <button
                type="button"
                onClick={resetGame}
                className="mt-5 rounded-xl border border-yellow-300 bg-yellow-400 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black shadow-[0_0_20px_rgba(250,204,21,.30)]"
              >
                Nuova corsa
              </button>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-2">
          <div className="rounded-xl border border-zinc-700 bg-zinc-950/95 p-2 text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-zinc-500">Prossimo</p>
            <PiecePreview name={nextNames[0] ?? null} />
          </div>

          <button
            type="button"
            onClick={hold}
            disabled={!canHold || !running || gameOver}
            className="w-full rounded-xl border border-cyan-400/45 bg-cyan-400/5 p-2 text-center transition disabled:opacity-35"
          >
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-cyan-300">Hold</p>
            <PiecePreview name={holdName} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (gameOver || (score === 0 && !running)) resetGame();
              else setRunning((value) => !value);
            }}
            className="min-h-10 w-full rounded-xl border border-yellow-300 bg-yellow-400 px-1 py-2 text-[9px] font-black uppercase text-black shadow-[0_0_14px_rgba(250,204,21,.22)]"
          >
            {gameOver ? "Rigioca" : running ? "Pausa" : score === 0 ? "Start" : "Riprendi"}
          </button>

          <button
            type="button"
            onClick={resetGame}
            className="min-h-9 w-full rounded-xl border border-zinc-700 bg-black px-1 py-2 text-[8px] font-black uppercase text-zinc-400"
          >
            Reset
          </button>

          <div className="rounded-xl border border-green-400/25 bg-green-400/5 px-1.5 py-2 text-center">
            <p className="text-[7px] font-black uppercase tracking-[0.12em] text-green-300">
              Combo
            </p>
            <p className="mt-0.5 text-base font-black text-white">×{combo}</p>
          </div>
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-6 gap-1.5">
        <button
          type="button"
          aria-label="Sposta a sinistra"
          onClick={() => move(-1, 0)}
          className="min-h-12 rounded-xl border border-cyan-400/50 bg-zinc-950 text-xl font-black text-cyan-300 active:bg-cyan-300 active:text-black"
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Ruota"
          onClick={rotate}
          className="min-h-12 rounded-xl border border-fuchsia-400/60 bg-zinc-950 text-xl font-black text-fuchsia-300 active:bg-fuchsia-300 active:text-black"
        >
          ↻
        </button>
        <button
          type="button"
          aria-label="Scendi"
          onClick={() => move(0, 1)}
          className="min-h-12 rounded-xl border border-yellow-400/60 bg-zinc-950 text-xl font-black text-yellow-300 active:bg-yellow-300 active:text-black"
        >
          ↓
        </button>
        <button
          type="button"
          aria-label="Sposta a destra"
          onClick={() => move(1, 0)}
          className="min-h-12 rounded-xl border border-green-400/50 bg-zinc-950 text-xl font-black text-green-300 active:bg-green-300 active:text-black"
        >
          →
        </button>
        <button
          type="button"
          aria-label="Metti in hold"
          onClick={hold}
          disabled={!canHold || !running || gameOver}
          className="min-h-12 rounded-xl border border-blue-400/50 bg-zinc-950 text-[10px] font-black uppercase text-blue-300 active:bg-blue-300 active:text-black disabled:opacity-35"
        >
          Hold
        </button>
        <button
          type="button"
          aria-label="Caduta rapida"
          onClick={hardDrop}
          className="min-h-12 rounded-xl border border-orange-400/60 bg-zinc-950 text-base font-black text-orange-300 active:bg-orange-300 active:text-black"
        >
          ⇊
        </button>
      </div>

      <div className="relative mt-3 rounded-xl border border-yellow-400/20 bg-yellow-400/[0.04] px-3 py-2 text-center">
        <p className="text-[8px] font-black uppercase leading-relaxed tracking-[0.10em] text-zinc-500 sm:text-[9px]">
          Mobile: tap = ruota · swipe = muovi · swipe lungo ↓ = drop · Hold conserva il pezzo
        </p>
        <p className="mt-1 hidden text-[8px] font-black uppercase text-zinc-600 sm:block">
          Desktop: ← → muovi · ↑ ruota · ↓ scendi · spazio drop · C/Shift hold · P pausa
        </p>
      </div>
    </div>
  );
}
