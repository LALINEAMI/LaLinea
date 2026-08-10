"use client";

import { useState } from "react";
const prodotti = [
  { id: 1, nome: "Coming Soon", categoria: "LaLinea", prezzo: "—" },
  { id: 2, nome: "Coming Soon", categoria: "LaLinea", prezzo: "—" },
  { id: 3, nome: "Coming Soon", categoria: "LaLinea", prezzo: "—" },
];

export default function Home() {const [carrello, setCarrello] = useState<
    { id: number; nome: string; prezzo: number; quantita: number }[]
  >([]);

  const [checkoutAperto, setCheckoutAperto] = useState(false);
const [datiCliente, setDatiCliente] = useState({
  nome: "",
  cognome: "",
  email: "",
  telefono: "",
});
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
const totaleOrdine = totaleCarrello + costoConsegna;
  const inviaOrdineTelegram = () => {
  const prodottiOrdine = carrello
    .map(
      (item) =>
        `${item.nome} x${item.quantita} - ${item.prezzo * item.quantita} €`
    )
    .join("\n");

  const messaggio = `
NUOVO ORDINE LALINEA

Nome: ${datiCliente.nome}
Cognome: ${datiCliente.cognome}
Email: ${datiCliente.email}
Telefono: ${datiCliente.telefono}

PRODOTTI:
${prodottiOrdine}

Prodotti: ${totaleCarrello} €
Consegna: ${costoConsegna} €
TOTALE ORDINE: ${totaleOrdine} €
  `;

  const testo = encodeURIComponent(messaggio);
  window.open(`https://t.me/LaLineaMiOrdini?text=${testo}`, "_blank");
};
    if (!accessoConsentito) {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-yellow-400 p-8 text-center">
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
    <main className="min-h-screen text-white">
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

    <a className="transition hover:text-yellow-400" href="#lalinea">
      LALINEA
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

  {/* MENU MOBILE */}
  {menuAperto && (
    <nav className="absolute right-0 top-full z-[100] mt-3 w-64 border border-yellow-400 bg-black p-4 md:hidden">
      <div className="flex flex-col gap-4 text-lg font-black uppercase tracking-widest">
        <a
          href="#shop"
          onClick={() => setMenuAperto(false)}
          className="border-b border-zinc-800 pb-3 hover:text-yellow-400"
        >
          SHOP
        </a>

        <a
          href="#lalinea"
          onClick={() => setMenuAperto(false)}
          className="border-b border-zinc-800 pb-3 hover:text-yellow-400"
        >
          LALINEA
        </a>

        <a
          href="#point"
          onClick={() => setMenuAperto(false)}
          className="border-b border-zinc-800 pb-3 hover:text-yellow-400"
        >
          I NOSTRI POINT
        </a>

        <a
          href="#delivery"
          onClick={() => setMenuAperto(false)}
          className="border-b border-zinc-800 pb-3 hover:text-yellow-400"
        >
          DELIVERY
        </a>

        <a
          href="#contatti"
          onClick={() => setMenuAperto(false)}
          className="hover:text-yellow-400"
        >
          CONTATTI
        </a>
      </div>
    </nav>
  )}
</div>
</div>
</header>

      {/* MARQUEE */}
      <section className="overflow-hidden bg-yellow-400 py-4 text-black">
        <div className="whitespace-nowrap text-center text-sm font-black tracking-[0.3em]">
          LALINEA • MILANO • STREET CULTURE • LALINEA • MILANO • STREET CULTURE •
        </div>
      </section>

     
{/* SHOP */}
      <section id="shop" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14">
          <p className="font-bold uppercase tracking-[0.3em] text-yellow-400">
            LaLinea Shop
          </p>

          <h2 className="mt-3 text-5xl font-black uppercase tracking-tight">
            Nuovo Drop
          </h2>

          <p className="mt-4 text-zinc-500">
            Prodotti LaLinea. Street culture, identità e stile.
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
        BY MARADONA SELECTION
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
  {/* SNOWHEADS 90u */}
<div className="mt-8 border border-yellow-400/40 bg-black/80 p-5">
  <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
    Premium Filtred
  </p>

  <h3 className="mt-2 text-3xl font-black uppercase text-white">
    SNOWHEADS 90u
  </h3>

  <p className="mt-1 font-bold uppercase text-zinc-400">
    NOTE DI BUCCIA DI LIMONE, GAS E MENTOLO
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


<div className="mb-8">
  <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">
    Categoria
  </p>
  <h2 className="mt-2 text-4xl font-black uppercase text-white">
    {categoriaAttiva}
  </h2>
</div>
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
      BY PABLITO FARM - BOLLE GLASSY
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

{/* FLOWERS - GORILLA GLUE 2 CALISPAIN */}
{categoriaAttiva === "Flowers" && (
  <div className="mt-8 border border-yellow-400/40 bg-black/80 p-5">

    <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
      Flowers
    </p>

    <h3 className="mt-2 text-3xl font-black uppercase text-white">
      #GORILLA GLUE 2 CALISPAIN
    </h3>

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
                    onClick={() => setCheckoutAperto(true)}
                    className="bg-yellow-400 px-5 py-4 font-black uppercase tracking-widest text-black"
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
        className="border border-zinc-700 bg-black p-4 text-white outline-none focus:border-yellow-400"
      />

      <input
        type="text"
        placeholder="Cognome"
        className="border border-zinc-700 bg-black p-4 text-white outline-none focus:border-yellow-400"
      />

      <input
        type="email"
        placeholder="Email"
        className="border border-zinc-700 bg-black p-4 text-white outline-none focus:border-yellow-400"
      />

      <input
        type="tel"
        placeholder="Telefono"
        className="border border-zinc-700 bg-black p-4 text-white outline-none focus:border-yellow-400"
      />
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
  onClick={inviaOrdineTelegram}
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
    <div className="mt-8">
      <a
        href="https://t.me/+UIRWbzgEJ8w4ZWI0"
target="_blank"
rel="noopener noreferrer"
        className="inline-block border border-yellow-400 bg-yellow-400 px-6 py-4 font-black uppercase tracking-widest text-black"
      >
        Orari e gruppi Telegram
      </a>
    </div>
  </div>
</section>
</main>
);
}