import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const dati = await request.json();

    if (
      !process.env.VIP_ADMIN_PASSWORD ||
      dati.password !== process.env.VIP_ADMIN_PASSWORD
    ) {
      return NextResponse.json(
        { error: "Password amministratore errata" },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();

    if (dati.azione === "crea_cliente") {
      const nome = String(dati.nome || "").trim();
      const telefono = String(dati.telefono || "").trim();
      const pin = String(dati.pin || "").trim();

      if (!nome || !telefono || !/^\d{4,8}$/.test(pin)) {
        return NextResponse.json(
          { error: "Inserisci nome, telefono e PIN da 4 a 8 cifre" },
          { status: 400 }
        );
      }

      const pinHash = await bcrypt.hash(pin, 12);

      const { data: cliente, error } = await supabase
        .from("vip_customers")
        .upsert(
          {
            nome,
            telefono,
            pin_hash: pinHash,
          },
          {
            onConflict: "telefono",
          }
        )
        .select("id, nome, telefono, punti")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        cliente,
      });
    }

    if (dati.azione === "conferma_ordine") {
  const telefono = String(dati.telefono || "").trim();
  const totaleProdotti = Number(dati.totaleProdotti);
  const costoConsegna = Number(dati.costoConsegna || 0);

  const { data: cliente, error: erroreCliente } = await supabase
    .from("vip_customers")
    .select("id")
    .eq("telefono", telefono)
    .single();

  if (erroreCliente || !cliente) {
    return NextResponse.json(
      { error: "Cliente VIP non trovato" },
      { status: 404 }
    );
  }

  const { data: ordinePending, error: erroreRicerca } = await supabase
    .from("vip_orders")
    .select("id")
    .eq("customer_id", cliente.id)
    .eq("stato", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (erroreRicerca) {
    throw new Error(erroreRicerca.message);
  }

  let orderId = ordinePending?.id;

  if (!orderId) {
    const { data: nuovoOrdine, error: erroreOrdine } = await supabase
      .from("vip_orders")
      .insert({
        customer_id: cliente.id,
        totale_prodotti: totaleProdotti,
        costo_consegna: costoConsegna,
        stato: "pending",
      })
      .select("id")
      .single();

    if (erroreOrdine || !nuovoOrdine) {
      throw new Error(
        erroreOrdine?.message || "Impossibile creare l’ordine"
      );
    }

    orderId = nuovoOrdine.id;
  }

  const { data: punti, error: errorePunti } = await supabase.rpc(
    "confirm_vip_order",
    {
      p_order_id: orderId,
    }
  );

  if (errorePunti) {
    throw new Error(errorePunti.message);
  }

  return NextResponse.json({
    success: true,
    puntiAccreditati: punti,
  });
}

if (dati.azione === "crea_codice_sconto") {
  const codice = String(dati.codice || "").trim().toUpperCase();
  const tipo = String(dati.tipo || "").trim();
  const valore = Number(dati.valore);
  const scadenza = dati.scadenza ? String(dati.scadenza) : null;
  const maxUtilizzi =
    dati.maxUtilizzi === null || dati.maxUtilizzi === undefined
      ? null
      : Number(dati.maxUtilizzi);

  if (!codice) {
    return NextResponse.json(
      { error: "Inserisci un codice sconto" },
      { status: 400 }
    );
  }

  if (tipo !== "percentuale" && tipo !== "fisso") {
    return NextResponse.json(
      { error: "Tipo di sconto non valido" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(valore) || valore <= 0) {
    return NextResponse.json(
      { error: "Valore dello sconto non valido" },
      { status: 400 }
    );
  }

  if (tipo === "percentuale" && valore > 100) {
    return NextResponse.json(
      { error: "La percentuale non può superare il 100%" },
      { status: 400 }
    );
  }

  if (
    maxUtilizzi !== null &&
    (!Number.isInteger(maxUtilizzi) || maxUtilizzi < 1)
  ) {
    return NextResponse.json(
      { error: "Numero massimo di utilizzi non valido" },
      { status: 400 }
    );
  }

  const { data: codiceCreato, error } = await supabase
    .from("discount_codes")
    .insert({
      codice,
      tipo,
      valore,
      scadenza,
      max_utilizzi: maxUtilizzi,
      utilizzi: 0,
      attivo: true,
    })
    .select(
      "id, codice, tipo, valore, scadenza, max_utilizzi, utilizzi, attivo"
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Questo codice sconto esiste già" },
        { status: 409 }
      );
    }

    throw new Error(error.message);
  }

  return NextResponse.json({
    success: true,
    codice: codiceCreato,
  });
}
    return NextResponse.json(
      { error: "Azione non riconosciuta" },
      { status: 400 }
    );
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