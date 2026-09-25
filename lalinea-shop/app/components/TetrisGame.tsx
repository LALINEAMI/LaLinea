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

type TetrisReward = {
  level: number;
  amount: 5 | 10;
  code: string;
};

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

const PLAYER_ID_KEY = "lalinea-tetris-player-id";

const getOrCreatePlayerId = () => {
  try {
    const existing = window.localStorage.getItem(PLAYER_ID_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,96}$/.test(existing)) return existing;

    const created =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `ll-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;

    window.localStorage.setItem(PLAYER_ID_KEY, created);
    return created;
  } catch {
    return `ll-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
  }
};

function PiecePreview({ name }: { name: PieceName | null }) {
  if (!name) {
    return (
      <div className="flex min-h-[62px] items-center justify-center text-[11px] font-black uppercase tracking-[0.08em] text-zinc-400">
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
  const rewardTimer = useRef<number | null>(null);
  const rewardIssuingLevel = useRef<number | null>(null);

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
  const [rewardPopup, setRewardPopup] = useState<TetrisReward | null>(null);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [rewardError, setRewardError] = useState("");
  const [unlockedRewardLevels, setUnlockedRewardLevels] = useState<number[]>([]);

  const level = Math.floor(lines / 10) + 1;
  const speed = Math.max(90, 730 - (level - 1) * 58);
  const milestoneCorrenteGiaSbloccata =
    level % 15 === 0 && unlockedRewardLevels.includes(level);
  const previousRewardLevel = milestoneCorrenteGiaSbloccata
    ? level
    : Math.floor((Math.max(level, 1) - 1) / 15) * 15;
  const nextRewardLevel = previousRewardLevel + 15;
  const nextRewardAmount = nextRewardLevel % 30 === 0 ? 10 : 5;
  const rewardProgress = Math.min(
    100,
    Math.max(0, ((level - previousRewardLevel) / 15) * 100)
  );

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

      const savedRewards = JSON.parse(
        window.localStorage.getItem("lalinea-tetris-reward-levels") || "[]"
      );
      if (Array.isArray(savedRewards)) {
        setUnlockedRewardLevels(
          savedRewards.filter((value): value is number => Number.isFinite(value))
        );
      }
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
      if (rewardTimer.current) window.clearTimeout(rewardTimer.current);
    };
  }, []);

  const buzz = useCallback((pattern: number | number[]) => {
    try {
      navigator.vibrate?.(pattern);
    } catch {}
  }, []);

  const closeRewardPopup = useCallback(() => {
    if (rewardLoading) return;
    setRewardPopup(null);
    setRewardError("");
    if (!gameOver) setRunning(true);
  }, [gameOver, rewardLoading]);

  const richiediPremio = useCallback(
    async (rewardLevel: number) => {
      if (rewardIssuingLevel.current === rewardLevel) return;

      const amount: 5 | 10 = rewardLevel % 30 === 0 ? 10 : 5;
      rewardIssuingLevel.current = rewardLevel;
      setRewardLoading(true);
      setRewardError("");
      setRunning(false);
      setRewardPopup({ level: rewardLevel, amount, code: "" });

      try {
        const risposta = await fetch("/api/tetris-reward", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "issue",
            playerId: getOrCreatePlayerId(),
            level: rewardLevel,
          }),
        });

        const risultato = await risposta.json();
        if (!risposta.ok || !risultato?.code) {
          throw new Error(risultato?.error || "Premio momentaneamente non disponibile");
        }

        const finalAmount: 5 | 10 = Number(risultato.amount) === 10 ? 10 : 5;
        setRewardPopup({
          level: rewardLevel,
          amount: finalAmount,
          code: String(risultato.code).toUpperCase(),
        });

        setUnlockedRewardLevels((current) => {
          const updated = current.includes(rewardLevel)
            ? current
            : [...current, rewardLevel].sort((a, b) => a - b);
          try {
            window.localStorage.setItem(
              "lalinea-tetris-reward-levels",
              JSON.stringify(updated)
            );
          } catch {}
          return updated;
        });

        buzz([45, 30, 45, 30, 110]);
      } catch (error) {
        setRewardError(
          error instanceof Error
            ? error.message
            : "Impossibile generare il premio. Riprova."
        );
      } finally {
        rewardIssuingLevel.current = null;
        setRewardLoading(false);
      }
    },
    [buzz]
  );

  useEffect(() => {
    if (level < 15 || level % 15 !== 0) return;
    if (unlockedRewardLevels.includes(level)) return;
    if (rewardPopup?.level === level || rewardLoading) return;
    void richiediPremio(level);
  }, [level, rewardLoading, rewardPopup, richiediPremio, unlockedRewardLevels]);

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
    <div className="relative mx-auto w-full max-w-[480px] select-none overflow-hidden rounded-[28px] border-2 border-yellow-300 bg-black p-4 text-white shadow-[0_0_24px_rgba(250,204,21,.16)] sm:p-5">
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
        @keyframes llRewardPulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.05); filter: brightness(1.28); }
        }
        @keyframes llRewardRay {
          0% { transform: rotate(0deg) scale(.92); opacity: .25; }
          50% { opacity: .55; }
          100% { transform: rotate(360deg) scale(1.08); opacity: .25; }
        }
        @keyframes llRewardPop {
          0% { opacity: 0; transform: translateY(16px) scale(.88); }
          65% { opacity: 1; transform: translateY(-2px) scale(1.035); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ll-tetris-neon-title {
          color: #ffffff;
          -webkit-text-stroke: .55px rgba(0,0,0,.95);
          text-shadow:
            1px 1px 0 #000,
            -1px -1px 0 #000,
            0 0 7px rgba(34,211,238,.34),
            0 0 12px rgba(250,204,21,.24),
            0 0 18px rgba(232,121,249,.16);
        }
        .ll-tetris-readable {
          text-shadow: 0 1px 1px rgba(0,0,0,1);
        }
        .ll-tetris-copy {
          color: #f4f4f5;
          text-shadow: 0 1px 1px rgba(0,0,0,1);
        }
        .ll-tetris-panel {
          background: linear-gradient(180deg, rgba(24,24,27,.98), rgba(9,9,11,.98));
        }
      `}</style>

      <div className="pointer-events-none absolute -left-20 -top-24 h-52 w-52 rounded-full bg-yellow-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="ll-tetris-panel relative mb-4 overflow-hidden rounded-2xl border border-yellow-300/70 px-4 py-4 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-70" />
        <p className="ll-tetris-readable text-[12px] font-black uppercase tracking-[0.16em] text-yellow-200 sm:text-[13px]">
          LALINEA // MILANO EDITION
        </p>
        <h2 className="ll-tetris-neon-title mt-2 text-[2rem] font-black uppercase leading-[1.02] tracking-[-0.02em] sm:text-[2.25rem]">
          TETRIS: CHIUDI LA LINEA
        </h2>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.05em] text-zinc-100 sm:text-[12px]">
          <span className="rounded-full border border-green-300/70 bg-green-400/10 px-2.5 py-1 text-green-200">
            {statusText}
          </span>
          <span>Blocca · Incastra · Fai Linea</span>
        </div>
      </div>

      <div className="relative mb-4 grid grid-cols-4 gap-2 text-center">
        {[
          ["PUNTI", formatNumber(score), "text-cyan-300"],
          ["RECORD", formatNumber(highScore), "text-green-300"],
          ["LINEE", String(lines), "text-yellow-300"],
          ["LIVELLO", String(level), "text-fuchsia-300"],
        ].map(([label, value, color]) => (
          <div
            key={label}
            className="ll-tetris-panel rounded-xl border border-zinc-600 px-2 py-2.5"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.06em] text-zinc-200 sm:text-[11px]">
              {label}
            </p>
            <p className={`mt-1 text-[18px] font-black leading-none sm:text-xl ${color}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="relative mb-4 overflow-hidden rounded-2xl border-2 border-cyan-300/45 bg-gradient-to-r from-cyan-400/[0.09] via-zinc-950 to-yellow-400/[0.10] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="ll-tetris-readable text-[11px] font-black uppercase tracking-[0.10em] text-cyan-100 sm:text-[12px]">
              LaLinea Reward Track
            </p>
            <p className="mt-1.5 text-[15px] font-black uppercase leading-tight text-white sm:text-base">
              Prossimo premio: €{nextRewardAmount} al livello {nextRewardLevel}
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-yellow-300/50 bg-yellow-400/10 px-2.5 py-1.5 text-center shadow-[0_0_16px_rgba(250,204,21,.16)]">
            <p className="text-[10px] font-black uppercase tracking-[0.06em] text-yellow-100 sm:text-[11px]">Mancano</p>
            <p className="text-lg font-black text-white sm:text-xl">{Math.max(0, nextRewardLevel - level)} LV</p>
          </div>
        </div>

        <div className="mt-3 h-3 overflow-hidden rounded-full border border-zinc-600 bg-black">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-yellow-300 transition-[width] duration-500"
            style={{ width: `${rewardProgress}%` }}
          />
        </div>

        <div className="mt-3 grid grid-cols-3 items-center gap-2 text-center text-[10px] font-black uppercase tracking-[0.03em] text-zinc-200 sm:text-[11px]">
          <span className="text-cyan-300">LV 15 · €5</span>
          <span>Ogni 15 livelli</span>
          <span className="text-yellow-300">LV 30 · €10</span>
        </div>
      </div>

      <div className="relative grid grid-cols-[minmax(0,1fr)_86px] items-start gap-3 sm:grid-cols-[minmax(0,1fr)_104px]">
        <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[320px]">
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
              <span className="mt-4 text-base font-black uppercase tracking-[0.10em] text-yellow-200">
                Tocca e fai Linea
              </span>
              <span className="mt-1 max-w-[190px] text-[11px] font-bold uppercase leading-relaxed text-zinc-200">
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
              <span className="mt-2 text-base font-black uppercase tracking-[0.10em] text-yellow-200">
                LaLinea in pausa
              </span>
              <span className="mt-1 text-[11px] font-bold uppercase text-zinc-200">
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
            <p className="text-[11px] font-black uppercase tracking-[0.06em] text-zinc-100">Prossimo</p>
            <PiecePreview name={nextNames[0] ?? null} />
          </div>

          <button
            type="button"
            onClick={hold}
            disabled={!canHold || !running || gameOver}
            className="w-full rounded-xl border border-cyan-400/45 bg-cyan-400/5 p-2 text-center transition disabled:opacity-35"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.06em] text-cyan-100">Hold</p>
            <PiecePreview name={holdName} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (gameOver || (score === 0 && !running)) resetGame();
              else setRunning((value) => !value);
            }}
            className="min-h-11 w-full rounded-xl border border-yellow-300 bg-yellow-400 px-1.5 py-2.5 text-[10px] font-black uppercase text-black shadow-[0_0_10px_rgba(250,204,21,.16)]"
          >
            {gameOver ? "Rigioca" : running ? "Pausa" : score === 0 ? "Start" : "Riprendi"}
          </button>

          <button
            type="button"
            onClick={resetGame}
            className="min-h-10 w-full rounded-xl border border-zinc-600 bg-black px-1.5 py-2 text-[9px] font-black uppercase text-zinc-200"
          >
            Reset
          </button>

          <div className="rounded-xl border border-green-400/25 bg-green-400/5 px-1.5 py-2 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.08em] text-green-200">
              Combo
            </p>
            <p className="mt-0.5 text-lg font-black text-white sm:text-xl">×{combo}</p>
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

      {rewardPopup && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center rounded-[26px] bg-black/88 p-4 backdrop-blur-md">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26px]">
            <div
              className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_0deg,rgba(34,211,238,.18),rgba(232,121,249,.2),rgba(250,204,21,.24),rgba(74,222,128,.16),rgba(34,211,238,.18))] blur-sm"
              style={{ animation: "llRewardRay 5s linear infinite" }}
            />
          </div>

          <div
            className="relative w-full max-w-[330px] overflow-hidden rounded-3xl border-2 border-yellow-300 bg-zinc-950 p-5 text-center shadow-[0_0_55px_rgba(250,204,21,.36)]"
            style={{ animation: "llRewardPop .42s cubic-bezier(.2,.8,.2,1) both" }}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-yellow-300" />
            <p className="ll-tetris-readable text-[11px] font-black uppercase tracking-[0.20em] text-cyan-200">
              LALINEA TETRIS REWARD
            </p>
            <div
              className="mx-auto mt-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-yellow-300 bg-yellow-400/10 text-3xl font-black text-yellow-100 shadow-[0_0_22px_rgba(250,204,21,.24)]"
              style={{ animation: "llRewardPulse 1.5s ease-in-out infinite" }}
            >
              €{rewardPopup.amount}
            </div>
            <p className="mt-4 text-2xl font-black uppercase leading-none text-white">
              Premio sbloccato
            </p>
            <p className="mt-3 text-[12px] font-bold uppercase leading-relaxed tracking-[0.04em] text-zinc-200">
              Livello {rewardPopup.level} raggiunto. Il tuo premio LaLinea viene generato in modo univoco.
            </p>

            <div className="mt-4 rounded-2xl border border-green-300/55 bg-green-400/[0.08] px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.10em] text-green-200">
                Codice sconto personale
              </p>

              {rewardLoading ? (
                <p className="mt-3 text-sm font-black uppercase tracking-[0.08em] text-white">
                  Generazione premio…
                </p>
              ) : rewardError ? (
                <>
                  <p className="mt-3 text-[12px] font-bold leading-relaxed text-red-200">
                    {rewardError}
                  </p>
                  <button
                    type="button"
                    onClick={() => void richiediPremio(rewardPopup.level)}
                    className="mt-3 min-h-11 w-full rounded-xl border border-red-300/70 bg-red-400/10 px-3 py-2.5 text-[11px] font-black uppercase text-red-100"
                  >
                    Riprova generazione
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-2 break-all text-2xl font-black tracking-[0.08em] text-white">
                    {rewardPopup.code}
                  </p>
                  <p className="mt-2 text-[10px] font-bold uppercase text-zinc-300">
                    Valore premio: -€{rewardPopup.amount} · utilizzabile una sola volta
                  </p>
                </>
              )}
            </div>

            {!rewardLoading && !rewardError && rewardPopup.code && (
              <button
                type="button"
                onClick={closeRewardPopup}
                className="mt-4 min-h-12 w-full rounded-2xl border border-yellow-300 bg-yellow-400 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-black shadow-[0_0_16px_rgba(250,204,21,.18)]"
              >
                Salva il codice e continua
              </button>
            )}
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.03em] text-zinc-200">
              15 · 45 · 75 = €5 // 30 · 60 · 90 = €10
            </p>
          </div>
        </div>
      )}

      <div className="relative mt-3 rounded-xl border border-yellow-400/20 bg-yellow-400/[0.04] px-3 py-2 text-center">
        <p className="text-[11px] font-black uppercase leading-relaxed tracking-[0.02em] text-zinc-100 sm:text-[12px]">
          Mobile: tap = ruota · swipe = muovi · swipe lungo ↓ = drop · Hold conserva il pezzo
        </p>
        <p className="mt-1.5 hidden text-[11px] font-black uppercase text-zinc-200 sm:block">
          Desktop: ← → muovi · ↑ ruota · ↓ scendi · spazio drop · C/Shift hold · P pausa
        </p>
      </div>
    </div>
  );
}
