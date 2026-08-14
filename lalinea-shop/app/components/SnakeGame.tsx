"use client";

import { useEffect, useRef, useState } from "react";

const CELL = 20;
const SIZE = 300;
const CELLS = SIZE / CELL;

type Punto = {
  x: number;
  y: number;
};

type Premio = {
  livello: number;
  valore: number;
  codice: string;
};

const PREMI: Premio[] = [
  { livello: 1, valore: 5, codice: "LALINEA5" },
  { livello: 2, valore: 10, codice: "LALINEA10" },
  { livello: 3, valore: 15, codice: "LALINEA15" },
  { livello: 4, valore: 20, codice: "LALINEA20" },
];

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const snakeRef = useRef<Punto[]>([
    { x: 7, y: 7 },
    { x: 6, y: 7 },
    { x: 5, y: 7 },
  ]);

  const direzioneRef = useRef<Punto>({ x: 1, y: 0 });
  const ciboRef = useRef<Punto>({ x: 11, y: 7 });
  const ultimoLivelloRef = useRef(0);

  const [punteggio, setPunteggio] = useState(0);
  const [inGioco, setInGioco] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [premio, setPremio] = useState<Premio | null>(null);

  const livelloAttuale =
    punteggio >= 700
      ? 4
      : punteggio >= 450
      ? 3
      : punteggio >= 250
      ? 2
      : punteggio >= 100
      ? 1
      : 0;

  const velocita =
    livelloAttuale === 4
      ? 48
      : livelloAttuale === 3
      ? 62
      : livelloAttuale === 2
      ? 80
      : livelloAttuale === 1
      ? 100
      : 130;

  const prossimoPremio =
    livelloAttuale === 0
      ? 100
      : livelloAttuale === 1
      ? 250
      : livelloAttuale === 2
      ? 450
      : livelloAttuale === 3
      ? 700
      : null;

  const disegna = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SIZE, SIZE);

    ctx.strokeStyle = "#27272a";

    for (let i = 0; i <= CELLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(SIZE, i * CELL);
      ctx.stroke();
    }

    ctx.fillStyle = "#facc15";

    snakeRef.current.forEach((parte) => {
      ctx.fillRect(
        parte.x * CELL + 1,
        parte.y * CELL + 1,
        CELL - 2,
        CELL - 2
      );
    });

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
      ciboRef.current.x * CELL + 3,
      ciboRef.current.y * CELL + 3,
      CELL - 6,
      CELL - 6
    );
  };

  const cambiaDirezione = (x: number, y: number) => {
    const attuale = direzioneRef.current;

    if (attuale.x + x === 0 && attuale.y + y === 0) {
      return;
    }

    direzioneRef.current = { x, y };
  };

  const nuovoCibo = () => {
    let nuovo: Punto;

    do {
      nuovo = {
        x: Math.floor(Math.random() * CELLS),
        y: Math.floor(Math.random() * CELLS),
      };
    } while (
      snakeRef.current.some(
        (parte) => parte.x === nuovo.x && parte.y === nuovo.y
      )
    );

    ciboRef.current = nuovo;
  };

  const controllaPremio = (punti: number) => {
    let premioRaggiunto: Premio | null = null;

    if (punti >= 700 && ultimoLivelloRef.current < 4) {
      premioRaggiunto = PREMI[3];
    } else if (punti >= 450 && ultimoLivelloRef.current < 3) {
      premioRaggiunto = PREMI[2];
    } else if (punti >= 250 && ultimoLivelloRef.current < 2) {
      premioRaggiunto = PREMI[1];
    } else if (punti >= 100 && ultimoLivelloRef.current < 1) {
      premioRaggiunto = PREMI[0];
    }

    if (premioRaggiunto) {
      ultimoLivelloRef.current = premioRaggiunto.livello;
      setPremio(premioRaggiunto);
      setInGioco(false);
    }
  };

  const avviaGioco = () => {
    snakeRef.current = [
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
    ];

    direzioneRef.current = { x: 1, y: 0 };
    ciboRef.current = { x: 11, y: 7 };
    ultimoLivelloRef.current = 0;

    setPunteggio(0);
    setPremio(null);
    setGameOver(false);
    setInGioco(true);
  };

  const continuaGioco = () => {
    setPremio(null);
    setInGioco(true);
  };

  useEffect(() => {
    const gestisciTasto = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
      }

      if (e.key === "ArrowUp") cambiaDirezione(0, -1);
      if (e.key === "ArrowDown") cambiaDirezione(0, 1);
      if (e.key === "ArrowLeft") cambiaDirezione(-1, 0);
      if (e.key === "ArrowRight") cambiaDirezione(1, 0);
    };

    window.addEventListener("keydown", gestisciTasto);

    return () => {
      window.removeEventListener("keydown", gestisciTasto);
    };
  }, []);

  useEffect(() => {
    disegna();

    if (!inGioco) return;

    const timer = setInterval(() => {
      const snake = [...snakeRef.current];
      const testa = snake[0];

      const nuovaTesta = {
        x: testa.x + direzioneRef.current.x,
        y: testa.y + direzioneRef.current.y,
      };

      const fuori =
        nuovaTesta.x < 0 ||
        nuovaTesta.x >= CELLS ||
        nuovaTesta.y < 0 ||
        nuovaTesta.y >= CELLS;

      const colpisceSeStesso = snake.some(
        (parte) =>
          parte.x === nuovaTesta.x && parte.y === nuovaTesta.y
      );

      if (fuori || colpisceSeStesso) {
        setInGioco(false);
        setGameOver(true);
        return;
      }

      snake.unshift(nuovaTesta);

      const mangiato =
        nuovaTesta.x === ciboRef.current.x &&
        nuovaTesta.y === ciboRef.current.y;

      if (mangiato) {
        const nuovoPunteggio = punteggio + 10;

        snakeRef.current = snake;
        nuovoCibo();
        setPunteggio(nuovoPunteggio);
        controllaPremio(nuovoPunteggio);
      } else {
        snake.pop();
        snakeRef.current = snake;
      }

      disegna();
    }, velocita);

    return () => {
      clearInterval(timer);
    };
  }, [inGioco, punteggio, velocita]);

  return (
    <div className="relative mx-auto max-w-md text-center">
      <div className="mb-5 border border-yellow-400 bg-black p-4">
        <p className="font-black uppercase text-yellow-400">
          Snake Lalinea
        </p>
        

        <p className="mt-2 text-sm font-bold uppercase text-white">
          Livello {livelloAttuale} / 4
        </p>

        <p className="mt-1 font-black text-yellow-400">
          Punteggio: {punteggio}
        </p>

        {prossimoPremio !== null && (
          <p className="mt-2 text-xs uppercase text-zinc-400">
            Prossimo premio a {prossimoPremio} punti
          </p>
        )}

        {livelloAttuale === 4 && (
          <p className="mt-2 text-xs font-black uppercase text-yellow-400">
            Premio massimo raggiunto
          </p>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="mx-auto border border-yellow-400 bg-black"
      />

      {gameOver && (
        <div className="mt-5 border border-red-500 p-4">
          <p className="font-black uppercase text-red-500">
            Game Over
          </p>

          <p className="mt-2 text-sm uppercase text-white">
            Punteggio finale: {punteggio}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={avviaGioco}
        className="mt-5 bg-yellow-400 px-8 py-3 font-black uppercase text-black"
      >
        {inGioco
          ? "Ricomincia"
          : gameOver
          ? "Gioca ancora"
          : "Gioca"}
      </button>

      <div className="mx-auto mt-6 grid w-44 grid-cols-3 gap-2">
        <div />

        <button
          type="button"
          onClick={() => cambiaDirezione(0, -1)}
          className="border border-yellow-400 p-3 text-xl text-white"
        >
          ↑
        </button>

        <div />

        <button
          type="button"
          onClick={() => cambiaDirezione(-1, 0)}
          className="border border-yellow-400 p-3 text-xl text-white"
        >
          ←
        </button>

        <button
          type="button"
          onClick={() => cambiaDirezione(0, 1)}
          className="border border-yellow-400 p-3 text-xl text-white"
        >
          ↓
        </button>

        <button
          type="button"
          onClick={() => cambiaDirezione(1, 0)}
          className="border border-yellow-400 p-3 text-xl text-white"
        >
          →
        </button>
      </div>

      {premio && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-6">
          <div className="w-full max-w-sm border-2 border-yellow-400 bg-black p-7 text-center">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-400">
              Premio sbloccato
            </p>

            <h2 className="mt-4 text-3xl font-black uppercase text-white">
              Livello {premio.livello}
            </h2>

            <p className="mt-5 text-xl font-black uppercase text-yellow-400">
              Codice Sconto Lalinea
            </p>

            <p className="mt-2 text-5xl font-black text-white">
              {premio.valore} €
            </p>

            <div className="mt-6 border border-yellow-400 bg-zinc-950 p-4">
              <p className="text-xs font-bold uppercase text-zinc-400">
                Il tuo codice
              </p>

              <p className="mt-2 text-2xl font-black tracking-widest text-yellow-400">
                {premio.codice}
              </p>
            </div>

            {premio.livello < 4 ? (
              <>
                <p className="mt-5 text-sm text-zinc-400">
                  Puoi utilizzare questo premio oppure continuare la sfida
                  per provare a vincere uno sconto maggiore.
                </p>

                <button
                  type="button"
                  onClick={continuaGioco}
                  className="mt-6 w-full bg-yellow-400 px-6 py-4 font-black uppercase text-black"
                >
                  Continua la sfida
                </button>
              </>
            ) : (
              <>
                <p className="mt-5 font-bold uppercase text-yellow-400">
                  Hai raggiunto il premio massimo
                </p>

                <button
                  type="button"
                  onClick={() => setPremio(null)}
                  className="mt-6 w-full bg-yellow-400 px-6 py-4 font-black uppercase text-black"
                >
                  Chiudi
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
       