"use client";

import { useState } from "react";

export type Cliente = {
  nome: string;
  telefono: string;
  punti: number;
};

export type Movimento = {
  id: string;
  punti: number;
  descrizione: string;
  created_at: string;
};

type Props = {
  telefonoIniziale?: string;
  calendario?: boolean;
  onAccesso: (dati: { cliente: Cliente; movimenti?: Movimento[] }, telefono: string, pin: string) => void;
};

export default function AccessoVip({ telefonoIniziale = "", calendario = false, onAccesso }: Props) {
  const [telefono, setTelefono] = useState(telefonoIniziale);
  const [pin, setPin] = useState("");
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);

  return (
    <form
      className="w-full max-w-md border border-yellow-400 bg-zinc-950 p-6"
      onSubmit={async (evento) => {
        evento.preventDefault();
        setErrore("");
        setCaricamento(true);

        try {
          const risposta = await fetch("/api/vip/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              telefono,
              pin,
            }),
          });

          const dati = await risposta.json();

          if (!risposta.ok) {
            throw new Error(dati.error || "Accesso non riuscito");
          }

          onAccesso(dati, telefono, pin);
        } catch (errore) {
          setErrore(
            errore instanceof Error
              ? errore.message
              : "Errore durante l’accesso"
          );
        } finally {
          setCaricamento(false);
        }
      }}
    >
      <p className="text-center text-sm font-black uppercase tracking-widest text-yellow-400">
        LaLinea
      </p>

      <h1 className="mt-3 text-center text-3xl font-black uppercase">
        {calendario ? "Calendario dell’Avvento" : "Area VIP"}
      </h1>

      <p className="mt-2 text-center text-zinc-400">
        {calendario ? "Accedi con il tuo numero e il PIN VIP per vedere le caselle." : "Accedi per controllare i tuoi punti."}
      </p>

      <input
        type="tel"
        aria-label="Numero di telefono"
        placeholder="Numero di telefono"
        value={telefono}
        onChange={(evento) => setTelefono(evento.target.value)}
        required
        className="mt-8 w-full border border-zinc-700 bg-black px-4 py-3"
      />

      <input
        type="password"
        inputMode="numeric"
        aria-label="PIN personale"
        placeholder="PIN personale"
        value={pin}
        onChange={(evento) => setPin(evento.target.value)}
        required
        className="mt-3 w-full border border-zinc-700 bg-black px-4 py-3"
      />

      {errore && (
        <p role="alert" className="mt-4 bg-red-950 p-3 text-red-200">
          {errore}
        </p>
      )}

      <button
        type="submit"
        disabled={caricamento}
        className="mt-6 w-full bg-yellow-400 px-4 py-4 font-black uppercase text-black disabled:opacity-50"
      >
        {caricamento ? "Accesso..." : calendario ? "Apri il calendario" : "Entra nell’area VIP"}
      </button>
    </form>
  );
}
