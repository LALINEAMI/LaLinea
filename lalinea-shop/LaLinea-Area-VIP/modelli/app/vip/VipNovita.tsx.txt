'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { VipArea, VipCliente, VipMovimento, VipOrdine } from '../../lib/lalineaVipTypes';
const stati: Record<VipOrdine['stato'], string> = { received: 'Ricevuto', preparing: 'In preparazione', out_for_delivery: 'In consegna', delivered: 'Consegnato', cancelled: 'Annullato', unknown: 'Stato consegna da verificare' };
const euro = (n: number | null) => n === null ? 'Non indicato' : new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
export default function VipNovita({ telefono, pin, onAggiornamento }: { telefono: string; pin: string; onAggiornamento: (data: { cliente: VipCliente; movimenti: VipMovimento[] }) => void }) {
  const [area, setArea] = useState<VipArea | null>(null), [pagina, setPagina] = useState(0), [caricamento, setCaricamento] = useState(false), [errore, setErrore] = useState('');
  const callback = useRef(onAggiornamento), attivo = useRef(false), controllo = useRef<AbortController | null>(null), occupato = useRef(false);
  useEffect(() => { callback.current = onAggiornamento; }, [onAggiornamento]);
  const aggiorna = useCallback(async () => {
    if (occupato.current || !attivo.current) return;
    occupato.current = true; const controller = new AbortController(); controllo.current = controller; setCaricamento(true); setErrore('');
    try {
      const risposta = await fetch('/api/vip/area', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ telefono, pin, pagina }), cache: 'no-store', signal: controller.signal });
      const dati = await risposta.json();
      if (controller.signal.aborted || !attivo.current) return;
      if (!risposta.ok) throw new Error(dati.error || 'Aggiornamento non riuscito');
      if (!dati.cliente || !Array.isArray(dati.ordini) || !Array.isArray(dati.movimenti) || dati.pagina !== pagina) throw new Error('Risposta da verificare. Riprova.');
      setArea(dati); callback.current({ cliente: dati.cliente, movimenti: dati.movimenti });
    } catch (e) { if (!controller.signal.aborted && attivo.current) setErrore(e instanceof Error ? e.message : 'Aggiornamento non riuscito'); }
    finally { if (controllo.current === controller) { occupato.current = false; if (attivo.current) setCaricamento(false); } }
  }, [telefono, pin, pagina]);
  useEffect(() => {
    attivo.current = true; void aggiorna();
    const intervallo = window.setInterval(() => { if (document.visibilityState === 'visible') void aggiorna(); }, 60000);
    return () => { attivo.current = false; controllo.current?.abort(); occupato.current = false; window.clearInterval(intervallo); };
  }, [aggiorna]);
  return <section className="mb-8 space-y-5" aria-label="Tessera e ordini VIP">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black uppercase text-yellow-400">La tua area VIP</h2><button type="button" disabled={caricamento} onClick={() => void aggiorna()} className="rounded-xl border border-yellow-400 px-4 py-2 font-bold text-yellow-300 disabled:opacity-50">{caricamento ? 'Aggiornamento…' : 'Aggiorna'}</button></div>
    {errore && <p role="alert" className="rounded-xl border border-red-700 bg-red-950 p-4 text-sm text-red-100">{errore}</p>}
    {area?.avviso && <p role="status" className="rounded-xl border border-zinc-700 p-4 text-sm text-zinc-300">{area.avviso}</p>}
    {!area && !errore && <p role="status" className="text-sm text-zinc-400">Caricamento tessera e storico ordini…</p>}
    {area?.tessera && <div className="rounded-2xl border border-yellow-400 bg-black p-5 text-center"><p className="text-xs font-black uppercase tracking-widest text-yellow-400">LaLinea · Tessera VIP personale</p><h3 className="mt-2 break-words text-2xl font-black">{area.cliente.nome}</h3><p className="mt-2 text-yellow-300">{area.cliente.punti.toLocaleString('it-IT')} punti disponibili</p><img src={area.tessera.svg} alt="QR personale per i dipendenti LaLinea" width={208} height={208} className="mx-auto my-5 rounded-xl bg-white p-2" /><a href={area.tessera.svg} download="LaLinea-Tessera-VIP.svg" className="inline-block rounded-xl border border-yellow-400 px-4 py-2 font-bold text-yellow-300">Scarica QR</a><p className="mt-3 text-xs text-zinc-400">Mostra il QR al dipendente: leggerà il saldo aggiornato dal bot. Il QR non contiene il tuo PIN.</p></div>}
    {area && <div><h3 className="mb-3 text-lg font-black uppercase">I tuoi ordini</h3>{area.ordini.length === 0 ? <p className="text-sm text-zinc-400">{pagina ? 'Nessun altro ordine in questa pagina.' : 'Non risultano ancora ordini nel tuo registro VIP.'}</p> : <div className="space-y-3">{area.ordini.map(o => <article key={o.id} className="rounded-2xl border border-zinc-700 bg-black p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-bold">Ordine {o.id.slice(0,8)}</h4><span className={'rounded-full border px-3 py-1 text-xs font-black '+(o.stato === 'delivered' ? 'border-green-400 text-green-300' : o.stato === 'cancelled' ? 'border-red-400 text-red-300' : 'border-yellow-400 text-yellow-300')}>{stati[o.stato]}</span></div><p className="mt-2 text-xs text-zinc-400">{new Date(o.creatoIl).toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'short', timeStyle: 'short' })}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm">{o.prodotti || 'I dettagli dei prodotti non sono ancora collegati a questo ordine.'}</p><div className="mt-3 space-y-1 text-sm"><p>Prodotti: <strong>{euro(o.importoProdotti)}</strong> · Consegna: {euro(o.costoConsegna)}</p>{o.giornoConsegna && <p>Giorno: {o.giornoConsegna.split('-').reverse().join('/')}</p>}<p>Orario: {o.orario || 'Non ancora indicato'}</p></div></article>)}</div>}<div className="mt-4 flex items-center justify-between gap-2"><button type="button" disabled={pagina === 0 || caricamento} onClick={() => { setArea(null); setPagina(p => Math.max(0,p-1)); }} className="rounded-xl border border-zinc-600 px-3 py-2 text-sm disabled:opacity-40">← Precedenti</button><span className="text-xs text-zinc-400">Pagina {pagina+1}</span><button type="button" disabled={!area.altriOrdini || caricamento} onClick={() => { setArea(null); setPagina(p => p+1); }} className="rounded-xl border border-zinc-600 px-3 py-2 text-sm disabled:opacity-40">Successivi →</button></div><p className="mt-3 text-xs text-zinc-500">Aggiornato alle {new Date(area.aggiornatoIl).toLocaleTimeString('it-IT',{timeZone:'Europe/Rome'})}. Lo storico mostra gli ordini già associati al tuo profilo VIP.</p></div>}
  </section>;
}
