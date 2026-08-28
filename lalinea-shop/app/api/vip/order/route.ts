import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const dati = await request.json();

    const telefono = String(dati.telefono || "").trim();

const totalePulito = String(dati.totaleProdotti ?? "")
  .replace(",", ".")
  .replace(/[^\d.-]/g, "");

const consegnaPulita = String(dati.costoConsegna ?? "0")
  .replace(",", ".")
  .replace(/[^\d.-]/g, "");

const totaleProdotti = Number.parseFloat(totalePulito);
const costoConsegna = Number.parseFloat(consegnaPulita) || 0;

if (!telefono) {
  return NextResponse.json(
    { error: "Telefono mancante" },
    { status: 400 }
  );
}

if (!Number.isFinite(totaleProdotti) || totaleProdotti < 0) {
  return NextResponse.json(
    { error: "Totale prodotti non valido" },
    { status: 400 }
  );
}

    const supabase = getSupabaseAdmin();

    const { data: cliente, error: erroreCliente } = await supabase
      .from("vip_customers")
      .select("id, nome")
      .eq("telefono", telefono)
      .maybeSingle();

    if (erroreCliente) {
      throw new Error(erroreCliente.message);
    }

    if (!cliente) {
      return NextResponse.json({
        success: true,
        vip: false,
      });
    }

    const { data: ordine, error: erroreOrdine } = await supabase
      .from("vip_orders")
      .insert({
        customer_id: cliente.id,
        totale_prodotti: totaleProdotti,
        costo_consegna: costoConsegna,
        stato: "pending",
      })
      .select("id")
      .single();

    if (erroreOrdine || !ordine) {
      throw new Error(
        erroreOrdine?.message || "Impossibile salvare l’ordine VIP"
      );
    }

    return NextResponse.json({
      success: true,
      vip: true,
      cliente: cliente.nome,
      orderId: ordine.id,
    });
  } catch (errore) {
    return NextResponse.json(
      {
        error:
          errore instanceof Error ? errore.message : "Errore del server",
      },
      { status: 500 }
    );
  }
}