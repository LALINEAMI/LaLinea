const prodotti = [
  { id: 1, nome: "Coming Soon", categoria: "LaLinea", prezzo: "—" },
  { id: 2, nome: "Coming Soon", categoria: "LaLinea", prezzo: "—" },
  { id: 3, nome: "Coming Soon", categoria: "LaLinea", prezzo: "—" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-yellow-400/30 bg-black/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-3xl font-black italic tracking-tight">
              LaLinea
            </h1>
            <div className="mt-1 h-1 w-12 bg-yellow-400" />
          </div>

          <nav className="flex gap-5 text-xs font-bold tracking-widest sm:text-sm">
            <a className="transition hover:text-yellow-400" href="#shop">
              SHOP
            </a>
            <a className="transition hover:text-yellow-400" href="#storia">
              LALINEA
            </a>
            <a className="transition hover:text-yellow-400" href="#contatti">
              CONTATTI
            </a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute -right-40 top-10 h-96 w-96 rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-green-500/10 blur-3xl" />

        <div className="relative mx-auto grid min-h-[75vh] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">

          <div>
            <p className="mb-5 font-bold uppercase tracking-[0.35em] text-yellow-400">
              Milano • Street Culture
            </p>

            <h2 className="text-6xl font-black uppercase leading-[0.9] tracking-tighter sm:text-7xl lg:text-8xl">
              Segui
              <br />
              la tua
              <br />
              <span className="text-yellow-400">Linea.</span>
            </h2>

            <p className="mt-8 max-w-lg text-lg leading-8 text-zinc-400">
              Streetwear, identità e cultura urbana.
              Una linea che parte dalla strada e racconta chi la vive.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#shop"
                className="bg-yellow-400 px-8 py-4 font-black text-black transition hover:bg-yellow-300"
              >
                SCOPRI IL DROP →
              </a>

              <a
                href="#storia"
                className="border border-zinc-700 px-8 py-4 font-bold transition hover:border-white"
              >
                LA NOSTRA STORIA
              </a>
            </div>
          </div>

          {/* SPAZIO LOGO */}
          <div className="flex items-center justify-center">
  <img
  src="/logo.jpg"
  alt="LaLinea"
  className="w-full max-w-lg object-contain"
/>
</div>
</div>
      </section>

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
            I prodotti della nuova collezione stanno arrivando.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {prodotti.map((prodotto) => (
            <article
              key={prodotto.id}
              className="group border border-zinc-800 bg-zinc-950 p-4 transition hover:border-yellow-400"
            >
              <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-zinc-900">
                <div className="absolute left-4 top-4 bg-yellow-400 px-3 py-2 text-xs font-black text-black">
                  COMING SOON
                </div>

                <span className="text-center text-sm font-bold tracking-[0.25em] text-zinc-600">
                  FOTO PRODOTTO
                  <br />
                  IN ARRIVO
                </span>
              </div>

              <div className="px-2 pb-3 pt-6">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
                  {prodotto.categoria}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <h3 className="text-xl font-black uppercase">
                    {prodotto.nome}
                  </h3>

                  <span className="text-zinc-500">{prodotto.prezzo}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
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
              LaLinea nasce dalla cultura urbana e dalla volontà di trasformare
              un&apos;identità in qualcosa da indossare. Milano, strada,
              persone e storie diventano parte di ogni collezione.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contatti" className="bg-black">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col justify-between gap-10 sm:flex-row">
            <div></div>
            </div>
  </div>
</footer>
</main>
);
}