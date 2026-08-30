"use client";

import { useEffect, useRef, useState } from "react";
import SnakeGame from "./components/SnakeGame";
const prodotti = [
  { id: 1, nome: "Coming Soon", categoria: "LaLinea", prezzo: "—" },
  { id: 2, nome: "Coming Soon", categoria: "LaLinea", prezzo: "—" },
  { id: 3, nome: "Coming Soon", categoria: "LaLinea", prezzo: "—" },
];
function PlayerMusicale() {
  const canzoni = [
    { titolo: "PARLU", artista: "LA REFLVENZE", file: "/canzone.mp3" },
    { titolo: "MOLLY", artista: "GAZO", file: "/canzone2.mp3" },
    { titolo: "BIG 7", artista: "BURNA BOY", file: "/canzone3.mp3" },
    { titolo: "STOP DIE", artista: "BURNA BOY", file: "/canzone4.mp3" },
    { titolo: "BORA BORA", artista: "SKINNY FLEX", file: "/canzone5.mp3" },
    { titolo: "DUBAI", artista: "SKINNY FLEX", file: "/canzone6.mp3" },
  ];

  const [indice, setIndice] = useState(0);
  const playerRef = useRef<HTMLAudioElement>(null);

  const cambiaCanzone = (direzione: number) => {
    const nuovoIndice =
      (indice + direzione + canzoni.length) % canzoni.length;

    setIndice(nuovoIndice);

    setTimeout(() => {
      playerRef.current?.load();
      playerRef.current?.play().catch(() => {});
    }, 0);
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 border border-yellow-400 bg-black p-4 text-white shadow-2xl">
      <p className="text-center text-xs font-black uppercase tracking-widest text-yellow-400">
        La selezione musicale della settimana
      </p>

      <p className="my-3 text-center font-bold">
        {canzoni[indice].titolo} — {canzoni[indice].artista}
      </p>

      <audio
        ref={playerRef}
        src={canzoni[indice].file}
        controls
        preload="metadata"
        onEnded={() => cambiaCanzone(1)}
        className="w-full"
      />

      <div className="mt-3 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => cambiaCanzone(-1)}
          className="bg-yellow-400 px-5 py-2 font-black text-black"
        >
          ← Indietro
        </button>

        <button
          type="button"
          onClick={() => cambiaCanzone(1)}
          className="bg-yellow-400 px-5 py-2 font-black text-black"
        >
          Avanti →
        </button>
      </div>
    </div>
  );
}
export default function Home() {const [carrello, setCarrello] = useState<
    { id: number; nome: string; prezzo: number; quantita: number }[]
  >([]);
  const totalePrecedente = useRef(0);
  const [fotoAnteprima, setFotoAnteprima] = useState<string | null>(null);
  const [tipoAnteprima, setTipoAnteprima] = useState<"img" | "video">("img");
const audioRef = useRef<HTMLAudioElement | null>(null);
const [musicaAvviata, setMusicaAvviata] = useState(false);
const [caricamentoIniziale, setCaricamentoIniziale] = useState(true);
const [recensioniAperte, setRecensioniAperte] = useState(false);
const [snakeAperto, setSnakeAperto] = useState(false);
const avviaMusica = () => {
  if (!musicaAvviata && audioRef.current) {
    audioRef.current.play().catch(() => {});
    setMusicaAvviata(true);
  }
};
useEffect(() => {
  const fermaMusica = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setMusicaAvviata(false);
    }
  };

  const gestisciVisibilita = () => {
    if (document.hidden) {
      fermaMusica();
    }
  };

  document.addEventListener("visibilitychange", gestisciVisibilita);
  window.addEventListener("pagehide", fermaMusica);

  return () => {
    document.removeEventListener("visibilitychange", gestisciVisibilita);
    window.removeEventListener("pagehide", fermaMusica);
  };
}, []);
useEffect(() => {
  const timer = setTimeout(() => {
    setCaricamentoIniziale(false);
  }, 2500);

  return () => clearTimeout(timer);
}, []);
useEffect(() => {
  const totaleAttuale = carrello.reduce(
    (totale, item) => totale + item.quantita,
    0
  );

  if (totaleAttuale > totalePrecedente.current) {
    alert("Prodotto aggiunto al carrello ✓");
  }

  totalePrecedente.current = totaleAttuale;
}, [carrello]);
useEffect(() => {
  const apriAnteprima = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const media = target.closest("img, video") as
      | HTMLImageElement
      | HTMLVideoElement
      | null;

    if (!media) return;

    const src = media.currentSrc || media.getAttribute("src");

    if (!src) return;

    setTipoAnteprima(media.tagName.toLowerCase() === "video" ? "video" : "img");
    setFotoAnteprima(src);
  };

  document.addEventListener("click", apriAnteprima);

  return () => {
    document.removeEventListener("click", apriAnteprima);
  };
}, []);

  const [checkoutAperto, setCheckoutAperto] = useState(false);
const [datiCliente, setDatiCliente] = useState({
  nome: "",
  cognome: "",
  email: "",
  telefono: "",
  indirizzo: "",
});
const [orarioConsegna, setOrarioConsegna] = useState("");
const [modalitaOrdine, setModalitaOrdine] = useState("");
const [codiceSconto, setCodiceSconto] = useState("");
const [scontoPercentuale, setScontoPercentuale] = useState(0);
const [messaggioSconto, setMessaggioSconto] = useState("");
const [categoriaAttiva, setCategoriaAttiva] = useState("");  
const [menuAperto, setMenuAperto] = useState(false);
const [password, setPassword] = useState("");
const [accessoConsentito, setAccessoConsentito] = useState(false);
const [errorePassword, setErrorePassword] = useState(false);
const aggiungiAlCarrello = () => {
    setCarrello((prev) => {
      const esistente = prev.find((item) => item.id === 1);

      if (esistente) {
        return prev.map((item) =>
          item.id === 1
            ? { ...item, quantita: item.quantita + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          id: 1,
          nome: "Cover iPhone LaLinea UltraResistente",
          prezzo: 10,
          quantita: 1,
        },
      ];
    });
  };

  const aggiungiOrangeAlCarrello = (grammi: string, prezzo: number) => {
  const id = `orange-${grammi}`;

  setCarrello((prev) => {
    const esistente = prev.find((item) => String(item.id) === id);

    if (esistente) {
      return prev.map((item) =>
        String(item.id) === id
          ? { ...item, quantita: item.quantita + 1 }
          : item
      );
    }

    return [
      ...prev,
      {
        id: id as any,
        nome: `Orange Punch Frozen ${grammi}`,
        prezzo,
        quantita: 1,
      },
    ];
  });
};
const aggiungiRosinAlCarrello = (grammi: string, prezzo: number) => {
  const id = `rosin-${grammi}`;

  setCarrello((prev) => {
    const esistente = prev.find((item) => String(item.id) === id);

    if (esistente) {
      return prev.map((item) =>
        String(item.id) === id
          ? { ...item, quantita: item.quantita + 1 }
          : item
      );
    }

    return [
      ...prev,
      {
        id: id as any,
        nome: `ROSIN H HOMEMADE 37u ${grammi}`,
        prezzo,
        quantita: 1,
      },
    ];
  });
};
const sourDieselOpzioni = [
  { grammi: "5g", prezzo: 50 },
  { grammi: "10g", prezzo: 80 },
  { grammi: "25g", prezzo: 170 },
  { grammi: "50g", prezzo: 330 },
];
const aggiungiSourDieselAlCarrello = (
  grammi: string,
  prezzo: number
) => {
  const id = `sour-diesel-${grammi}`;

  setCarrello((prev) => {
    const esistente = prev.find(
      (item) => String(item.id) === id
    );

    if (esistente) {
      return prev.map((item) =>
        String(item.id) === id
          ? { ...item, quantita: item.quantita + 1 }
          : item
      );
    }

    return [
      ...prev,
      {
        id: id as any, 
        nome: `Sour Diesel X Forbidden Fruit ${grammi}`,
        prezzo,
        quantita: 1,
      },
    ];
  });
};
const lemonStaticOpzioni = [
  { grammi: "5g", prezzo: 50 },
  { grammi: "10g", prezzo: 80 },
  { grammi: "25g", prezzo: 170 },
  { grammi: "50g", prezzo: 330 },
  { grammi: "100g", prezzo: 550 },
];

const aggiungiLemonStaticAlCarrello = (
  grammi: string,
  prezzo: number
) => {
  const id = `lemon-static-${grammi}`;

  setCarrello((prev) => {
    const esistente = prev.find(
      (item) => String(item.id) === id
    );

    if (esistente) {
      return prev.map((item) =>
        String(item.id) === id
          ? { ...item, quantita: item.quantita + 1 }
          : item
      );
    }

    return [
      ...prev,
      {
        id: id as any,
        nome: `Lemon Static Premium ${grammi}`,
        prezzo,
        quantita: 1,
      },
    ];
  });
};


const aggiungiGorillaAlCarrello = (
  grammi: string,
  prezzo: number
) => {
  const id = `gorilla-${grammi}`;

  setCarrello((prev) => {
    const esistente = prev.find(
      (item) => String(item.id) === id
    );

    if (esistente) {
      return prev.map((item) =>
        String(item.id) === id
          ? { ...item, quantita: item.quantita + 1 }
          : item
      );
    }

    return [
      ...prev,
      {
        id: id as any,
        nome: `#Gorilla Glue 2 CaliSpain ${grammi}`,
        prezzo,
        quantita: 1,
      },
    ];
  });
};
const aggiungiMaradonaAlCarrello = (grammi: string, prezzo: number) => {
  const id = `maradona-${grammi}`;

  setCarrello((prev) => {
    const esistente = prev.find((item) => String(item.id) === id);

    if (esistente) {
      return prev.map((item) =>
        String(item.id) === id
          ? { ...item, quantita: item.quantita + 1 }
          : item
      );
    }

    return [
      ...prev,
      {
        id: id as any,
        nome: `Maradona ${grammi}`,
        prezzo,
        quantita: 1,
      },
    ];
  });
};  
const cambiaQuantita = (id: number, differenza: number) => {
    setCarrello((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantita: item.quantita + differenza }
            : item
        )
        .filter((item) => item.quantita > 0)
    );
  };

  const eliminaDalCarrello = (id: number) => {
    setCarrello((prev) => prev.filter((item) => item.id !== id));
  };

  const totaleCarrello = carrello.reduce(
    (totale, item) => totale + item.prezzo * item.quantita,
    0
  );
const costoConsegna = 10;

const importoSconto =
  scontoPercentuale < 0
    ? Math.abs(scontoPercentuale)
    : totaleCarrello * (scontoPercentuale / 100);

const totaleCarrelloScontato = Math.max(
  0,
  totaleCarrello - importoSconto
);

const totaleOrdine = totaleCarrelloScontato + costoConsegna;

const applicaCodiceSconto = () => {
  const codice = codiceSconto.trim().toUpperCase();

  if (codice === "CESOLOLALINEA26") {
    setScontoPercentuale(10);
    setMessaggioSconto("Codice applicato: sconto del 10%");
  } else if (codice === "VIP15") {
    setScontoPercentuale(15);
    setMessaggioSconto("Codice applicato: sconto del 15%");
  } else if (codice === "LALINEA5") {
    setScontoPercentuale(-5);
    setMessaggioSconto("Premio Snake applicato: -5 €");
  } else if (codice === "LALINEA10") {
    setScontoPercentuale(-10);
    setMessaggioSconto("Premio Snake applicato: -10 €");
  } else if (codice === "LALINEA15") {
    setScontoPercentuale(-15);
    setMessaggioSconto("Premio Snake applicato: -15 €");
  } else if (codice === "LALINEA20") {
    setScontoPercentuale(-20);
    setMessaggioSconto("Premio Snake applicato: -20 €");
  } else {
    setScontoPercentuale(0);
    setMessaggioSconto("Codice sconto non valido");
  }
};
 const inviaOrdineTelegram = async () => {
  const prodottiOrdine = carrello
    .map(
      (item) =>
        `${item.nome} x${item.quantita} - ${
          item.prezzo * item.quantita
        } €`
    )
    .join("\n");

  const messaggio = `
NUOVO ORDINE LALINEA

Nome: ${datiCliente.nome}
Cognome: ${datiCliente.cognome}
Email: ${datiCliente.email}
Telefono: ${datiCliente.telefono}
Indirizzo: ${datiCliente.indirizzo || "Non specificato"}

Modalità: ${modalitaOrdine || "Non specificata"}
Orario: ${orarioConsegna || "Non specificato"}

PRODOTTI:
${prodottiOrdine}

Totale prodotti: ${totaleCarrello} €
Consegna: ${costoConsegna} €
TOTALE ORDINE: ${totaleOrdine} €
  `.trim();

  const testo = encodeURIComponent(messaggio);
await fetch("/api/vip/order", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    telefono: datiCliente.telefono,
    totaleProdotti: totaleCarrello,
    costoConsegna: costoConsegna,
  }),
}).catch(() => {});
  window.location.assign(
    `https://t.me/LaLineaMiOrdini?text=${testo}`
  );
};
if (caricamentoIniziale) {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-black uppercase tracking-[0.2em] text-yellow-400">
        LALINEA
      </h1>

      <div className="mt-8 text-6xl animate-pulse">⌛</div>

      <p className="mt-8 text-zinc-400 uppercase font-bold tracking-[0.2em]">
        Sta caricando la tua sessione
      </p>
    </main>
  );
}
    if (!accessoConsentito) {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w- md border border-yellow-400 p-8 text-center">
        <h1 className="text-4xl font-black uppercase">
          LaLinea
        </h1>

        <p className="mt-3 text-zinc-400 uppercase font-bold">
          Area riservata
        </p>

        <form
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();

            if (password === "LaLineaOrGoHome26") {
              setAccessoConsentito(true);
              setErrorePassword(false);
            } else {
              setErrorePassword(true);
            }
          }}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorePassword(false);
            }}
            placeholder="Password"
            className="w-full border border-zinc-700 bg-zinc-950 px-4 py-4 text-center text-white outline-none focus:border-yellow-400"
          />

          {errorePassword && (
            <p className="mt-3 text-sm font-bold uppercase text-red-500">
              Password non corretta
            </p>
          )}

          <button
            type="submit"
            className="mt-5 w-full bg-yellow-400 px-6 py-4 font-black uppercase text-black"
          >
            Entra
          </button>
        </form>
      </div>
    </main>
  );
}

return (
    <main onClick={avviaMusica} className="min-h-screen text-white">
  <a
  href="/vip"
  className="fixed right-4 top-4 z-[9999] bg-yellow-400 px-4 py-3 text-xs font-black uppercase tracking-widest text-black shadow-xl"
>
  Area VIP
</a>
      
 

 <div className="fixed bottom-4 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 border border-white/20 bg-black/95 p-4 text-white shadow-2xl">
  <p className="mb-2 text-center text-xs font-black uppercase tracking-widest text-yellow-400">
    La selezione musicale della settimana
  </p>

  <p data-titolo-canzone className="mb-3 text-center text-sm font-bold">
    PARLU — LA REFLVENZE
  </p>

  <audio
    data-indice="0"
    src="/canzone.mp3"
    controls
    preload="metadata"
    className="w-full"
    onEnded={(evento) => {
      const canzoni = [
        { titolo: "PARLU — LA REFLVENZE", file: "/canzone.mp3" },
        { titolo: "MOLLY — GAZO", file: "/canzone2.mp3" },
        { titolo: "BIG 7 — BURNA BOY", file: "/canzone3.mp3" },
        { titolo: "STOP DIE — BURNA BOY", file: "/canzone4.mp3" },
        { titolo: "BORA BORA — SKINNY FLEX", file: "/canzone5.mp3" },
        { titolo: "DUBAI — SKINNY FLEX", file: "/canzone6.mp3" },
      ];

      const player = evento.currentTarget;
      const indice =
        (Number(player.dataset.indice || "0") + 1) % canzoni.length;

      player.dataset.indice = String(indice);
      player.src = canzoni[indice].file;

      const titolo = player.parentElement?.querySelector(
        "[data-titolo-canzone]"
      );

      if (titolo) {
        titolo.textContent = canzoni[indice].titolo;
      }

      player.play().catch(() => {});
    }}
  />

  <div className="mt-3 flex justify-center gap-3">
    <button
      type="button"
      className="bg-yellow-400 px-5 py-2 font-black text-black"
      onClick={(evento) => {
        const canzoni = [
          { titolo: "PARLU — LA REFLVENZE", file: "/canzone.mp3" },
          { titolo: "MOLLY — GAZO", file: "/canzone2.mp3" },
          { titolo: "BIG 7 — BURNA BOY", file: "/canzone3.mp3" },
          { titolo: "STOP DIE — BURNA BOY", file: "/canzone4.mp3" },
          { titolo: "BORA BORA — SKINNY FLEX", file: "/canzone5.mp3" },
          { titolo: "DUBAI — SKINNY FLEX", file: "/canzone6.mp3" },
        ];

        const contenitore = evento.currentTarget.parentElement?.parentElement;
        const player = contenitore?.querySelector("audio");

        if (!player) return;

        const indice =
          (Number(player.dataset.indice || "0") - 1 + canzoni.length) %
          canzoni.length;

        player.dataset.indice = String(indice);
        player.src = canzoni[indice].file;

        const titolo = contenitore?.querySelector("[data-titolo-canzone]");

        if (titolo) {
          titolo.textContent = canzoni[indice].titolo;
        }

        player.play().catch(() => {});
      }}
    >
      ← Indietro
    </button>

    <button
      type="button"
      className="bg-yellow-400 px-5 py-2 font-black text-black"
      onClick={(evento) => {
        const canzoni = [
          { titolo: "PARLU — LA REFLVENZE", file: "/canzone.mp3" },
          { titolo: "MOLLY — GAZO", file: "/canzone2.mp3" },
          { titolo: "BIG 7 — BURNA BOY", file: "/canzone3.mp3" },
          { titolo: "STOP DIE — BURNA BOY", file: "/canzone4.mp3" },
          { titolo: "BORA BORA — SKINNY FLEX", file: "/canzone5.mp3" },
          { titolo: "DUBAI — SKINNY FLEX", file: "/canzone6.mp3" },
        ];

        const contenitore = evento.currentTarget.parentElement?.parentElement;
        const player = contenitore?.querySelector("audio");

        if (!player) return;

        const indice =
          (Number(player.dataset.indice || "0") + 1) % canzoni.length;

        player.dataset.indice = String(indice);
        player.src = canzoni[indice].file;

        const titolo = contenitore?.querySelector("[data-titolo-canzone]");

        if (titolo) {
          titolo.textContent = canzoni[indice].titolo;
        }

        player.play().catch(() => {});
      }}
    >
      Avanti →
    </button>
  </div>
</div>aa

      {fotoAnteprima && (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
    onClick={() => setFotoAnteprima(null)}
  >
    <button
      type="button"
      onClick={() => setFotoAnteprima(null)}
      className="absolute right-4 top-4 z-[10000] text-4xl font-black text-white"
    >
      ×
    </button>

    <div
      className="max-h-[90vh] max-w-[95vw]"
      onClick={(e) => e.stopPropagation()}
    >
      {tipoAnteprima === "video" ? (
        <video
          src={fotoAnteprima}
          controls
          autoPlay
          className="max-h-[90vh] max-w-[95vw] object-contain"
        />
      ) : (
        <img
          src={fotoAnteprima}
          alt="Anteprima"
          className="max-h-[90vh] max-w-[95vw] object-contain"
        />
      )}
    </div>
  </div>
)}
{/* VIDEO BANNER */}
<section className="relative w-full overflow-hidden">
  <video
  autoPlay
  muted
  loop
  playsInline
  preload="auto"
  className="block w-full h-[220px] sm:h-[300px] md:h-[420px] object-cover"
>
  <source src="/banner.mp4" type="video/mp4" />
</video>

  <div className="pointer-events-none absolute inset-0 bg-black/20" />
</section>
   {/* HEADER */}
<header className="sticky top-0 z-50 border-b border-yellow-400/30 bg-black/95 backdrop-blur">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
    <img
      src="/Threema_2025-12-01_22-11-08 2.PNG"
      alt="LaLinea"
      className="h-40 w-auto object-contain"
    />

    <div className="relative">
  {/* BOTTONE MENU SOLO MOBILE */}
  <button
    type="button"
    onClick={() => setMenuAperto(!menuAperto)}
    className="md:hidden border border-yellow-400 px-4 py-3 font-black uppercase text-white"
  >
    MENU
  </button>

  {/* MENU DESKTOP */}
  <nav className="hidden md:flex gap-6 text-lg font-black tracking-widest sm:text-xl">
    <a className="transition hover:text-yellow-400" href="#shop">
      SHOP
    </a>

    <a className="transition hover:text-yellow-400" href="#tracking">
  TRACKING
</a>

<a className="transition hover:text-yellow-400" href="#promo">
  LE PROMO
</a>
<a
  className="transition hover:text-yellow-400"
  href="#dicono-di-noi"
>
  DICONO DI NOI
</a>
    <a className="transition hover:text-yellow-400" href="#point">
      I NOSTRI POINT
    </a>

    <a className="transition hover:text-yellow-400" href="#delivery">
      DELIVERY
    </a>

    <a className="transition hover:text-yellow-400" href="#contatti">
      CONTATTI
    </a>
  </nav>

 
</div>
</div>
</header>

{/* MENU MOBILE */}
{menuAperto && (
  <div className="fixed inset-0 z-[99999] bg-black md:hidden">
    <div className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden overscroll-contain bg-black px-6 py-8">

      {/* CHIUDI */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setMenuAperto(false)}
          className="flex h-14 w-14 items-center justify-center border-2 border-yellow-400 text-3xl font-black text-yellow-400"
        >
          ×
        </button>
      </div>

      {/* MENU */}
      <nav className="mt-8 flex w-full flex-col">

        <button
          type="button"
          onClick={() => {
            setMenuAperto(false);
            setSnakeAperto(true);
          }}
          className="w-full border-b border-yellow-400/40 py-5 text-left text-2xl font-black uppercase text-yellow-400"
        >
          GIOCA
        </button>

        <a
          href="#shop"
          onClick={() => setMenuAperto(false)}
          className="w-full border-b border-white/20 py-5 text-left text-2xl font-black uppercase text-white"
        >
          SHOP
        </a>

<a
  href="#promo"
  onClick={() => setMenuAperto(false)}
  className="w-full border-b border-white/20 py-5 text-left text-2xl font-black uppercase"
>
  LE PROMO
</a>
        <a
          href="#tracking"
          onClick={() => setMenuAperto(false)}
          className="w-full border-b border-white/20 py-5 text-left text-2xl font-black uppercase text-white"
        >
          TRACKING
        </a>

        <a
          href="#recensioni"
          onClick={() => setMenuAperto(false)}
          className="w-full border-b border-white/20 py-5 text-left text-2xl font-black uppercase text-white"
        >
          DICONO DI NOI
        </a>

        <a
          href="#point"
          onClick={() => setMenuAperto(false)}
          className="w-full border-b border-white/20 py-5 text-left text-2xl font-black uppercase text-white"
        >
          I NOSTRI POINT
        </a>

        <a
          href="#delivery"
          onClick={() => setMenuAperto(false)}
          className="w-full border-b border-white/20 py-5 text-left text-2xl font-black uppercase text-white"
        >
          DELIVERY
        </a>

        <a
          href="#contatti"
          onClick={() => setMenuAperto(false)}
          className="w-full border-b border-white/20 py-5 text-left text-2xl font-black uppercase text-white"
        >
          CONTATTI
        </a>

      </nav>
    </div>
  </div>
)}

      {/* MARQUEE */}
      <section className="overflow-hidden bg-yellow-400 py-4 text-black">
        <div className="whitespace-nowrap text-center text-sm font-black tracking-[0.3em]">
          LALINEA • MILANO • STREET CULTURE • LALINEA • MILANO • STREET CULTURE •
        </div>
      </section>
      {/* LE PROMO */}
<section id="promo" className="border-b border-zinc-800 bg-black">
  <div className="mx-auto max-w-7xl px-6 py-24">

    <p className="font-bold uppercase tracking-[0.3em] text-yellow-400">
      LaLinea Promo
    </p>

    <h2 className="mt-3 text-4xl font-black uppercase text-white md:text-5xl">
      LE PROMO
    </h2>

    <p className="mt-4 max-w-3xl text-zinc-400">
      Pack promozionali LaLinea con più prodotti selezionati a prezzo speciale.
    </p>

    <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">

      {/* SILVER PACK */}
      <div className="flex flex-col border border-zinc-700 bg-zinc-950 p-6">

        <video
  src="/products/promo/silver.mp4"
  autoPlay
  muted
  loop
  playsInline
  className="mb-6 aspect-square w-full border border-zinc-800 object-cover"
/>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400">
          Promo Pack
        </p>

        <h3 className="mt-3 text-3xl font-black uppercase text-white">
          SILVER PACK
        </h3>

        <div className="mt-6 flex-1 space-y-2 text-zinc-300">
          <p>• 3.5 Orange Punch</p>
          <p>• 3.5 Tropicana Cookies</p>
          <p>• 1 Rosin Home Made Lamponi 37ü</p>
          <p>• 1 Pack cartine + Filtri Raw</p>
          <p>• 1 Portachiavi LaLinea</p>
        </div>

        <p className="mt-8 text-4xl font-black text-yellow-400">
          50 €
        </p>

        <button
          type="button"
          onClick={() => {
            const id = "silver-pack";

            setCarrello((prev) => {
              const esistente = prev.find(
                (item) => String(item.id) === id
              );

              if (esistente) {
                return prev.map((item) =>
                  String(item.id) === id
                    ? { ...item, quantita: item.quantita + 1 }
                    : item
                );
              }

              return [
                ...prev,
                {
                  id: id as any,
                  nome: "SILVER PACK",
                  prezzo: 50,
                  quantita: 1,
                },
              ];
            });
          }}
          className="mt-6 w-full border border-yellow-400 bg-yellow-400 px-5 py-4 font-black uppercase text-black"
        >
          Aggiungi al carrello
        </button>
      </div>

      {/* GOLD PACK */}
      <div className="flex flex-col border border-yellow-400/60 bg-zinc-950 p-6">
      <video
  src="/products/promo/gold.mp4"
  autoPlay
  muted
  loop
  playsInline
  className="mb-6 aspect-square w-full border border-zinc-800 object-cover"
/>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-400">
          Promo Pack
        </p>

        <h3 className="mt-3 text-3xl font-black uppercase text-white">
          GOLD PACK
        </h3>

        <div className="mt-6 flex-1 space-y-2 text-zinc-300">
          <p>• 10 Lamponi 120u Filtred</p>
          <p>• 10 Gorilla Glue #2 Calispain</p>
          <p>• 5 Sour Diesel X FF Frozen</p>
          <p>• 1 Cover LaLinea (previa disponibilità modello)</p>
          <p>• 1 Filtro in vetro Raw</p>
          <p>• 1 Pack Cartine + Filtri Raw</p>
        </div>

        <p className="mt-8 text-4xl font-black text-yellow-400">
          150 €
        </p>

        <button
          type="button"
          onClick={() => {
            const id = "gold-pack";

            setCarrello((prev) => {
              const esistente = prev.find(
                (item) => String(item.id) === id
              );

              if (esistente) {
                return prev.map((item) =>
                  String(item.id) === id
                    ? { ...item, quantita: item.quantita + 1 }
                    : item
                );
              }

              return [
                ...prev,
                {
                  id: id as any,
                  nome: "GOLD PACK",
                  prezzo: 150,
                  quantita: 1,
                },
              ];
            });
          }}
          className="mt-6 w-full border border-yellow-400 bg-yellow-400 px-5 py-4 font-black uppercase text-black"
        >
          Aggiungi al carrello
        </button>
      </div>

      {/* BE A HERO PACK */}
      <div className="flex flex-col border border-yellow-400 bg-zinc-950 p-6">
        <video
  src="/products/promo/hero.mp4"
  autoPlay
  muted
  loop
  playsInline
  className="mb-6 aspect-square w-full border border-zinc-800 object-cover"
/>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-400">
          Top Promo
        </p>

        <h3 className="mt-3 text-3xl font-black uppercase text-white">
          BE A HERO PACK
        </h3>

        <div className="mt-6 flex-1 space-y-2 text-zinc-300">
          <p>• 10 Gorilla Glue #2</p>
          <p>• 10 Blueberry Filtred 73Ü</p>
          <p>• 10 Lemon Cherry Gelato 120ü</p>
          <p>• 10 SnowHeads 90ü</p>
          <p>• 3.5 Orange Soda Frozen</p>
          <p>• 3.5 SD X FF Frozen</p>
          <p>• 3 Rosin Home Made LaLinea</p>
          <p>• 1 Paio calzini LaLinea</p>
          <p>• 1 Pack Filtri + Cartine Raw</p>
          <p>• 1 Mese abbonamento Spotify</p>
        </div>

        <p className="mt-8 text-4xl font-black text-yellow-400">
          300 €
        </p>

        <button
          type="button"
          onClick={() => {
            const id = "be-a-hero-pack";

            setCarrello((prev) => {
              const esistente = prev.find(
                (item) => String(item.id) === id
              );

              if (esistente) {
                return prev.map((item) =>
                  String(item.id) === id
                    ? { ...item, quantita: item.quantita + 1 }
                    : item
                );
              }

              return [
                ...prev,
                {
                  id: id as any,
                  nome: "BE A HERO PACK",
                  prezzo: 300,
                  quantita: 1,
                },
              ];
            });
          }}
          className="mt-6 w-full border border-yellow-400 bg-yellow-400 px-5 py-4 font-black uppercase text-black"
        >
          Aggiungi al carrello
        </button>
      </div>

    </div>

    {/* INFO MODIFICHE PACK */}
    <div className="mt-10 border border-yellow-400/40 bg-zinc-950 p-6">
      <p className="font-black uppercase leading-relaxed text-yellow-400">
        È POSSIBILE APPORTARE MODIFICHE AI PACCHETTI SU RICHIESTA,
        AGGIUNGENDO ANCHE PRODOTTI DELLA CATEGORIA OTHER.
      </p>

      <p className="mt-3 text-zinc-300">
        Per maggiori informazioni:{" "}
        <a
          href="https://t.me/LaLineaInfoAssistenza"
          target="_blank"
          rel="noopener noreferrer"
          className="font-black text-yellow-400"
        >
          @LaLineaInfoAssistenza
        </a>
      </p>
    </div>

  </div>
</section>

{/* TRACKING */}
<section id="tracking" className="border-b border-zinc-800 bg-black">
  <div className="mx-auto max-w-7xl px-6 py-24">

    <p className="font-bold uppercase tracking-[0.3em] text-yellow-400">
      Tracking
    </p>

    <h2 className="mt-3 text-5xl font-black uppercase tracking-tight">
      Traccia il tuo ordine
    </h2>

    <p className="mt-4 text-zinc-400">
      Inserisci il codice tracking ricevuto con il tuo ordine.
    </p>

    <form
      className="mt-8 flex flex-col gap-4 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();

        const form = new FormData(e.currentTarget);
        const codice = String(form.get("tracking") || "").trim();

        if (!codice) return;

        window.open(
  `https://www.17track.net/it?nums=${encodeURIComponent(codice)}`,
  "_blank",
  "noopener,noreferrer"
);
      }}
    >
      <input
        type="text"
        name="tracking"
        required
        placeholder="Inserisci codice tracking"
        className="w-full border border-zinc-700 bg-black p-4 text-white outline-none focus:border-yellow-400"
      />

      <button
        type="submit"
        className="bg-yellow-400 px-8 py-4 font-black uppercase text-black"
      >
        Cerca
      </button>
    </form>

  </div>
</section>
     
{/* SHOP */}
      <section id="shop" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14">
          <p className="font-bold uppercase tracking-[0.3em] text-yellow-400">
            BENVENUTO NELLO SHOP LALINEA OFFICIAL
          </p>

          <h2 className="mt-3 text-5xl font-black uppercase tracking-tight">
            I NOSTRI PRODOTTI SELEZIONATI 
            < br/>
            10 anni di attivitità su telegram
            < br/>
             + di 1000FEEDBACK positivi
          </h2>

          <p className="mt-4 text-zinc-500">
            Da 10 anni selezioniamo i migliori prodotti da tutto il mondo per i nostri clienti
            < br/>
            ecco a voi la selezione attuale:
          </p>
        </div>
{/* CATEGORIE SHOP */}
<div className="mb-12 grid grid-cols-2 gap-3 md:grid-cols-4">
  {[
    "Premium Filtred",
    "Frozen e Static",
    "Rosin & Pen",
    "Flowers",
    "Other",
    "Gadget",
    "Abbigliamento",
  ].map((categoria) => (
    <button
      key={categoria}
      type="button"
      onClick={() => setCategoriaAttiva(categoria)}
      className={`border px-4 py-4 text-sm font-black uppercase tracking-wider transition ${
        categoriaAttiva === categoria
          ? "border-yellow-400 bg-yellow-400 text-black"
          : "border-zinc-800 bg-zinc-950 text-white hover:border-yellow-400 hover:text-yellow-400"
      }`}
    >
      {categoria}
    </button>
  ))}
</div>
{/* PRODOTTI PREMIUM FILTRED */}
{categoriaAttiva === "Premium Filtred" && (
<>
  <div className="mt-10">
  
    <div className="border border-yellow-400/40 bg-black/80 p-5">

      <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
        Premium Filtred
      </p>

      <h3 className="mt-2 text-3xl font-black uppercase text-white">
        LAMPONI 120U
      </h3>

     <p className="mt-1 font-bold uppercase text-zinc-400">
      By Maradona Selection 
      < br/>
      
      Indica 50%
      < br/>
      Sativa 50%
      < br/>
      GUSTO: Presenta note dolci di agrumi, frutti di bosco, vaniglia e uva
      < br/>
      EFFETTO: Offre un mix di gioia mentale edificante e delicato rilassamento fisico
      < br/>
     senza una pesante sedazione.
    
    </p>


      <div className="mt-6 flex items-start gap-4">

  {/* VIDEO A SINISTRA */}
  <video
    src="/products/premium-filtred/maradona1.mp4"
    autoPlay
    muted
    loop
    playsInline
    className="w-1/4 aspect-square object-cover flex-shrink-0"
  />

  {/* FOTO A DESTRA */}
  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
    {[2, 3, 4, 5, 6, 7, 8].map((numero) => (
      <img
        key={numero}
        src={`/products/premium-filtred/maradona${numero}.jpg`}
        alt={`LAMPONI 120U - foto ${numero}`}
        className="w-full aspect-square object-cover"
      />
    ))}
  </div>

</div>

      <a
        href="https://t.me/+UIRWbzgEJ8w4ZWI0"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block border border-yellow-400 bg-yellow-400 px-6 py-4 font-black uppercase tracking-widest text-black"
      >
        Informazioni su Telegram
      </a>
<div className="mt-6">
  <p className="mb-3 font-bold uppercase text-white">
    Quantità disponibili
  </p>

  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
    {[
      { grammi: "5g", prezzo: 30 },
      { grammi: "10g", prezzo: 55 },
      { grammi: "25g", prezzo: 150 },
      { grammi: "50g", prezzo: 240 },
      { grammi: "100g", prezzo: 350 },
   ].map((opzione) => (
  <button
    key={opzione.grammi}
    type="button"
    onClick={() =>
      aggiungiMaradonaAlCarrello(opzione.grammi, opzione.prezzo)
    }
    className="border border-yellow-400 bg-zinc-950 px-4 py-4 text-center hover:bg-yellow-400 hover:text-black"
  >
    <p className="font-black text-white">
      {opzione.grammi}
    </p>

    <p className="mt-1 font-bold text-yellow-400">
      {opzione.prezzo} €
    </p>

    <p className="mt-2 text-xs font-black uppercase">
      Aggiungi al carrello
    </p>
  </button>
))}
</div>
  <p className="mt-4 text-sm font-bold uppercase text-zinc-400">
    Per quantità maggiori, contattare in privato. Nella sezione Contatti
    troverete tutte le info.
  </p>
</div>
    </div>
  </div>

  {/* LEMON CHERRY GELATO - MAGIC MOUNTAIN FARMERS */}
<div className="mt-8 border border-yellow-400/40 bg-black/80 p-5">
  <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
    Premium Filtred
  </p>

  <h3 className="mt-2 text-3xl font-black uppercase text-white">
    LEMON CHERRY GELATO 
  </h3>

      <p className="mt-1 font-bold uppercase text-zinc-400">
    BY MAGIC MOUNTAIN FARMERS 
    <br />
    BILANCIAMENTO: 60% Indica / 40% Sativa 
    <br />
    GENETICA: Sunset Sherbet x Girl Scout Cookies 
    <br />
AROMA:  Fruttato, di limone, ciliegia e sfumature cremose.
<br />
EFFETTO : Inizia con una sensazione di euforia e lucidità per poi evolvere in un forte rilassamento del corpo
  </p>

  {/* LEMON CHERRY GELATO - MAGIC MOUNTAIN FARMERS */}
<div className="mt-10">
  <div className="border border-yellow-400/40 bg-black/80 p-5">

    <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
      Premium Filtred
    </p>

    <h3 className="mt-2 text-3xl font-black uppercase text-white">
      LEMON CHERRY GELATO
    </h3>

    <p className="mt-1 font-bold uppercase text-zinc-400">
      BY MAGIC MOUNTAIN FARMERS
    </p>

    {/* VIDEO + FOTO */}
<div className="mt-6 flex items-start gap-4">

  {/* VIDEO A SINISTRA */}
  <video
    src="/products/premium-filtred/lm4.mp4"
    autoPlay
    muted
    loop
    playsInline
    className="w-1/4 aspect-square object-cover flex-shrink-0"
  />

  {/* FOTO A DESTRA */}
  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
    <img
      src="/products/premium-filtred/lm1.jpg"
      alt="Lemon Cherry Gelato 1"
      className="w-full aspect-square object-cover"
    />

    <img
      src="/products/premium-filtred/lm2.jpg"
      alt="Lemon Cherry Gelato 2"
      className="w-full aspect-square object-cover"
    />

    <img
      src="/products/premium-filtred/lm3.jpg"
      alt="Lemon Cherry Gelato 3"
      className="w-full aspect-square object-cover"
    />

    <img
      src="/products/premium-filtred/lm4.jpg"
      alt="Lemon Cherry Gelato 4"
      className="w-full aspect-square object-cover"
    />

    <img
      src="/products/premium-filtred/lm5.jpg"
      alt="Lemon Cherry Gelato 5"
      className="w-full aspect-square object-cover"
    />
  </div>
</div>


    {/* QUANTITÀ */}
    <div className="mt-6">
      <p className="mb-3 font-bold uppercase text-white">
        Seleziona quantità
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { grammi: "5g", prezzo: 40 },
          { grammi: "10g", prezzo: 70 },
          { grammi: "25g", prezzo: 160 },
          { grammi: "50g", prezzo: 270 },
          { grammi: "100g", prezzo: 430 },
          { grammi: "250g", prezzo: 900 },
          { grammi: "500g", prezzo: 1500 },
        ].map((opzione) => (
          <button
            key={opzione.grammi}
            type="button"
            onClick={() => {
              const id = `lemon-cherry-${opzione.grammi}`;

              setCarrello((prev) => {
                const esistente = prev.find(
                  (item) => String(item.id) === id
                );

                if (esistente) {
                  return prev.map((item) =>
                    String(item.id) === id
                      ? {
                          ...item,
                          quantita: item.quantita + 1,
                        }
                      : item
                  );
                }

                return [
                  ...prev,
                  {
                    id: id as any,
                    nome: `Lemon Cherry Gelato By Magic Mountain Farmers ${opzione.grammi}`,
                    prezzo: opzione.prezzo,
                    quantita: 1,
                  },
                ];
              });
            }}
            className="border border-yellow-400 bg-zinc-950 px-4 py-4 text-center"
          >
            <p className="text-xl font-black text-white">
              {opzione.grammi}
            </p>

            <p className="mt-3 text-xl font-black text-yellow-400">
              {opzione.prezzo} €
            </p>

            <p className="mt-2 text-xs font-black uppercase text-white">
              Aggiungi al carrello
            </p>
          </button>
        ))}
      </div>
    </div>

    <p className="mt-4 text-sm font-bold uppercase text-zinc-400">
      Per quantità maggiori, contattare in privato. Nella sezione Contatti
      troverete tutte le info.
    </p>

  </div>
</div>
{/* BLUEBERRY PREMIUM 73ü */}
<div className="mt-10">
  <div className="border border-yellow-400/40 bg-black/80 p-5">

    <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
      Premium Filtred
    </p>

    <h3 className="mt-2 text-3xl font-black uppercase text-white">
      BLUEBERRY PREMIUM 73ü
    </h3>

    <p className="mt-1 font-bold uppercase text-zinc-400">
    BY ZAZA FARM MOROCCO 
    <br />
    BILANCIAMENTO: 80% Indica e 20% Sativa
    <br />
    GENETICA: Afghani x Thai 
    <br />
AROMA:  Dolce, con un forte profumo di mirtillo fresco e frutti di bosco.
<br />
EFFETTO : IMolto rilassante per il corpo, ideale per la sera o per alleviare lo stress e il dolore.
  </p>

    {/* VIDEO + FOTO */}
    <div className="mt-6 flex items-start gap-4">

      {/* VIDEO A SINISTRA */}
      <video
        src="/products/premium-filtred/blu1.MOV"
        autoPlay
        muted
        loop
        playsInline
        className="w-1/4 aspect-square object-cover flex-shrink-0"
      />

      {/* FOTO A DESTRA */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">

        <img
          src="/products/premium-filtred/blu2.jpg"
          alt="BlueBerry Premium 73ü 1"
          className="w-full aspect-square object-cover"
        />

        <img
          src="/products/premium-filtred/blu3.jpg"
          alt="BlueBerry Premium 73ü 2"
          className="w-full aspect-square object-cover"
        />

        <img
          src="/products/premium-filtred/blu4.jpg"
          alt="BlueBerry Premium 73ü 3"
          className="w-full aspect-square object-cover"
        />

        <img
          src="/products/premium-filtred/blu5.jpg"
          alt="BlueBerry Premium 73ü 4"
          className="w-full aspect-square object-cover"
        />

      </div>
    </div>

    {/* QUANTITÀ */}
    <div className="mt-6">

      <p className="mb-3 font-bold uppercase text-white">
        Seleziona quantità
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

        {[
          { grammi: "5g", prezzo: 45 },
          { grammi: "7g", prezzo: 60 },
          { grammi: "25g", prezzo: 170 },
          { grammi: "50g", prezzo: 250 },
        ].map((opzione) => (

          <button
            key={opzione.grammi}
            type="button"
            onClick={() => {
              const id = `blueberry-premium-73u-${opzione.grammi}`;

              setCarrello((prev) => {
                const esistente = prev.find(
                  (item) => String(item.id) === id
                );

                if (esistente) {
                  return prev.map((item) =>
                    String(item.id) === id
                      ? {
                          ...item,
                          quantita: item.quantita + 1,
                        }
                      : item
                  );
                }

                return [
                  ...prev,
                  {
                    id: id as any,
                    nome: `BlueBerry Premium 73ü ${opzione.grammi}`,
                    prezzo: opzione.prezzo,
                    quantita: 1,
                  },
                ];
              });
            }}
            className="border border-yellow-400 bg-zinc-950 px-4 py-4 text-center"
          >

            <p className="text-xl font-black text-white">
              {opzione.grammi}
            </p>

            <p className="mt-3 text-xl font-black text-yellow-400">
              {opzione.prezzo} €
            </p>

            <p className="mt-2 text-xs font-black uppercase text-white">
              Aggiungi al carrello
            </p>

          </button>

        ))}

      </div>
    </div>

    <p className="mt-4 text-sm font-bold uppercase text-zinc-400">
      Per quantità maggiori, contattare in privato. Nella sezione Contatti
      troverete tutte le info.
    </p>

  </div>
</div>
  {/* SNOWHEADS 90u */}
<div className="mt-8 border border-yellow-400/40 bg-black/80 p-5">
  <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
    Premium Filtred
  </p>

  <h3 className="mt-2 text-3xl font-black uppercase text-white">
    SNOWHEADS 90u
  </h3>

  <p className="mt-1 font-bold uppercase text-zinc-400">
    INDICA:
< br/>
SATIVA:
  < br/>
   GUSTO: NOTE DI BUCCIA DI LIMONE, GAS E MENTOLO 
   < br/>
   EFFETTO: Un ibrido a prevalenza sativa che offre una rapida stimolazione cerebrale, lucidità e una carica energizzante. È comunemente utilizzato per favorire la produttività diurna o alleviare lo stress.
  </p>

  {/* VIDEO + FOTO */}
  <div className="mt-6 flex items-start gap-4">

    {/* VIDEO A SINISTRA */}
    <video
      src="/products/premium-filtred/head2.MOV"
      autoPlay
      muted
      loop
      playsInline
      className="w-1/4 aspect-square object-cover flex-shrink-0"
    />

    {/* FOTO A DESTRA */}
    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
      <img
        src="/products/premium-filtred/head1.jpg"
        alt="SNOWHEADS 90u 1"
        className="w-full aspect-square object-cover"
      />

      <img
        src="/products/premium-filtred/head3.jpg"
        alt="SNOWHEADS 90u 2"
        className="w-full aspect-square object-cover"
      />

      <img
        src="/products/premium-filtred/head4.jpg"
        alt="SNOWHEADS 90u 3"
        className="w-full aspect-square object-cover"
      />

      <img
        src="/products/premium-filtred/head5.jpg"
        alt="SNOWHEADS 90u 4"
        className="w-full aspect-square object-cover"
      />
    </div>
  </div>

  {/* QUANTITÀ */}
  <div className="mt-6">
    <p className="mb-3 font-bold uppercase text-white">
      Seleziona quantità
    </p>

    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {[
        { grammi: "5g", prezzo: 40 },
        { grammi: "10g", prezzo: 70 },
        { grammi: "25g", prezzo: 160 },
        { grammi: "50g", prezzo: 270 },
        { grammi: "100g", prezzo: 430 },
        { grammi: "250g", prezzo: 900 },
        { grammi: "500g", prezzo: 1500 },
      ].map((opzione) => (
        <button
          key={opzione.grammi}
          type="button"
          onClick={() => {
            const id = `snowheads-90u-${opzione.grammi}`;

            setCarrello((prev) => {
              const esistente = prev.find(
                (item) => String(item.id) === id
              );

              if (esistente) {
                return prev.map((item) =>
                  String(item.id) === id
                    ? {
                        ...item,
                        quantita: item.quantita + 1,
                      }
                    : item
                );
              }

              return [
                ...prev,
                {
                  id: id as any,
                  nome: `SNOWHEADS 90u ${opzione.grammi}`,
                  prezzo: opzione.prezzo,
                  quantita: 1,
                },
              ];
            });
          }}
          className="border border-yellow-400 bg-zinc-950 px-4 py-4 text-center"
        >
          <p className="text-xl font-black text-white">
            {opzione.grammi}
          </p>

          <p className="mt-3 text-xl font-black text-yellow-400">
            {opzione.prezzo} €
          </p>

          <p className="mt-2 text-xs font-black uppercase text-white">
            Aggiungi al carrello
          </p>
        </button>
      ))}
    </div>
  </div>

  <p className="mt-4 text-sm font-bold uppercase text-zinc-400">
    Per quantità maggiori, contattare in privato. Nella sezione Contatti
    troverete tutte le info.
  </p>
</div>
</div>
</>
)}

{/* PINK LEMON 120U PREMIUM */}
{categoriaAttiva === "Premium Filtred" && (
  <div className="mt-8 border border-yellow-400/40 bg-black/80 p-5">
    <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
      Premium Filtred
    </p>

    <h3 className="mt-2 text-3xl font-black uppercase text-white">
      PINK LEMON 120U PREMIUM
    </h3>

    <p className="mt-1 font-bold uppercase text-zinc-400">
      Indica 80%
      <br />
      Sativa 20%
      <br />
      Purple Kush × Lemon Skunk × Anonymous St.
    </p>

    <p className="mt-4 border border-yellow-400 bg-yellow-400 px-3 py-2 font-black uppercase text-black">
      Prodotto in promozione — lancio domenica
      <br />
      I prezzi verranno aggiornati
    </p>

    <div className="mt-6 flex items-start gap-4">
      <video
        src="/products/premium-filtred/pivo.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="w-1/4 aspect-square object-cover flex-shrink-0"
      />

      <div className="flex-1 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[2, 3, 4, 6].map((numero) => (
          <img
            key={numero}
            src={`/products/premium-filtred/pivo${numero}.jpg`}
            alt={`PINK LEMON 120U PREMIUM foto ${numero}`}
            className="w-full aspect-square object-cover"
          />
        ))}
      </div>
    </div>

    <div className="mt-6">
      <p className="mb-3 font-bold uppercase text-white">
        Seleziona quantità
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { grammi: "10G", prezzo: 60 },
          { grammi: "25G", prezzo: 130 },
          { grammi: "50G", prezzo: 215 },
          { grammi: "100G", prezzo: 400 },
          { grammi: "250G", prezzo: 760 },
        ].map((opzione) => (
          <button
            key={opzione.grammi}
            type="button"
            onClick={() => {
              const id = `pink-lemon-${opzione.grammi}`;

              setCarrello((prev) => {
                const esistente = prev.find(
                  (item) => String(item.id) === id
                );

                if (esistente) {
                  return prev.map((item) =>
                    String(item.id) === id
                      ? {
                          ...item,
                          quantita: item.quantita + 1,
                        }
                      : item
                  );
                }

                return [
                  ...prev,
                  {
                    id: id as any,
                    nome: `PINK LEMON 120U PREMIUM ${opzione.grammi}`,
                    prezzo: opzione.prezzo,
                    quantita: 1,
                  },
                ];
              });
            }}
            className="border border-yellow-400 bg-zinc-950 px-4 py-4 text-center"
          >
            <p className="text-xl font-black text-white">
              {opzione.grammi}
            </p>

            <p className="mt-3 text-xl font-black text-yellow-400">
              {opzione.prezzo} €
            </p>

            <p className="mt-5 text-sm font-black uppercase text-white">
              Aggiungi al carrello
            </p>
          </button>
        ))}
      </div>
    </div>
  </div>
)}

{/* PRODOTTO FROZEN E STATIC */}
{categoriaAttiva === "Frozen e Static" && (
  <div className="mt-8 border border-yellow-400/40 bg-black/80 p-5">
    <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
      Frozen e Static
    </p>

    <h3 className="mt-2 text-3xl font-black uppercase text-white">
      ORANGE PUNCH FROZEN
    </h3>

    <p className="mt-1 font-bold uppercase text-zinc-400">
      BY PABLITO FARM - BOLLE GLASSY da 50gr
      < br/>
      
      Indica 70%
      < br/>
      Sativa 30%
      < br/>
      GUSTO: Arancia candita,Buccia di Arancia,Caramella alla frutta
      < br/>
      EFFETTO: Genetica gia a forte predominanza indica il setaccio congelato ed il format
      < br/>
      da 50gr fanno da contenitore per un vero pugno alla joshua che ti manderà a letto 
    < br/>
    in totale relax e con un retrogusto di zeste di arancia. Buona fumata
    </p>

    <div className="mt-6 flex items-start gap-4">
      <video
        src="/products/frozen-static/arancia2.mov"
        autoPlay
        muted
        loop
        playsInline
        className="w-1/4 aspect-square object-cover flex-shrink-0"
      />

      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 3, 4, 5].map((numero) => (
          <img
            key={numero}
            src={`/products/frozen-static/arancia${numero}.jpeg`}
            alt={`Orange Punch Frozen foto ${numero}`}
            className="w-full aspect-square object-cover"
          />
        ))}
      </div>
    </div>

    <div className="mt-6">
      <p className="mb-3 font-bold uppercase text-white">
        Seleziona quantità
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { grammi: "5g", prezzo: 50 },
          { grammi: "10g", prezzo: 80 },
          { grammi: "25g", prezzo: 170 },
          { grammi: "50g", prezzo: 330 },
        ].map((opzione) => (
          <button
            key={opzione.grammi}
            type="button"
            onClick={() =>
              aggiungiOrangeAlCarrello(opzione.grammi, opzione.prezzo)
            }
            className="border border-yellow-400 bg-zinc-950 px-4 py-4 text-center"
          >
            <p className="text-xl font-black text-white">
              {opzione.grammi}
            </p>

            <p className="mt-3 text-xl font-black text-yellow-400">
              {opzione.prezzo} €
            </p>

            <p className="mt-5 text-sm font-black uppercase text-white">
              Aggiungi al carrello
            </p>
          </button>
        ))}
      </div>
    </div>
  </div>
)}
{/* SOUR DIESEL X FORBIDDEN FRUIT */}
{categoriaAttiva === "Frozen e Static" && (
  <div className="mt-8 border border-yellow-400/40 bg-black/80 p-5">
    <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
      Frozen e Static
    </p>

    <h3 className="mt-2 text-3xl font-black uppercase text-white">
      SOUR DIESEL X FORBIDDEN FRUIT
    </h3>

    <p className="mt-1 font-bold uppercase text-zinc-400">
      BY PABLITO FARM - BOLLE GLASSY da 50gr
      < br/>
      
      Indica 40%
      < br/>
      Sativa 60%
      < br/>
      GUSTO: Frutta tropicale, kiwi, papaya e uva dolce mescolati con un forte sentore di carburante (jet-fuel)
      < br/>
       pino e scorza di limone.  A detta di molti il cross del decennio 
      < br/>
      EFFETTO: focus cerebrale ed energizzante all'inizio
      < br/>
     abbinato a una graduale e rilassante euforia corporea
    
    </p>

    <div className="mt-6 flex items-start gap-4">
      <video
        src="/products/frozen-static/sdff2.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="w-1/4 aspect-square object-cover flex-shrink-0"
      />

      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
        <img
          src="/products/frozen-static/sdff1.jpg"
          alt="Sour Diesel X Forbidden Fruit foto 1"
          className="w-full aspect-square object-cover"
        />

        <img
          src="/products/frozen-static/sdff3.jpg"
          alt="Sour Diesel X Forbidden Fruit foto 2"
          className="w-full aspect-square object-cover"
        />

        <img
          src="/products/frozen-static/sdff4.jpg"
          alt="Sour Diesel X Forbidden Fruit foto 3"
          className="w-full aspect-square object-cover"
        />

        <img
          src="/products/frozen-static/sdff5.jpg"
          alt="Sour Diesel X Forbidden Fruit foto 4"
          className="w-full aspect-square object-cover"
        />
      </div>
    </div>

    <div className="mt-6">
      <p className="mb-3 font-bold uppercase text-white">
        Seleziona quantità
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {sourDieselOpzioni.map((opzione) => (
          <button
            key={opzione.grammi}
            type="button"
            onClick={() =>
              aggiungiSourDieselAlCarrello(
                opzione.grammi,
                opzione.prezzo
              )
            }
            className="border border-yellow-400 bg-zinc-950 px-4 py-4 text-center hover:bg-yellow-400 hover:text-black"
          >
            <p className="font-black text-white">
              {opzione.grammi}
            </p>

            <p className="mt-1 font-bold text-yellow-400">
              {opzione.prezzo} €
            </p>

            <p className="mt-2 text-xs font-black uppercase">
              Aggiungi al carrello
            </p>
          </button>
        ))}
      </div>
    </div>
  </div>
)}
{/* LEMON STATIC PREMIUM */}
{categoriaAttiva === "Frozen e Static" && (
  <div className="mt-8 border border-yellow-400/40 bg-black/80 p-5">
    <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
      Frozen e Static
    </p>

    <h3 className="mt-2 text-2xl font-black uppercase text-white">
      LEMON STATIC PREMIUM
    </h3>

    <p className="mt-3 font-bold uppercase text-zinc-400">
      INDICA 50%
      <br />
      SATIVA 50%
      <br />
      GUSTO: buccia di limone, cedro, sentori di Kush e pino
      <br />
      EFFETTO: uplifting totale, mentale e fisico, ottimo per il
      sollievo dal dolore. Questa genetica viene utilizzata da circa
      vent&apos;anni anche a livello palliativo.
    </p>

    <div className="mt-6 flex items-start gap-4">
      <video
        src="/products/frozen-static/lemon1.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="w-1/4 aspect-square object-cover flex-shrink-0"
      />

      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
        <img
          src="/products/frozen-static/lemon2.jpg"
          alt="Lemon Static Premium foto 1"
          className="w-full aspect-square object-cover"
        />

        <img
          src="/products/frozen-static/lemon3.jpg"
          alt="Lemon Static Premium foto 2"
          className="w-full aspect-square object-cover"
        />

        <img
          src="/products/frozen-static/lemon4.jpg"
          alt="Lemon Static Premium foto 3"
          className="w-full aspect-square object-cover"
        />

        <img
          src="/products/frozen-static/lemon5.jpg"
          alt="Lemon Static Premium foto 4"
          className="w-full aspect-square object-cover"
        />

        <img
          src="/products/frozen-static/lemon6.jpg"
          alt="Lemon Static Premium foto 5"
          className="w-full aspect-square object-cover"
        />

        <img
          src="/products/frozen-static/lemon7.jpg"
          alt="Lemon Static Premium foto 6"
          className="w-full aspect-square object-cover"
        />
      </div>
    </div>

    <div className="mt-6">
      <p className="text-sm font-bold uppercase text-white">
        Seleziona quantità
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {lemonStaticOpzioni.map((opzione) => (
          <button
            key={opzione.grammi}
            type="button"
            onClick={() =>
              aggiungiLemonStaticAlCarrello(
                opzione.grammi,
                opzione.prezzo
              )
            }
            className="border border-yellow-400 bg-zinc-950 px-4 py-4 text-center hover:bg-yellow-400 hover:text-black transition"
          >
            <p className="font-black text-white">
              {opzione.grammi}
            </p>

            <p className="mt-1 font-bold text-yellow-400">
              {opzione.prezzo} €
            </p>

            <p className="mt-2 text-xs font-black uppercase">
              Aggiungi al carrello
            </p>
          </button>
        ))}
      </div>
    </div>
  </div>
)}

{/* ROSIN H HOMEMADE 37u */}
{categoriaAttiva === "Rosin & Pen" && (
  <div className="mt-8 border border-yellow-400/40 bg-black/80 p-5">
    <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
      Rosin & Pen
    </p>

    <h3 className="mt-2 text-3xl font-black uppercase text-white">
      ROSIN H HOMEMADE 37u
    </h3>

    <p className="mt-1 font-bold uppercase text-zinc-400">
      Rosin prodotto a Milano da noi
      <br />
      con presse Qnubu, crioterapia e una lunga cura
    </p>

    <div className="mt-6 flex items-start gap-4">
      <video
        src="/products/rosin/rosin1.MOV"
        autoPlay
        muted
        loop
        playsInline
        className="w-1/4 aspect-square object-cover flex-shrink-0"
      />

      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 5].map((numero) => (
          <img
            key={numero}
            src={`/products/rosin/rosint${numero}.jpg`}
            alt={`ROSIN H HOMEMADE 37u foto ${numero}`}
            className="w-full aspect-square object-cover"
          />
        ))}
      </div>
    </div>

    <div className="mt-6">
      <p className="mb-3 font-bold uppercase text-white">
        Seleziona quantità
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { grammi: "2.5G", prezzo: 60 },
          { grammi: "5G", prezzo: 100 },
          { grammi: "10G", prezzo: 200 },
          { grammi: "25G", prezzo: 375 },
          { grammi: "50G", prezzo: 450 },
        ].map((opzione) => (
          <button
            key={opzione.grammi}
            type="button"
            onClick={() =>
              aggiungiRosinAlCarrello(
                opzione.grammi,
                opzione.prezzo
              )
            }
            className="border border-yellow-400 bg-zinc-950 px-4 py-4 text-center"
          >
            <p className="text-xl font-black text-white">
              {opzione.grammi}
            </p>

            <p className="mt-3 text-xl font-black text-yellow-400">
              {opzione.prezzo} €
            </p>

            <p className="mt-5 text-sm font-black uppercase text-white">
              Aggiungi al carrello
            </p>
          </button>
        ))}
      </div>
    </div>
  </div>
)}

{/* FLOWERS - GORILLA GLUE 2 CALISPAIN */}
{categoriaAttiva === "Flowers" && (
  <div className="mt-8 border border-yellow-400/40 bg-black/80 p-5">

    <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
      Flowers
    </p>

    <h3 className="mt-2 text-3xl font-black uppercase text-white">
      #GORILLA GLUE 2 CALISPAIN
    </h3>

    <p className="mt-3 text-zinc-400">
      Indica 70%
      < br/>
      Sativa 30%
      < br/>
      GUSTO: Diesel,Colla,Pino,Gas  
      < br/>
      EFFETTO: indica 2.0 come amiamo chiamarle noi effetto kush immediato fisico
      < br/>
      e mentale senza lasciarti spalmato 5 ore senza far nulla 
    </p>

    <div className="mt-6 flex items-start gap-4">

      {/* VIDEO A SINISTRA */}
      <video
        src="/products/flowers/gorilla1.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="w-1/4 aspect-square object-cover flex-shrink-0"
      />

      {/* FOTO A DESTRA */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
        {[2, 3, 4, 5, 6].map((numero) => (
          <img
            key={numero}
            src={`/products/flowers/gorilla${numero}.jpg`}
            alt={`Gorilla Glue 2 CaliSpain foto ${numero}`}
            className="w-full aspect-square object-cover"
          />
        ))}
      </div>

    </div>

    {/* QUANTITÀ */}
    <div className="mt-6">
      <p className="mb-3 font-bold uppercase text-white">
        Seleziona quantità
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { grammi: "5g", prezzo: 40 },
          { grammi: "10g", prezzo: 70 },
          { grammi: "25g", prezzo: 190 },
          { grammi: "50g", prezzo: 300 },
          { grammi: "100g", prezzo: 520 },
        ].map((opzione) => (
          <button
            key={opzione.grammi}
            type="button"
            onClick={() =>
              aggiungiGorillaAlCarrello(
                opzione.grammi,
                opzione.prezzo
              )
            }
            className="border border-yellow-400 bg-zinc-950 px-4 py-4 text-center hover:bg-yellow-400 hover:text-black"
          >
            <p className="text-xl font-black text-white">
              {opzione.grammi}
            </p>

            <p className="mt-3 text-xl font-black text-yellow-400">
              {opzione.prezzo} €
            </p>

            <p className="mt-2 text-xs font-black uppercase">
              Aggiungi al carrello
            </p>
          </button>
        ))}
      </div>
    </div>
    {/* FLOWERS - TROPICANA COOKIES CALISPAIN */}
{categoriaAttiva === "Flowers" && (
  <div className="mt-8 border border-yellow-400/40 bg-black/80 p-5">
    <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
      Flowers
    </p>

    <h3 className="mt-2 text-3xl font-black uppercase text-white">
      TROPICANA COOKIES CALISPAIN
    </h3>

     <p className="mt-3 text-zinc-400">
     Sativa: 70%
      < br/>
     Indica: 30%
      < br/>
      GUSTO: Cedro,Biscotti,Limone,Fiori tropicali
      < br/>
      EFFETTO: Sativa decisa ti lascia bello attivo e lucido stimolando la creativita
      < br/>
      mette molta voglia di socialita e una discreta fame chimica a fine sessione 
    </p>

    <div className="mt-6 flex items-start gap-4">

      {/* VIDEO A SINISTRA */}
      <video
        src="/products/flowers/tropicana1.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="w-1/4 aspect-square object-cover flex-shrink-0"
      />

      {/* FOTO A DESTRA */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
        {[2, 3, 4, 5, 6].map((numero) => (
          <img
            key={numero}
            src={`/products/flowers/tropicana${numero}.jpg`}
            alt={`Tropicana Cookies CaliSpain foto ${numero}`}
            className="w-full aspect-square object-cover"
          />
        ))}
      </div>
    </div>

    {/* QUANTITÀ */}
    <div className="mt-6">
      <p className="mb-3 font-bold uppercase text-white">
        Seleziona quantità
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { grammi: "5g", prezzo: 50 },
          { grammi: "10g", prezzo: 80 },
          { grammi: "25g", prezzo: 175 },
          { grammi: "50g", prezzo: 300 },
          { grammi: "100g", prezzo: 550 },
          { grammi: "500g", prezzo: 2500 },
          { grammi: "1k", prezzo: 4000 },
        ].map((opzione) => (
          <button
            key={opzione.grammi}
            type="button"
            onClick={() => {
              const id = `tropicana-${opzione.grammi}`;

              setCarrello((prev) => {
                const esistente = prev.find(
                  (item) => String(item.id) === id
                );

                if (esistente) {
                  return prev.map((item) =>
                    String(item.id) === id
                      ? {
                          ...item,
                          quantita: item.quantita + 1,
                        }
                      : item
                  );
                }

                return [
                  ...prev,
                  {
                    id: id as any,
                    nome: `Tropicana Cookies CaliSpain ${opzione.grammi}`,
                    prezzo: opzione.prezzo,
                    quantita: 1,
                  },
                ];
              });
            }}
            className="border border-yellow-400 bg-zinc-950 px-4 py-4 text-center"
          >
            <p className="text-xl font-black text-white">
              {opzione.grammi}
            </p>

            <p className="mt-3 text-xl font-black text-yellow-400">
              {opzione.prezzo} €
            </p>

            <p className="mt-2 text-xs font-black uppercase">
              Aggiungi al carrello
            </p>
          </button>
        ))}
      </div>
    </div>
  </div>
)}
{/* FLOWERS - LEMON GUMP */}
<div className="mt-8 border border-yellow-400/40 bg-black/80 p-5">

  <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
    Flowers
  </p>

  <h3 className="mt-2 text-3xl font-black uppercase text-white">
    LEMON GUMP
  </h3>

<p className="mt-3 text-zinc-400">
      Indica 50%
      < br/>
      Sativa 50%
      < br/>
      GUSTO: Lime,Agrumi,Pompelmo  
      < br/>
      EFFETTO: effetto bilanciato lievemente predominante la parte indica
      < br/>
      rispetto quanto indicato in scheda tecnica dai breeder
    </p>

  <div className="mt-6 flex items-start gap-4">

    {/* VIDEO A SINISTRA */}
    <video
      src="/products/flowers/lemgump1.MP4"
      autoPlay
      muted
      loop
      playsInline
      className="w-1/4 aspect-square object-cover flex-shrink-0"
    />

    {/* FOTO A DESTRA */}
    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
      {[2, 3, 4, 5].map((numero) => (
        <img
          key={numero}
          src={`/products/flowers/lemgump${numero}.jpg`}
          alt={`Lemon Gump foto ${numero}`}
          className="w-full aspect-square object-cover"
        />
      ))}
    </div>

  </div>

  {/* QUANTITÀ */}
  <div className="mt-6">
    <p className="mb-3 font-bold uppercase text-white">
      Seleziona quantità
    </p>

    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {[
        { grammi: "5g", prezzo: 30 },
        { grammi: "10g", prezzo: 60 },
        { grammi: "25g", prezzo: 160 },
        { grammi: "50g", prezzo: 260 },
        { grammi: "100g", prezzo: 440 },
        { grammi: "500g", prezzo: 1850 },
        { grammi: "1kg", prezzo: 3500 },
      ].map((opzione) => (
        <button
          key={opzione.grammi}
          type="button"
          onClick={() => {
            const id = `lemon-gump-${opzione.grammi}`;

            setCarrello((prev) => {
              const esistente = prev.find(
                (item) => String(item.id) === id
              );

              if (esistente) {
                return prev.map((item) =>
                  String(item.id) === id
                    ? {
                        ...item,
                        quantita: item.quantita + 1,
                      }
                    : item
                );
              }

              return [
                ...prev,
                {
                  id: id as any,
                  nome: `LEMON GUMP ${opzione.grammi}`,
                  prezzo: opzione.prezzo,
                  quantita: 1,
                },
              ];
            });
          }}
          className="border border-yellow-400 bg-zinc-950 px-4 py-4 text-center hover:bg-yellow-400"
        >
          <p className="text-xl font-black text-white">
            {opzione.grammi}
          </p>

          <p className="mt-3 text-xl font-black text-yellow-400">
            {opzione.prezzo} €
          </p>

          <p className="mt-2 text-xs font-black uppercase">
            Aggiungi al carrello
          </p>
        </button>
      ))}
    </div>
  </div>

</div>
  </div>
)}
{/* OTHER - DIESEL COLO */}
{categoriaAttiva === "Other" && (
  <div className="mt-8 border border-yellow-400/40 bg-black/80 p-5">

    <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
      Other
    </p>

    <h3 className="mt-2 text-3xl font-black uppercase text-white">
      DIESEL COLO
    </h3>

    <p className="mt-3 text-zinc-400">
      Lavaggio Kerosene, Brick da 1kg, colombiana classica ad impatto fisico 
      < br/>
      praticamente immediato No levamisolo No lido  
    </p>

    <div className="mt-6 flex items-start gap-4">

      {/* VIDEO A SINISTRA */}
      <video
        src="/products/other/diesel.MP4"
        autoPlay
        muted
        loop
        playsInline
        className="w-1/4 aspect-square object-cover flex-shrink-0"
      />

      {/* FOTO A DESTRA */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
        {[2, 3, 4, 5].map((numero) => (
          <img
            key={numero}
            src={`/products/other/diesel${numero}.jpg`}
            alt={`Diesel Colo foto ${numero}`}
            className="w-full aspect-square object-cover"
          />
        ))}

       
      </div>

    </div>

    {/* QUANTITA */}
    <div className="mt-6">

      <p className="mb-3 font-bold uppercase text-white">
        Seleziona quantità
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

        {[
          { grammi: "1g", prezzo: 70 },
          { grammi: "2g", prezzo: 130 },
          { grammi: "5g", prezzo: 240 },
          { grammi: "10g", prezzo: 400 },
        ].map((opzione) => (

          <button
            key={opzione.grammi}
            type="button"
            onClick={() => {
              const id = `diesel-colo-${opzione.grammi}`;

              setCarrello((prev) => {
                const esistente = prev.find(
                  (item) => String(item.id) === id
                );

                if (esistente) {
                  return prev.map((item) =>
                    String(item.id) === id
                      ? {
                          ...item,
                          quantita: item.quantita + 1,
                        }
                      : item
                  );
                }

                return [
                  ...prev,
                  {
                    id: id as any,
                    nome: `DIESEL COLO ${opzione.grammi}`,
                    prezzo: opzione.prezzo,
                    quantita: 1,
                  },
                ];
              });
            }}
            className="border border-yellow-400 bg-zinc-950 px-4 py-4 text-center hover:bg-yellow-400"
          >

            <p className="text-xl font-black text-white">
              {opzione.grammi}
            </p>

            <p className="mt-3 text-xl font-black text-yellow-400">
              {opzione.prezzo} €
            </p>

            <p className="mt-2 text-xs font-black uppercase">
              Aggiungi al carrello
            </p>

          </button>

        ))}

      </div>
    </div>

  </div>
)}

{/* OTHER - BOLIVIAN DOLLAR LOGO */}
{categoriaAttiva === "Other" && (
  <div className="mt-8 border border-yellow-400/40 bg-black/80 p-5">

    <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
      Other
    </p>

    <h3 className="mt-2 text-3xl font-black uppercase text-white">
      BOLIVIAN DOLLAR LOGO
    </h3>

    <p className="mt-3 text-zinc-400">
      Produzione artigianale a doppio lavaggio, Ship via aerea, poca disponibilità
    </p>

    <div className="mt-6 flex items-start gap-4">

      {/* VIDEO A SINISTRA */}
      <video
        src="/products/other/dollar1.MP4"
        autoPlay
        muted
        loop
        playsInline
        className="w-1/4 aspect-square object-cover flex-shrink-0"
      />

      {/* FOTO A DESTRA */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
        {[2, 3, 4, 5, 6, 7].map((numero) => (
          <img
            key={numero}
            src={`/products/other/dollar${numero}.jpg`}
            alt={`Bolivian Dollar Logo foto ${numero}`}
            className="w-full aspect-square object-cover"
          />
        ))}
      </div>

    </div>

    {/* QUANTITA */}
    <div className="mt-6">

      <p className="mb-3 font-bold uppercase text-white">
        Seleziona quantità
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">

        {[
          { grammi: "1G", prezzo: 60 },
          { grammi: "3G", prezzo: 150 },
          { grammi: "5G", prezzo: 220 },
          { grammi: "10G", prezzo: 400 },
          { grammi: "OFFERTA LANCIO 2 A 100€", prezzo: 100 },
        ].map((opzione) => (

          <button
            key={opzione.grammi}
            type="button"
            onClick={() => {

              const id = `bolivian-dollar-${opzione.grammi}`;

              setCarrello((prev) => {

                const esistente = prev.find(
                  (item) => String(item.id) === id
                );

                if (esistente) {
                  return prev.map((item) =>
                    String(item.id) === id
                      ? {
                          ...item,
                          quantita: item.quantita + 1,
                        }
                      : item
                  );
                }

                return [
                  ...prev,
                  {
                    id: id as any,
                    nome: `BOLIVIAN DOLLAR LOGO ${opzione.grammi}`,
                    prezzo: opzione.prezzo,
                    quantita: 1,
                  },
                ];
              });
            }}
            className="border border-yellow-400 bg-zinc-950 px-4 py-4 text-center hover:bg-yellow-400/10"
          >

            <p className="text-xl font-black text-white">
              {opzione.grammi}
            </p>

            <p className="mt-3 text-xl font-black text-yellow-400">
              {opzione.prezzo} €
            </p>

            <p className="mt-2 text-xs font-black uppercase">
              Aggiungi al carrello
            </p>

          </button>

        ))}

      </div>
    </div>

  </div>
)}
{categoriaAttiva === "Gadget" && (
        <article className="overflow-hidden border border-zinc-800 bg-zinc-950">
          <div className="grid md:grid-cols-2">
            <div className="p-4">
              <img
                src="/cover1.jpg"
                alt="Cover iPhone LaLinea UltraResistente"
                className="h-[600px] w-full object-contain bg-black"
              />

              <div className="mt-4 grid grid-cols-4 gap-3">
                <img
                  src="/cover1.jpg"
                  alt="Cover LaLinea foto 1"
                  className="h-28 w-full object-cover"
                />

                <img
                  src="/cover2.jpg"
                  alt="Cover LaLinea foto 2"
                  className="h-28 w-full object-cover"
                />

                <img
                  src="/cover3.jpg"
                  alt="Cover LaLinea foto 3"
                  className="h-28 w-full object-cover"
                />

                <img
                  src="/cover4.jpg"
                  alt="Cover LaLinea foto 4"
                  className="h-28 w-full object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center p-8 md:p-12">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
                LaLinea
              </p>

              <h3 className="mt-4 text-4xl font-black uppercase">
                Cover iPhone LaLinea UltraResistente
              </h3>

              <p className="mt-6 text-lg text-zinc-400">
                Cover iPhone LaLinea UltraResistente con adattatore MagSafe.
              </p>

              <p className="mt-2 text-zinc-400">
                Disponibile per tutti gli iPhone.
              </p>

              <div className="mt-8 border-t border-zinc-800 pt-8">
                <p className="text-4xl font-black text-yellow-400">
                  10 €
                </p>

                <p className="mt-2 text-xl font-bold text-white">
                  oppure 500 punti LaLinea
                </p>
              </div>

              <button
                onClick={aggiungiAlCarrello}
                className="mt-8 w-full bg-yellow-400 px-6 py-4 font-black uppercase tracking-widest text-black transition hover:bg-yellow-300"
              >
                Aggiungi al carrello
              </button>
            </div>
          </div>
        </article>
)}
        {/* CARRELLO */}
        <div className="mt-12 border border-yellow-400 bg-black p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black uppercase">
              Carrello
            </h3>

            <span className="rounded-full bg-yellow-400 px-4 py-2 font-black text-black">
              {carrello.reduce(
                (totale, item) => totale + item.quantita,
                0
              )}
            </span>
          </div>

          {carrello.length === 0 ? (
            <p className="mt-6 text-zinc-400">
              Il tuo carrello è vuoto.
            </p>
          ) : (
            <>
              <div className="mt-6 space-y-4">
                {carrello.map((item) => (
                  <div
                    key={item.id}
                    className="border border-zinc-800 p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-black uppercase">
                          {item.nome}
                        </p>

                        <p className="mt-1 text-yellow-400">
                          {item.prezzo} € cad.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            cambiaQuantita(item.id, -1)
                          }
                          className="h-10 w-10 border border-zinc-700 font-black hover:border-yellow-400"
                        >
                          −
                        </button>

                        <span className="min-w-8 text-center text-xl font-black">
                          {item.quantita}
                        </span>

                        <button
                          onClick={() =>
                            cambiaQuantita(item.id, 1)
                          }
                          className="h-10 w-10 border border-zinc-700 font-black hover:border-yellow-400"
                        >
                          +
                        </button>

                        <button
                          onClick={() =>
                            eliminaDalCarrello(item.id)
                          }
                          className="ml-3 text-sm font-bold uppercase text-red-400"
                        >
                          Elimina
                        </button>
                      </div>
                    </div>

                    <p className="mt-4 text-right text-xl font-black">
                      {item.prezzo * item.quantita} €
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-zinc-800 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold uppercase">
                    Totale
                  </span>

                  <span className="text-3xl font-black text-yellow-400">
                    {totaleCarrello} €
                  </span>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <button
                    onClick={() => setCarrello([])}
                    className="border border-zinc-700 px-5 py-4 font-black uppercase tracking-widest hover:border-yellow-400"
                  >
                    Svuota carrello
                  </button>

                  <button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    setCheckoutAperto(true);
  }}
  className="bg-yellow-400 px-5 py-4 font-black uppercase tracking-widest"
>
                    Checkout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* CHECKOUT */}
{checkoutAperto && carrello.length > 0 && (
  <div className="mt-8 border border-zinc-700 bg-zinc-950 p-6">
    <div className="flex items-center justify-between">
      <h3 className="text-3xl font-black uppercase">
        Checkout
      </h3>

      <button
        onClick={() => setCheckoutAperto(false)}
        className="font-black text-zinc-400 hover:text-white"
      >
        ✕
      </button>
    </div>

    <p className="mt-2 text-zinc-400">
      Inserisci i dati per completare l&apos;ordine.
    </p>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <input
        type="text"
        placeholder="Nome"
        value={datiCliente.nome}
onChange={(e) => setDatiCliente((prev) => ({ ...prev, nome: e.target.value }))}
        className="border border-zinc-700 bg-black p-4 text-white outline-none focus:border-yellow-400"
      />

      <input
        type="text"
        placeholder="Cognome"
        value={datiCliente.cognome}
onChange={(e) => setDatiCliente((prev) => ({ ...prev, cognome: e.target.value }))}
        className="border border-zinc-700 bg-black p-4 text-white outline-none focus:border-yellow-400"
      />

      <input
        type="email"
        placeholder="Email"
        value={datiCliente.email}
onChange={(e) => setDatiCliente((prev) => ({ ...prev, email: e.target.value }))}
        className="border border-zinc-700 bg-black p-4 text-white outline-none focus:border-yellow-400"
      />
      <div className="mt-6">
  <label className="block mb-3 text-sm font-bold uppercase">
    Modalità ordine
  </label>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <button
      type="button"
      onClick={() => setModalitaOrdine("delivery")}
      className={`border p-4 font-bold uppercase ${
        modalitaOrdine === "delivery"
          ? "bg-yellow-400 text-black border-yellow-400"
          : "bg-black text-white border-zinc-700"
      }`}
    >
      Delivery
    </button>

    <button
      type="button"
      onClick={() => setModalitaOrdine("point")}
      className={`border p-4 font-bold uppercase ${
        modalitaOrdine === "point"
          ? "bg-yellow-400 text-black border-yellow-400"
          : "bg-black text-white border-zinc-700"
      }`}
    >
      Ritiro al Point
    </button>

    <button
      type="button"
      onClick={() => setModalitaOrdine("spedizione")}
      className={`border p-4 font-bold uppercase ${
        modalitaOrdine === "spedizione"
          ? "bg-yellow-400 text-black border-yellow-400"
          : "bg-black text-white border-zinc-700"
      }`}
    >
      Spedizione
    </button>
  </div>
</div>

      <input
        type="tel"
        placeholder="Telefono"
        value={datiCliente.telefono}
onChange={(e) => setDatiCliente((prev) => ({ ...prev, telefono: e.target.value }))}
        className="border border-zinc-700 bg-black p-4 text-white outline-none focus:border-yellow-400"
      />
      <input
  type="text"
  placeholder="Indirizzo di consegna"  
  value={datiCliente.indirizzo}
onChange={(e) => setDatiCliente((prev) => ({ ...prev, indirizzo: e.target.value }))}
  className="border border-zinc-700 bg-black p-4 text-white outline-none focus:border-yellow-400 md:col-span-2"
/>
<div className="mt-6">
  <label className="block mb-2 text-sm font-bold uppercase">
    Orario di consegna
  </label>

  <input
    type="time"
    value={orarioConsegna}
    onChange={(e) => setOrarioConsegna(e.target.value)}
    className="w-full border border-zinc-700 bg-black p-4 text-white outline-none focus:border-yellow-400"
  />

  <p className="mt-2 text-sm text-zinc-400">
    Indica un orario tra le 13:00 e le 14:00 oppure tra le 19:00 e le 02:00.
  </p>
</div>
    </div>
    <div className="mt-6">
  <label className="block mb-2 text-sm font-bold uppercase">
    Codice sconto
  </label>

  <div className="flex gap-2">
    <input
      type="text"
      value={codiceSconto}
      onChange={(e) => setCodiceSconto(e.target.value)}
      placeholder="Inserisci codice sconto"
      className="w-full border border-zinc-700 bg-black p-4 text-white outline-none focus:border-yellow-400"
    />

    <button
      type="button"
      onClick={applicaCodiceSconto}
      className="bg-yellow-400 px-5 py-4 font-black uppercase text-black"
    >
      Applica
    </button>
  </div>

  {messaggioSconto && (
    <p
      className={`mt-2 text-sm font-bold ${
        scontoPercentuale > 0 ? "text-green-400" : "text-red-400"
      }`}
    >
      {messaggioSconto}
    </p>
  )}
</div>

    <div className="mt-6 border-t border-zinc-800 pt-6">
      <div className="flex items-center justify-between">
        <span className="font-bold uppercase">
          Totale ordine
        </span>

        <div className="text-right">
  <p className="text-sm text-zinc-400">
    Prodotti: {totaleCarrello} €
  </p>

  <p className="text-sm text-zinc-400">
    Consegna: {costoConsegna} €
  </p>

  <p className="mt-2 text-3xl font-black text-yellow-400">
    Totale: {totaleOrdine} €
  </p>
</div>
      </div>

      <button
  type="button"
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  inviaOrdineTelegram();
}}
  className="mt-6 w-full bg-yellow-400 px-6 py-4 font-black uppercase tracking-widest text-black"
>
  Conferma ordine
</button>
    </div>
  </div>
)}

</section>

{/* BRAND */}
      <section
        id="storia"
        className="border-y border-zinc-800 bg-zinc-950"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2">
          <div>
            <p className="font-bold uppercase tracking-[0.3em] text-yellow-400">
              Il progetto
            </p>

            <h2 className="mt-4 text-5xl font-black uppercase">
              Non seguire
              <br />
              la strada.
              <br />
              <span className="text-yellow-400">Crea la tua linea.</span>
            </h2>
          </div>

          <div className="flex items-center">
            <p className="max-w-xl text-lg leading-8 text-zinc-400">
              Il club piu antico sotto la Madonnina. dal 2016 La migliore selezione di prodotti e accessori per la nostra passione da tutto il mondo. Consegne sulla citta dalle 10 alle 2am con possibilita di passare in uno dei nostri point o di ricevere il pacco a casa. Scopri il mondo LaLinea e unisciti alla nostra community
            </p>
          </div>
        </div>
      </section>

{/* DICONO DI NOI */}
<section
  id="dicono-di-noi"
  className="border-y border-zinc-800 bg-zinc-950"
>
  <div className="mx-auto max-w-7xl px-6 py-24">

    <p className="font-bold uppercase tracking-[0.3em] text-yellow-400">
      Recensioni
    </p>

    <h2 className="mt-4 text-5xl font-black uppercase">
      Dicono di noi
    </h2>
    <button
  type="button"
  onClick={() => setRecensioniAperte(!recensioniAperte)}
  className="mt-6 border border-yellow-400 bg-black px-6 py-3 font-black uppercase text-white hover:text-yellow-400"
>
  {recensioniAperte ? "Chiudi recensioni" : "Mostra recensioni"}
</button>
{recensioniAperte && (
    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 23 }, (_, i) => (
        <img
          key={i}
          src={`/reviews/review${i + 1}.jpg`}
          alt={`Recensione ${i + 1}`}
          className="w-full rounded-lg border border-zinc-800 object-contain"
        />
      ))}
    </div>
)}
  </div>
</section>
{/* I NOSTRI POINT */}
      <section id="point" className="border-t border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="font-bold uppercase tracking-[0.3em] text-yellow-400">
            LALINEA MILANO
          </p>

          <h2 className="mt-3 text-5xl font-black uppercase">
            I NOSTRI POINT
          </h2>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
            Scegli il Point LaLinea più comodo per ritirare i tuoi prodotti a Milano.
          </p>

          <div className="mt-8 border border-yellow-400 bg-yellow-400/10 p-6">
            <p className="font-black uppercase tracking-wider text-yellow-400">
              IMPORTANTE
            </p>
            <p className="mt-2 text-white">
              È gradita la prenotazione almeno 30 minuti prima.
              Presentarsi singolarmente nei vari Point.
            </p>
          </div>

  
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">

  {/* POINT 01 */}
  <div className="flex flex-col justify-between border border-zinc-800 bg-black p-4 min-h-[220px]">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
        POINT 01
      </p>

      <h3 className="mt-3 text-2xl font-black uppercase">
        Piazzale Loreto
      </h3>

      <p className="mt-3 text-sm text-zinc-400">
        Tutti i giorni
      </p>

      <p className="mt-1 text-lg font-bold">
        19:00 - 02:00
      </p>
    </div>

    <a
      href="https://t.me/LaLineaMiOrdini"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 block bg-yellow-400 px-4 py-3 text-center text-sm font-black uppercase tracking-widest text-black"
    >
      PRENOTA IL RITIRO
    </a>
  </div>

  {/* POINT 02 */}
  <div className="flex flex-col justify-between border border-zinc-800 bg-black p-4 min-h-[220px]">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
        POINT 02
      </p>

      <h3 className="mt-3 text-2xl font-black uppercase">
        Piazzale Piemonte
      </h3>

      <p className="mt-3 text-sm text-zinc-400">
        Tutti i giorni
      </p>

      <p className="mt-1 text-lg font-bold">
        12:00 - 02:00
      </p>
    </div>

    <a
      href="https://t.me/LaLineaMiOrdini"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 block bg-yellow-400 px-4 py-3 text-center text-sm font-black uppercase tracking-widest text-black"
    >
      PRENOTA IL RITIRO
    </a>
  </div>

</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">

  {/* POINT 03 */}
  <div className="flex flex-col justify-between border border-zinc-800 bg-black p-4 min-h-[220px]">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
        POINT 03
      </p>

      <h3 className="mt-3 text-2xl font-black uppercase">
        Piazza Galeazzi Bruzzano
      </h3>

      <p className="mt-3 text-zinc-400">
        Tutti i giorni
      </p>

      <p className="mt-1 text-xl font-bold">
        10:00 — 20:00
      </p>
    </div>

    <a
      href="https://t.me/LaLineaMiOrdini"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-6 block bg-yellow-400 px-5 py-4 text-center font-black uppercase tracking-widest text-black"
    >
      PRENOTA IL RITIRO
    </a>
  </div>

  {/* POINT 04 */}
  <div className="flex flex-col justify-between border border-zinc-800 bg-black p-4 min-h-[220px]">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
        POINT 04
      </p>

      <h3 className="mt-3 text-2xl font-black uppercase">
        Piazza 24 Maggio
      </h3>

      <p className="mt-3 text-zinc-400">
        Tutti i giorni
      </p>

      <p className="mt-1 text-xl font-bold">
        10:00 — 20:00
      </p>
    </div>

    <a
      href="https://t.me/LaLineaMiOrdini"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-6 block bg-yellow-400 px-5 py-4 text-center font-black uppercase tracking-widest text-black"
    >
      PRENOTA IL RITIRO
    </a>
  </div>

</div>
<div className="flex flex-col justify-between border border-zinc-800 bg-black p-6">
  <div>
    <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
      POINT 05
    </p>

    <h3 className="mt-3 text-2xl font-black uppercase">
      Piazza Guardi
    </h3>

    <p className="mt-3 text-zinc-400">
      Tutti i giorni
    </p>

    <p className="mt-1 text-xl font-bold">
      18:00 — 02:00
    </p>
  </div>

  <a
    href="https://t.me/LaLineaMiOrdini"
    target="_blank"
    rel="noopener noreferrer"
    className="mt-6 block bg-yellow-400 px-5 py-4 text-center font-black uppercase tracking-widest text-black"
  >
    PRENOTA IL RITIRO
  </a>
</div>
          </div>
        
      </section>
      {/* CONTATTI */}
      <footer id="contatti" className="border-t border-zinc-800 bg-black">
        <div className="mx-auto max-w-7xl px-6 py-20">

          <p className="font-bold uppercase tracking-[0.3em] text-yellow-400">
            CONTATTI
          </p>

          <h2 className="mt-3 text-4xl font-black uppercase">
            PARLA CON LALINEA.
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-2">

            <div className="border border-zinc-800 bg-zinc-950 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
                INFORMAZIONI PRE E POST VENDITA
              </p>
              <a
                href="https://t.me/LaLineaInfoAssistenza"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-lg font-bold hover:text-yellow-400"
              >
                Telegram — @LaLineaInfoAssistenza
              </a>
            </div>

            <div className="border border-zinc-800 bg-zinc-950 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
                ORDINI
              </p>
              <a
                href="https://t.me/LaLineaMiOrdini"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-lg font-bold hover:text-yellow-400"
              >
                Telegram — @LaLineaMiOrdini
              </a>

              <a
                href="https://threema.id/H7JMTBM4"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-lg font-bold hover:text-yellow-400"
              >
                Threema — H7JMTBM4
              </a>
            </div>

            <div className="border border-zinc-800 bg-zinc-950 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
                FORNITORI / RIVENDITORI
              </p>
              <a
                href="https://t.me/LaLineaResellerPlug"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-lg font-bold hover:text-yellow-400"
              >
                Telegram — @LaLineaResellerPlug
              </a>
            </div>

            <div className="border border-zinc-800 bg-zinc-950 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
                SPEDIZIONI ITALIA / ESTERO
              </p>
              <p className="mt-3 text-lg font-bold">
                Pagamento all'arrivo
              </p>
            </div>

            <div className="border border-yellow-400 p-6 md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
                VUOI LAVORARE CON NOI?
              </p>
              <a
                href="mailto:igorg69@tutamail.com"
                className="mt-3 block text-xl font-black hover:text-yellow-400"
              >
                igorg69@tutamail.com
              </a>
            </div>

          </div>

          <div className="mt-12 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
            © LaLinea Milano — Since2016 - Il club piu antico sotto la Madonnina. Tutti i diritti riservati.
          </div>

        </div>
      </footer>
      {/* DELIVERY */}
<section
  id="delivery"
  className="border-t border-yellow-400/30 px-6 py-20"
>
  <div className="mx-auto max-w-7xl">
    <p className="font-bold uppercase tracking-[0.3em] text-yellow-400">
      Delivery
    </p>

    <h2 className="mt-3 text-4xl font-black uppercase">
      Zone di consegna
    </h2>

    <p className="mt-4 text-zinc-400">
      Consegna disponibile in tutta Milano. Costo consegna: 10 € in zona bianca 25€ in zona rossa
    </p>
<div className="mt-8 overflow-hidden border border-yellow-400/30">
  <img
    src="/mappa.jpg"
    alt="Mappa zone di consegna LaLinea"
    className="w-[70%] max-w-3xl mx-auto object-contain"
  />
</div>
{/* DESCRIZIONE ORARI DELIVERY */}
<div className="mt-6 border border-zinc-800 bg-zinc-950 p-5">
  <p className="text-[1.05rem] font-bold uppercase leading-relaxed text-yellow-400">
    LE CONSEGNE VENGONO EFFETTUATE TUTTI I GIORNI DALLE 13 ALLE 14
    <br />
    E DALLE 19 ALLE 2AM DAL LUNEDÌ AL SABATO. 
    LA DOMENICA DALLE
    18 ALLE DUE.
  </p>

  <p className="text-[1.05rem] font-bold uppercase leading-relaxed text-yellow-400">
    TUTTI GLI ORDINI VANNO EFFETTUATI COL CARRELLO.
    <br />
     IN CASO FOSSIMO
    FULL IL CARRELLO RIFIUTERÀ IN AUTOMATICO L&apos;ORDINE.
  </p>
</div>
    <div className="mt-8">
      <a
        href="https://t.me/+WWNiFZ_7VlZlZWY0"
target="_blank"
rel="noopener noreferrer"
        className="inline-block border border-yellow-400 bg-yellow-400 px-6 py-4 font-black uppercase tracking-widest text-black"
      >
        Orari e gruppi Telegram
      </a>
    </div>
  </div>
</section>

<div className="py-12 text-center">
  <button
    type="button"
    onClick={() => setSnakeAperto(true)}
    className="border-2 border-yellow-400 bg-black px-8 py-4 font-black uppercase text-yellow-400 hover:bg-yellow-400 hover:text-black"
  >
    GIOCA A SNAKE
  </button>
</div>

{snakeAperto && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4">
    <div className="relative max-h-[95vh] w-full max-w-lg overflow-y-auto border-2 border-yellow-400 bg-black p-6">
      <button
        type="button"
        onClick={() => setSnakeAperto(false)}
        className="absolute right-4 top-3 text-2xl font-black text-yellow-400"
      >
        ✕
      </button>

      <h2 className="mb-6 text-center text-2xl font-black uppercase text-yellow-400">
        LALINEA SNAKE
      </h2>

      <SnakeGame />
    </div>
  </div>
)}


</main>
);
}