"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AccessoVip from "./AccessoVip";

type Casella = {
  day: string;
  amount: number;
  credit: number | null;
  voucher: string | null;
  redeemed: boolean;
  expiry: string | null;
  active: boolean;
};

type Calendario = {
  today: string;
  now: string;
  welcomeDay?: string;
  next: string | null;
  entries: Casella[];
  notice: string | null;
};

const inizio = "2026-12-01";
const fine = "2026-12-25";
const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const oraItaliana = new Intl.DateTimeFormat("it-IT", {
  day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome",
});

export function CalendarioConAccesso() {
  const [serveAccesso, setServeAccesso] = useState(false);
  const richiediAccesso = useCallback(() => setServeAccesso(true), []);
  return serveAccesso
    ? <AccessoVip calendario onAccesso={() => setServeAccesso(false)} />
    : <CalendarioAvvento onAccessoRichiesto={richiediAccesso} />;
}

export default function CalendarioAvvento({ onAccessoRichiesto }: { onAccessoRichiesto?: () => void }) {
  const [stato, setStato] = useState<Calendario | null>(null);
  const [scelta, setScelta] = useState("");
  const [occupato, setOccupato] = useState(false);
  const [errore, setErrore] = useState("");
  const [copiato, setCopiato] = useState("");
  const richiesta = useRef<AbortController | null>(null);

  const aggiorna = useCallback(async (giorno?: string) => {
    if (richiesta.current) return;
    const controller = new AbortController();
    richiesta.current = controller;
    setOccupato(true);
    setErrore("");
    try {
      const r = await fetch("/api/vip/avvento", {
        method: giorno ? "POST" : "GET",
        headers: giorno ? { "Content-Type": "application/json" } : undefined,
        body: giorno ? JSON.stringify({ day: giorno }) : undefined,
        credentials: "same-origin", cache: "no-store", signal: controller.signal,
      });
      if (r.status === 401 && onAccessoRichiesto && !controller.signal.aborted) {
        onAccessoRichiesto();
        return;
      }
      const dati = await r.json();
      if (!r.ok) throw new Error(dati.error || "Calendario non disponibile.");
      if (controller.signal.aborted) return;
      setStato(dati);
      if (giorno) { setScelta(giorno); setCopiato(""); }
    } catch (e) {
      if (!controller.signal.aborted) setErrore(e instanceof Error ? e.message : "Connessione interrotta. Riprova.");
    } finally {
      if (richiesta.current === controller) { richiesta.current = null; setOccupato(false); }
    }
  }, [onAccessoRichiesto]);

  useEffect(() => {
    void aggiorna();
    const ritorno = () => { if (!document.hidden) void aggiorna(); };
    window.addEventListener("focus", ritorno);
    document.addEventListener("visibilitychange", ritorno);
    return () => {
      richiesta.current?.abort();
      richiesta.current = null;
      window.removeEventListener("focus", ritorno);
      document.removeEventListener("visibilitychange", ritorno);
    };
  }, [aggiorna]);

  useEffect(() => {
    if (!stato || stato.today > fine) return;
    const ora = Date.parse(stato.now);
    const domani = Date.parse(stato.today + "T00:00:00+01:00") + 86400000;
    const attesa = stato.next ? Date.parse(stato.next) : 0;
    const prossimo = attesa > ora ? Math.min(domani, attesa) : domani;
    const timer = window.setTimeout(() => { void aggiorna(); }, Math.max(750, prossimo - ora + 500));
    return () => window.clearTimeout(timer);
  }, [stato, aggiorna]);

  const aperte = stato?.entries || [];
  const attuale = aperte.find(c => c.day === scelta) || aperte[0];
  const giornoBenvenuto = stato?.welcomeDay;
  const benvenutoAperto = aperte.find(c => c.day === giornoBenvenuto);
  const inAttesa = !!(stato?.next && Date.parse(stato.next) > Date.parse(stato.now));
  function seleziona(giorno: string, giaAperta?: Casella) {
    setCopiato("");
    if (giaAperta) setScelta(giorno);
    else void aggiorna(giorno);
  }
  async function copia(codice: string) {
    try { await navigator.clipboard.writeText(codice); setCopiato(codice); }
    catch { setCopiato("manuale"); }
  }

  return (
    <section aria-label="Calendario dell’Avvento LaLinea" className="my-8 rounded-2xl border border-yellow-400/70 bg-zinc-950 p-4 text-white sm:p-6">
      <h2 className="text-2xl font-black text-yellow-300">Calendario dell’Avvento 🎄</h2>
      <p className="mt-1 text-sm text-zinc-300">1–25 dicembre 2026 · Una casella ogni 24 ore.</p>
      {stato && (
        <>
          {giornoBenvenuto && (stato.today === giornoBenvenuto || benvenutoAperto) && (
            <button
              type="button"
              disabled={occupato}
              aria-pressed={!!benvenutoAperto && attuale?.day === giornoBenvenuto}
              onClick={() => seleziona(giornoBenvenuto, benvenutoAperto)}
              className="mt-4 min-h-11 w-full rounded-xl border-2 border-red-500 bg-emerald-950 px-4 py-3 text-left text-white focus-visible:outline-2 focus-visible:outline-white"
            >
              <span className="block text-xs font-bold uppercase tracking-wide text-emerald-200">24 novembre · Speciale di benvenuto</span>
              <span className="block font-black">🎁 {benvenutoAperto ? "Rivedi la casella di benvenuto" : "Apri la casella di benvenuto"}</span>
            </button>
          )}
          <div className="my-4 grid grid-cols-5 gap-2">
            {Array.from({ length: 25 }, (_, i) => {
              const numero = i + 1;
              const day = "2026-12-" + String(numero).padStart(2, "0");
              const premio = aperte.find(c => c.day === day);
              const oggi = stato.today === day;
              const apribile = oggi && !inAttesa && !premio;
              let colore = "border-zinc-700 bg-black text-zinc-400";
              if (premio) colore = "border-emerald-500/60 bg-emerald-950 text-emerald-200";
              if (apribile) colore = "border-yellow-300 bg-yellow-400 text-black";
              return (
                <button key={day} type="button" disabled={occupato || (!premio && !apribile)}
                  aria-label={(premio ? "Rivedi" : "Apri") + " la casella del " + numero + " dicembre"}
                  aria-pressed={!!premio && attuale?.day === day}
                  className={"min-h-11 rounded-lg border text-base font-black focus-visible:outline-2 focus-visible:outline-white " + colore}
                  onClick={() => seleziona(day, premio)}>
                  {numero}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-zinc-300" aria-live="polite">
            {stato.notice || (stato.today < inizio ? "Le 25 caselle del calendario iniziano il 1° dicembre."
              : stato.today > fine ? "Calendario concluso. Qui ritrovi i buoni ottenuti."
              : stato.next && inAttesa && Date.parse(stato.next) >= Date.parse("2026-12-26T00:00:00+01:00") ? "Hai aperto la tua ultima casella."
              : stato.next && inAttesa ? "Prossima apertura il " + oraItaliana.format(new Date(stato.next)) + "."
              : "Tocca la casella di oggi per aprirla.")}
          </p>
          {attuale && (
            <div className="mt-4 rounded-xl border border-zinc-700 bg-black p-4" aria-live="polite">
              <p className="text-sm text-zinc-300">{attuale.day === giornoBenvenuto ? "Benvenuto · 24 novembre" : Number(attuale.day.slice(-2)) + " dicembre"}</p>
              <p className="mt-1 font-black text-yellow-300">
                {attuale.amount ? "Hai trovato un buono da " + euro.format(attuale.amount)
                  : attuale.day === giornoBenvenuto ? "Hai trovato gli auguri del club. Buon Avvento! 🎄"
                  : "Questa casella non contiene un buono."}
              </p>
              {attuale.voucher && attuale.active && (
                <>
                  <p className="mt-2 text-sm">
                    {attuale.redeemed && attuale.credit !== null ? "Credito rimasto: " + euro.format(attuale.credit/100) + ". " : ""}
                    Copia il tuo codice nel campo sconto del sito.
                  </p>
                  <code className="mt-2 block select-all break-all text-sm text-white">{attuale.voucher}</code>
                  <button type="button" className="mt-3 rounded-lg bg-yellow-400 px-4 py-2 font-bold text-black"
                    onClick={() => { if (attuale.voucher) void copia(attuale.voucher); }}>
                    {copiato === attuale.voucher ? "Copiato ✓" : "Copia il buono"}
                  </button>
                  {copiato === "manuale" && <p className="mt-1 text-xs">Seleziona il codice e usa Copia.</p>}
                  {attuale.expiry && <p className="mt-2 text-xs text-zinc-300">Valido fino al {attuale.expiry.slice(0,10).split("-").reverse().join("/")}.</p>}
                </>
              )}
              {!!attuale.amount && !attuale.voucher && attuale.redeemed && <p className="text-sm">Buono utilizzato.</p>}
              {attuale.voucher && !attuale.active && <p className="text-sm">Buono scaduto o disattivato.</p>}
            </div>
          )}
        </>
      )}
      {occupato && <p role="status" className="mt-2 text-sm">Caricamento…</p>}
      {errore && <p role="alert" className="mt-2 text-sm text-yellow-200">{errore} <button type="button" className="underline" onClick={() => void aggiorna()}>Aggiorna</button></p>}
    </section>
  );
}
