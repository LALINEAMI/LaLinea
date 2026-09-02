import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const dati = await request.json();

    const telefono = String(dati.telefono || "").trim();
    const pin = String(dati.pin || "").trim();
    const quantita = Number(dati.quantita);

    if (!telefono || !pin) {
      return NextResponse.json(
        { error: "Telefono e PIN VIP obbligatori" },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(quantita) ||
      quantita < 1 ||
      quantita > 10
    ) {
      return NextResponse.json(
        { error: "Quantità non valida" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: cliente, error: erroreCliente } =
      await supabase
        .from("vip_customers")
        .select("id, pin_hash, punti")
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

    const pinCorretto = await bcrypt.compare(
      pin,
      cliente.pin_hash
    );

    if (!pinCorretto) {
      return NextResponse.json(
        { error: "PIN VIP errato" },
        { status: 401 }
      );
    }

    const puntiAttuali = Number(cliente.punti ?? 0);
    const puntiRichiesti = 500 * quantita;

    if (puntiAttuali < puntiRichiesti) {
      return NextResponse.json(
        {
          error: `Punti insufficienti. Disponibili: ${puntiAttuali}, necessari: ${puntiRichiesti}`,
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
          error:
            "Il saldo punti è appena cambiato. Riprova.",
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