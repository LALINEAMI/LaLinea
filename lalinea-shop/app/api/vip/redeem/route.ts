import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const costiPremi: Record<string, number> = {
  "10001": 200,
  "10003": 300,
  "300060": 1000,
  "300120": 2500,
  "300275": 5500,
  "300550": 10000,
  "301200": 20000,
};

export async function POST(request: Request) {
  try {
    const dati = await request.json();

    const telefono = String(dati.telefono || "").trim();
    const pin = String(dati.pin || "").trim();
    const premi = Array.isArray(dati.premi) ? dati.premi : [];

    if (!telefono || !pin) {
      return NextResponse.json(
        { error: "Telefono e PIN VIP obbligatori" },
        { status: 400 }
      );
    }

    if (premi.length === 0) {
      return NextResponse.json(
        { error: "Nessun premio selezionato" },
        { status: 400 }
      );
    }

    let puntiRichiesti = 0;

    for (const premio of premi) {
      const id = String(premio.id);
      const quantita = Number(premio.quantita);
      const costoUnitario = costiPremi[id];

      if (
        !costoUnitario ||
        !Number.isInteger(quantita) ||
        quantita < 1 ||
        quantita > 10
      ) {
        return NextResponse.json(
          { error: "Premio o quantità non validi" },
          { status: 400 }
        );
      }

      puntiRichiesti += costoUnitario * quantita;
    }

    const supabase = getSupabaseAdmin();

    const { data: cliente, error: erroreCliente } = await supabase
      .from("vip_customers")
      .select("id, punti, pin_hash")
      .eq("telefono", telefono)
      .maybeSingle();

    if (erroreCliente) {
      throw new Error(erroreCliente.message);
    }

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente VIP non trovato" },
        { status: 404 }
      );
    }

    const pinCorretto = await bcrypt.compare(pin, cliente.pin_hash);

    if (!pinCorretto) {
      return NextResponse.json(
        { error: "PIN VIP errato" },
        { status: 401 }
      );
    }

    const puntiAttuali = Number(cliente.punti ?? 0);

    if (puntiAttuali < puntiRichiesti) {
      return NextResponse.json(
        {
          error: `Punti insufficienti. Disponibili ${puntiAttuali}, necessari ${puntiRichiesti}`,
        },
        { status: 400 }
      );
    }

    const nuoviPunti = puntiAttuali - puntiRichiesti;

    const {
      data: clienteAggiornato,
      error: erroreAggiornamento,
    } = await supabase
      .from("vip_customers")
      .update({ punti: nuoviPunti })
      .eq("id", cliente.id)
      .eq("punti", puntiAttuali)
      .select("punti")
      .maybeSingle();

    if (erroreAggiornamento) {
      throw new Error(erroreAggiornamento.message);
    }

    if (!clienteAggiornato) {
      return NextResponse.json(
        {
          error: "Il saldo punti è appena cambiato. Riprova.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      puntiUtilizzati: puntiRichiesti,
      puntiResidui: clienteAggiornato.punti,
    });
  } catch (errore) {
    return NextResponse.json(
      {
        error:
          errore instanceof Error
            ? errore.message
            : "Errore del server",
      },
      { status: 500 }
    );
  }
}