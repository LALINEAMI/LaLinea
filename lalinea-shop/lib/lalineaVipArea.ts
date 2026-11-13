import qrcode from './vendor/lalinea-qrcode';
import type { VipOrdine } from './lalineaVipTypes';
const PROFILE_URL = 'https://lalinea-clienti-link.jonathan-codispoti42.chatgpt.site/api/vip-portal/profile';
type RigaOrdine = { id: string; created_at: string; totale_prodotti: unknown; costo_consegna: unknown; stato: string };
type Proiezione = { id: string; status: 'received' | 'preparing' | 'out_for_delivery' | 'delivered'; products: string | null; deliveryDay: string | null; slot: string | null };
const amount = (value: unknown) => value === null || value === undefined || !Number.isFinite(Number(value)) ? null : Number(value);
export async function readVipAreaDetails(cliente: { id: string; telefono: string }, righe: RigaOrdine[]) {
  let statoDisponibile = false;
  let dettagli: Proiezione[] = [];
  let tessera: { svg: string } | null = null;
  let avviso: string | null = null;
  const key = process.env.LALINEA_VIP_PORTAL_KEY;
  if (!key || !/^[a-f0-9]{64}$/.test(key)) {
    avviso = 'Il collegamento agli stati di consegna e alla tessera QR deve essere completato. Gli ordini registrati sono visibili qui sotto.';
  } else {
    try {
      const response = await fetch(PROFILE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify({ customerId: cliente.id, phone: cliente.telefono, orderIds: righe.map(r => r.id) }), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Collegamento non disponibile');
      const result = await response.json();
      if (result.protocol !== 1 || result.customerId !== cliente.id || !Array.isArray(result.orders) || result.orders.length !== righe.length || result.orders.some((o: Proiezione) => !righe.some(r => r.id === o.id) || !['received','preparing','out_for_delivery','delivered'].includes(o.status)) || new Set(result.orders.map((o: Proiezione) => o.id)).size !== righe.length || typeof result.cardUrl !== 'string' || !/^https:\/\/t\.me\/MilanoLaLineabot\?start=vipcard_[a-f0-9]{32}$/.test(result.cardUrl)) throw new Error('Risposta da verificare');
      dettagli = result.orders;
      statoDisponibile = true;
      const qr = qrcode(0, 'M'); qr.addData(result.cardUrl); qr.make();
      tessera = { svg: 'data:image/svg+xml;base64,' + Buffer.from(qr.createSvgTag({ cellSize: 4, margin: 16, scalable: true })).toString('base64') };
    } catch {
      avviso = 'Stati di consegna e tessera QR momentaneamente non disponibili. Premi Aggiorna per riprovare.';
    }
  }
  const ordini: VipOrdine[] = righe.map(r => {
    const d = dettagli.find(x => x.id === r.id);
    return { id: r.id, creatoIl: r.created_at, importoProdotti: amount(r.totale_prodotti), costoConsegna: amount(r.costo_consegna), stato: ['cancelled','canceled','annullato'].includes(r.stato.toLowerCase()) ? 'cancelled' : statoDisponibile && d ? d.status : 'unknown', prodotti: typeof d?.products === 'string' ? d.products : null, giornoConsegna: typeof d?.deliveryDay === 'string' ? d.deliveryDay : null, orario: typeof d?.slot === 'string' ? d.slot : null };
  });
  return { ordini, tessera, avviso };
}
