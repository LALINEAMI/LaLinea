const stati = {
  ultime: {
    testo: "ULTIME DISPONIBILITÀ",
    colori: "border-orange-400/80 bg-orange-700/75",
  },
  restock: {
    testo: "RESTOCK IN CORSO",
    colori: "border-blue-400/80 bg-blue-700/75",
  },
  terminato: {
    testo: "PRODOTTO TERMINATO",
    colori: "border-red-400/80 bg-red-700/75",
  },
};

type Props = {
  stato?: keyof typeof stati;
  esaurito?: boolean;
};

export default function BannerEsaurito({ stato, esaurito = false }: Props) {
  const attivo = stato ?? (esaurito ? "terminato" : undefined);
  if (!attivo) return null;

  const { testo, colori } = stati[attivo];

  return (
    <span
      className={`pointer-events-none mb-2 ml-auto block w-fit max-w-full rounded-md border px-2 py-1 text-[11px] font-extrabold leading-tight tracking-wide text-white ${colori}`}
    >
      {testo}
    </span>
  );
}