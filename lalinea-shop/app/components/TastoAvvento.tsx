"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";

const CalendarioConAccesso = dynamic(
  () => import("../vip/CalendarioAvvento").then((modulo) => modulo.CalendarioConAccesso),
  { loading: () => <p role="status" className="p-4 text-white">Caricamento del calendario…</p> },
);

export default function TastoAvvento() {
  const finestra = useRef<HTMLDialogElement>(null);
  const [aperto, setAperto] = useState(false);

  return (
    <>
      <a
        href="/vip/avvento"
        aria-label="Advent Cal. – Apri il calendario dell’Avvento"
        aria-haspopup="dialog"
        aria-controls="avvento-catalogo"
        className="inline-flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-red-500 bg-linear-to-b from-emerald-950 to-black px-2 py-1 text-center font-black uppercase leading-none shadow-[0_0_10px_rgba(239,68,68,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
        onClick={(evento) => {
          const dialogo = finestra.current;
          if (!dialogo?.showModal || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
          evento.preventDefault();
          dialogo.showModal();
          setAperto(true);
        }}
      >
        <span lang="en" className="text-[11px] tracking-wide text-green-300">Advent</span>
        <span lang="en" className="text-xs text-white">Cal.</span>
      </a>

      <dialog
        ref={finestra}
        id="avvento-catalogo"
        aria-label="Calendario dell’Avvento"
        onClose={() => setAperto(false)}
        className="fixed inset-0 m-auto max-h-[86dvh] w-11/12 max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-red-400 bg-zinc-950 p-4 text-white shadow-2xl backdrop:bg-black/80 [&>section]:my-2"
      >
        <form method="dialog" className="flex justify-end">
          <button className="min-h-11 rounded-lg border border-zinc-600 px-4 font-bold focus-visible:outline-2 focus-visible:outline-white">
            Chiudi
          </button>
        </form>
        {aperto && <CalendarioConAccesso />}
      </dialog>
    </>
  );
}
