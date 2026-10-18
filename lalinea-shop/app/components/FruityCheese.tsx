"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";

type Props = {
  InfoRiga: ComponentType<{ etichetta: string; children: ReactNode }>;
  onAggiungi: (grammi: string, prezzo: number) => void;
};

// Lancio considerato: 18 ottobre 2026.
// Prezzo promozionale fino al 27 ottobre compreso, ora italiana.
// Se cambia il giorno di lancio, aggiorna questa scadenza.
const FINE_PROMO = Date.parse("2026-10-28T00:00:00+01:00");
const ULTIMO_GIORNO_PROMO = new Intl.DateTimeFormat("it-IT", {
  timeZone: "Europe/Rome",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(FINE_PROMO - 1);

const OPZIONI = [
  { grammi: "5G", prezzo: 40 },
  { grammi: "10G", prezzo: 90 },
  { grammi: "25G", prezzo: 200 },
  { grammi: "50G", prezzo: 300 },
  { grammi: "100G", prezzo: 440 },
  { grammi: "500G", prezzo: 1600 },
] as const;

export default function FruityCheese({ InfoRiga, onAggiungi }: Props) {
  // Lo stato iniziale uguale sul server e nel browser evita prezzi discordanti
  // durante il caricamento. Gli altri cinque formati restano subito disponibili.
  const [promoAttiva, setPromoAttiva] = useState<boolean | null>(null);

  useEffect(() => {
    let timer: number | undefined;

    const aggiorna = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      const rimanente = FINE_PROMO - Date.now();
      setPromoAttiva(rimanente > 0);
      if (rimanente > 0) {
        timer = window.setTimeout(aggiorna, Math.min(rimanente, 2147483647));
      }
    };

    const alRitorno = () => {
      if (document.visibilityState === "visible") aggiorna();
    };

    aggiorna();
    window.addEventListener("focus", aggiorna);
    document.addEventListener("visibilitychange", alRitorno);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener("focus", aggiorna);
      document.removeEventListener("visibilitychange", alRitorno);
    };
  }, []);

  return (
    <div
      id="fruity-cheese"
      className="mt-8 rounded-3xl border border-yellow-300/70 bg-black/85 p-4 shadow-lg sm:p-6"
    >
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
        Premium Filtred
      </p>
      <h3 className="mt-2 text-3xl font-black uppercase text-white">
        🧀FRUITY CHEESE🧀
      </h3>

      <div className="mt-6 space-y-3">
        <InfoRiga etichetta="🕸️">160/90/73</InfoRiga>
        <InfoRiga etichetta="CREATORI DELLA GENETICA">
          🏴󠁧󠁢󠁥󠁮󠁧󠁿 Ultra Genetics
        </InfoRiga>
        <InfoRiga etichetta="BILANCIAMENTO">Indica 75% – Sativa 25%</InfoRiga>
        <InfoRiga etichetta="GUSTO">Formaggio, Uva, Mango</InfoRiga>
        <InfoRiga etichetta="🧊">90%</InfoRiga>
        <InfoRiga etichetta="💪">35/38%</InfoRiga>
      </div>

      <div className="mt-4" aria-live="polite">
        {promoAttiva === true && (
          <p className="rounded-2xl border border-yellow-200 bg-yellow-400 px-4 py-3 text-sm font-black text-black">
            PROMO LANCIO · 10G A 70 € ANZICHÉ 90 €
            <br />
            {"Valida fino al " + ULTIMO_GIORNO_PROMO + " compreso."}
          </p>
        )}
        {promoAttiva === false && (
          <p className="rounded-2xl border border-yellow-300/40 bg-black px-4 py-3 text-sm font-bold text-yellow-300">
            Promozione di lancio terminata · 10G a 90 €
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <video
          src="/products/premium-filtred/formaggino.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="aspect-video w-full flex-shrink-0 rounded-2xl border border-yellow-300/35 bg-black object-contain sm:w-2/5"
          preload="metadata"
        />

        <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-3">
          {[2, 3, 4, 5, 6, 7].map((numero) => (
            <img
              key={numero}
              src={"/products/premium-filtred/formaggino" + numero + ".jpg"}
              alt={"FRUITY CHEESE foto " + numero}
              className="aspect-square w-full rounded-xl border border-yellow-300/35 object-cover"
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 font-bold uppercase text-white">Seleziona quantità</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {OPZIONI.map((opzione) => {
            const formatoPromo = opzione.grammi === "10G";
            const attesa = formatoPromo && promoAttiva === null;
            const prezzo = formatoPromo && promoAttiva === true ? 70 : opzione.prezzo;

            return (
              <button
                key={opzione.grammi}
                type="button"
                disabled={attesa}
                onClick={() => {
                  if (attesa) return;
                  if (formatoPromo) {
                    const promoOra = Date.now() < FINE_PROMO;
                    if (promoOra !== promoAttiva) {
                      // Mostra il nuovo prezzo prima di consentire l'aggiunta.
                      setPromoAttiva(promoOra);
                      return;
                    }
                  }
                  onAggiungi(opzione.grammi, prezzo);
                }}
                className="rounded-2xl border border-yellow-300 bg-zinc-950 px-4 py-4 text-center disabled:opacity-60"
              >
                <p className="text-xl font-black text-white">{opzione.grammi}</p>
                {formatoPromo && promoAttiva === true && (
                  <p className="mt-2 text-xs font-bold text-zinc-400">
                    <s>90 €</s> · PROMO
                  </p>
                )}
                <p className="lalinea-price-neon mt-3 text-xl font-black">
                  {attesa ? "…" : prezzo + " €"}
                </p>
                <p className="mt-5 text-sm font-black uppercase text-white">
                  {attesa ? "Caricamento prezzo…" : "Aggiungi al carrello"}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
