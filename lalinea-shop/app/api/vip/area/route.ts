import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { readVipAreaDetails } from '../../../../lib/lalineaVipArea';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff' } });
export async function POST(request: Request) {
  try {
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin) return reply({ error: 'Origine non valida' }, 403);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({ error: 'Formato non valido' }, 400);
    const raw = await request.text();
    if (raw.length > 2000) return reply({ error: 'Richiesta non valida' }, 400);
    let dati; try { dati = JSON.parse(raw); } catch { return reply({ error: 'Richiesta non valida' }, 400); }
    if (!dati || typeof dati.telefono !== 'string' || typeof dati.pin !== 'string') return reply({ error: 'Accedi di nuovo all’area VIP' }, 401);
    const telefono = dati.telefono.trim(), pin = dati.pin.trim(), pagina = dati.pagina ?? 0;
    if (!telefono || telefono.length > 150 || !pin || pin.length > 128 || !Number.isSafeInteger(pagina) || pagina < 0 || pagina > 10000) return reply({ error: 'Dati non validi' }, 400);
    const supabase = getSupabaseAdmin();
    const { data: cliente, error: erroreCliente } = await supabase.from('vip_customers').select('id, nome, telefono, punti, pin_hash').eq('telefono', telefono).maybeSingle();
    if (erroreCliente) return reply({ error: 'Accesso VIP temporaneamente non disponibile' }, 503);
    if (!cliente || typeof cliente.pin_hash !== 'string' || !await bcrypt.compare(pin, cliente.pin_hash)) return reply({ error: 'Telefono o PIN errati. Accedi di nuovo all’area VIP.' }, 401);
    // The verified database ID is the only authority. Client-supplied IDs are ignored.
    const [ordini, movimenti] = await Promise.all([
      supabase.from('vip_orders').select('id, created_at, totale_prodotti, costo_consegna, stato').eq('customer_id', cliente.id).order('created_at', { ascending: false }).order('id', { ascending: false }).range(pagina * 20, pagina * 20 + 20),
      supabase.from('vip_points_transactions').select('id, punti, descrizione, created_at').eq('customer_id', cliente.id).order('created_at', { ascending: false })
    ]);
    if (ordini.error || movimenti.error) return reply({ error: 'Storico momentaneamente non disponibile. Riprova.' }, 503);
    const elenco = ordini.data || [];
    const dettagli = await readVipAreaDetails(cliente, elenco.slice(0, 20));
    return reply({ cliente: { nome: cliente.nome, telefono: cliente.telefono, punti: cliente.punti }, movimenti: movimenti.data || [], ...dettagli, pagina, altriOrdini: elenco.length > 20, aggiornatoIl: new Date().toISOString() });
  } catch { return reply({ error: 'Area VIP momentaneamente non disponibile. Riprova.' }, 503); }
}
