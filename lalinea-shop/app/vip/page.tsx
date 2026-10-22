"use client";

import { useState } from "react";

type Cliente = {
  nome: string;
  telefono: string;
  punti: number;
};

type Movimento = {
  id: string;
  punti: number;
  descrizione: string;
  created_at: string;
};

export default function VipPage() {
  const [telefono, setTelefono] = useState("");
  const [pin, setPin] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [movimenti, setMovimenti] = useState<Movimento[]>([]);
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);

  if (cliente) {
    return (
      <main className="min-h-screen bg-black px-4 py-24 text-white">
        <div className="mx-auto max-w-lg border border-yellow-400 bg-zinc-950 p-6">
          <p className="text-sm font-black uppercase tracking-widest text-yellow-400">
            Area VIP LaLinea
          </p>

          <h1 className="mt-3 text-3xl font-black uppercase">
            Ciao, {cliente.nome}
          </h1>
          {/* LALINEA_VIP_GAME_LINK_V1 */}
          <a href="/lalinea-game" style={{display:'block',marginTop:20,padding:'16px',border:'2px solid #ffdb35',borderRadius:12,color:'#ffdb35',fontWeight:900,textAlign:'center',textDecoration:'none'}}>🎮 GIOCA E GUADAGNA BUONI →</a>
          <p style={{fontSize:12,color:'#a9b5ad',marginTop:8}}>Accesso al gioco automatico su questo browser dopo il login VIP. I buoni in euro sono separati dai punti fedeltà.</p>

          <div className="my-8 bg-yellow-400 p-6 text-center text-black">
            <p className="font-black uppercase">Punti disponibili</p>
            <p className="mt-2 text-6xl font-black">{cliente.punti}</p>
          </div>

          {/* LALINEA_CLASSIFICA_VIP_LINK_V1 */}
          <a href="/classifica" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,margin:"0 0 28px",padding:"18px 20px",border:"1px solid #a5ff2b",borderRadius:16,color:"#a5ff2b",background:"#10170a",fontSize:13,fontWeight:800,textDecoration:"none"}}>🏆 Classifica LaLinea Games <span aria-hidden="true">↗</span></a>

          <h2 className="mb-4 text-xl font-black uppercase">
            Storico punti
          </h2>

          {movimenti.length === 0 ? (
            <p className="text-zinc-400">
              Non ci sono ancora movimenti.
            </p>
          ) : (
            <div className="space-y-3">
              {movimenti.map((movimento) => (
                <div
                  key={movimento.id}
                  className="flex justify-between border border-zinc-800 p-4"
                >
                  <div>
                    <p className="font-bold">{movimento.descrizione}</p>
                    <p className="text-xs text-zinc-400">
                      {new Date(movimento.created_at).toLocaleDateString(
                        "it-IT"
                      )}
                    </p>
                  </div>

                  <p className="text-xl font-black text-yellow-400">
                    +{movimento.punti}
                  </p>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              void fetch('/api/lalinea-game', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})}).catch(()=>{});
              setCliente(null);
              setMovimenti([]);
              setPin("");
            }}
            className="mt-8 w-full border border-white px-4 py-3 font-black uppercase"
          >
            Esci
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-24 text-white">
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

            setCliente(dati.cliente);
            setMovimenti(dati.movimenti || []);
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
          Area VIP
        </h1>

        <p className="mt-2 text-center text-zinc-400">
          Accedi per controllare i tuoi punti.
        </p>

        <input
          type="tel"
          placeholder="Numero di telefono"
          value={telefono}
          onChange={(evento) => setTelefono(evento.target.value)}
          required
          className="mt-8 w-full border border-zinc-700 bg-black px-4 py-3"
        />

        <input
          type="password"
          inputMode="numeric"
          placeholder="PIN personale"
          value={pin}
          onChange={(evento) => setPin(evento.target.value)}
          required
          className="mt-3 w-full border border-zinc-700 bg-black px-4 py-3"
        />

        {errore && (
          <p className="mt-4 bg-red-950 p-3 text-red-200">
            {errore}
          </p>
        )}

        <button
          type="submit"
          disabled={caricamento}
          className="mt-6 w-full bg-yellow-400 px-4 py-4 font-black uppercase text-black disabled:opacity-50"
        >
          {caricamento ? "Accesso..." : "Entra nell’area VIP"}
        </button>
      </form>
    </main>
  );
}