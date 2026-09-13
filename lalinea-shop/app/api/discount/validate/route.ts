import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { codice } = await request.json();

    const codicePulito = String(codice || "").trim().toUpperCase();

    if (!codicePulito) {
      return NextResponse.json(
        { valido: false, error: "Inserisci un codice sconto" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: sconto, error } = await supabase
      .from("discount_codes")
      .select(
        "codice, tipo, valore, scadenza, max_utilizzi, utilizzi, attivo"
      )
      .eq("codice", codicePulito)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!sconto || !sconto.attivo) {
      return NextResponse.json(
        { valido: false, error: "Codice sconto non valido" },
        { status: 404 }
      );
    }

    if (sconto.scadenza) {
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);

      const scadenza = new Date(`${sconto.scadenza}T23:59:59`);

      if (scadenza < oggi) {
        return NextResponse.json(
          { valido: false, error: "Codice sconto scaduto" },
          { status: 400 }
        );
      }
    }

    if (
      sconto.max_utilizzi !== null &&
      sconto.utilizzi >= sconto.max_utilizzi
    ) {
      return NextResponse.json(
        { valido: false, error: "Codice sconto esaurito" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valido: true,
      tipo: sconto.tipo,
      valore: Number(sconto.valore),
      codice: sconto.codice,
    });
  } catch (errore) {
    return NextResponse.json(
      {
        valido: false,
        error:
          errore instanceof Error
            ? errore.message
            : "Errore durante la verifica del codice",
      },
      { status: 500 }
    );
  }
}