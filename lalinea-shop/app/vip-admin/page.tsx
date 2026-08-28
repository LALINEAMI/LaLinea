"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export default function VipAdminPage() {
  const [password, setPassword] = useState("");

  const [nome, setNome] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [pin, setPin] = useState("");

  const [telefonoOrdine, setTelefonoOrdine] = useState("");
  const [totaleProdotti, setTotaleProdotti] = useState("");
  const [costoConsegna, setCostoConsegna] = useState("0");

  const [messaggio, setMessaggio] = useState("");
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);

  const inviaRichiesta = async (
    azione: string,
    dati: Record<string, unknown>
  ) => {
    setErrore("");
    setMessaggio("");
    setCaricamento(true);

    try {
      const risposta = await fetch("/api/vip/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          azione,
          ...dati,
        }),
      });

      const risultato = await risposta.json();

      if (!risposta.ok) {
        throw new Error(risultato.error || "Operazione non riuscita");
      }

      return risultato;
    } finally {
      setCaricamento(false);
    }
  };

  const creaCliente = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    try {
      const risultato = await inviaRichiesta("crea_cliente", {
        nome,
        telefono: telefonoCliente,
        pin,
      });

      setMessaggio(
        `Cliente VIP creato: ${risultato.cliente.nome}`
      );
      setNome("");
      setTelefonoCliente("");
      setPin("");
    } catch (errore) {
      setErrore(
        errore instanceof Error ? errore.message : "Errore del server"
      );
    }
  };

  const confermaOrdine = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    try {
      const risultato = await inviaRichiesta("conferma_ordine", {
        telefono: telefonoOrdine,
        totaleProdotti: Number(totaleProdotti),
        costoConsegna: Number(costoConsegna),
      });

      setMessaggio(
        `Ordine confermato: ${risultato.puntiAccreditati} punti accreditati`
      );
      setTelefonoOrdine("");
      setTotaleProdotti("");
      setCostoConsegna("0");
    } catch (errore) {
      setErrore(
        errore instanceof Error ? errore.message : "Errore del server"
      );
    }
  };

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <a
          href="/"
          className="mb-6 inline-block bg-yellow-400 px-4 py-3 text-xs font-black uppercase text-black"
        >
          ← Torna al negozio
        </a>

        <h1 className="text-3xl font-black uppercase text-yellow-400">
          Gestione VIP
        </h1>

        <label className="mt-8 block text-sm font-bold uppercase">
          Password amministratore
        </label>

        <input
          type="password"
          value={password}
          onChange={(evento) => setPassword(evento.target.value)}
          className="mt-2 w-full border border-zinc-700 bg-zinc-950 px-4 py-3"
        />

        {messaggio && (
          <p className="mt-5 bg-green-950 p-4 text-green-200">
            {messaggio}
          </p>
        )}

        {errore && (
          <p className="mt-5 bg-red-950 p-4 text-red-200">
            {errore}
          </p>
        )}

        <form
          onSubmit={creaCliente}
          className="mt-8 border border-yellow-400 bg-zinc-950 p-5"
        >
          <h2 className="text-xl font-black uppercase">
            Crea cliente VIP
          </h2>

          <input
            type="text"
            placeholder="Nome cliente"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            required
            className="mt-5 w-full border border-zinc-700 bg-black px-4 py-3"
          />

          <input
            type="tel"
            placeholder="Numero di telefono"
            value={telefonoCliente}
            onChange={(evento) => setTelefonoCliente(evento.target.value)}
            required
            className="mt-3 w-full border border-zinc-700 bg-black px-4 py-3"
          />

          <input
            type="password"
            inputMode="numeric"
            placeholder="PIN da 4 a 8 cifre"
            value={pin}
            onChange={(evento) => setPin(evento.target.value)}
            required
            className="mt-3 w-full border border-zinc-700 bg-black px-4 py-3"
          />

          <button
            type="submit"
            disabled={caricamento || !password}
            className="mt-5 w-full bg-yellow-400 px-4 py-4 font-black uppercase text-black disabled:opacity-50"
          >
            Crea cliente VIP
          </button>
        </form>

        <form
          onSubmit={confermaOrdine}
          className="mt-8 border border-yellow-400 bg-zinc-950 p-5"
        >
          <h2 className="text-xl font-black uppercase">
            Conferma ordine VIP
          </h2>

          <input
            type="tel"
            placeholder="Telefono cliente VIP"
            value={telefonoOrdine}
            onChange={(evento) => setTelefonoOrdine(evento.target.value)}
            required
            className="mt-5 w-full border border-zinc-700 bg-black px-4 py-3"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Totale prodotti"
            value={totaleProdotti}
            onChange={(evento) => setTotaleProdotti(evento.target.value)}
            required
            className="mt-3 w-full border border-zinc-700 bg-black px-4 py-3"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Costo consegna"
            value={costoConsegna}
            onChange={(evento) => setCostoConsegna(evento.target.value)}
            className="mt-3 w-full border border-zinc-700 bg-black px-4 py-3"
          />

          <button
            type="submit"
            disabled={caricamento || !password}
            className="mt-5 w-full bg-yellow-400 px-4 py-4 font-black uppercase text-black disabled:opacity-50"
          >
            Conferma e accredita punti
          </button>
        </form>
      </div>
    </main>
  );
}6