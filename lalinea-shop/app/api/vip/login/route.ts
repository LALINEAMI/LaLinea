import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { telefono, pin } = await request.json();

    const numeroTelefono = String(telefono || "").trim();
    const pinInserito = String(pin || "").trim();

    if (!numeroTelefono || !pinInserito) {
      return NextResponse.json(
        { error: "Inserisci telefono e PIN" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: cliente, error } = await supabase
      .from("vip_customers")
      .select("id, nome, telefono, punti, pin_hash")
      .eq("telefono", numeroTelefono)
      .single();

    if (error) {
  return NextResponse.json(
    { error: `SUPABASE: ${error.message}` },
    { status: 500 }
  );
}

if (!cliente) {
  return NextResponse.json(
    { error: "Cliente non trovato nel database collegato a Vercel" },
    { status: 404 }
  );
}

    const pinCorretto = await bcrypt.compare(
      pinInserito,
      cliente.pin_hash
    );

    if (!pinCorretto) {
      return NextResponse.json(
        { error: "Telefono o PIN errati" },
        { status: 401 }
      );
    }

    const { data: movimenti, error: erroreMovimenti } = await supabase
      .from("vip_points_transactions")
      .select("id, punti, descrizione, created_at")
      .eq("customer_id", cliente.id)
      .order("created_at", { ascending: false });

    if (erroreMovimenti) {
      throw new Error(erroreMovimenti.message);
    }

    return NextResponse.json({
      success: true,
      cliente: {
        nome: cliente.nome,
        telefono: cliente.telefono,
        punti: cliente.punti,
      },
      movimenti: movimenti || [],
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