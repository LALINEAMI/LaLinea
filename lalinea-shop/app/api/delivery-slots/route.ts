import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ORARI_CONSENTITI = new Set([
  "13:00",
  "13:30",

  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
  "00:00",
  "00:30",
  "01:00",
  "01:30",
  "02:00",
]);

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Mancano NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return { url, serviceRoleKey };
}

function dataItalia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function oraItalia() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const ora = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minuto = parts.find((part) => part.type === "minute")?.value ?? "00";

  return `${ora}:${minuto}`;
}

function dataValida(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizzaOrario(value: unknown) {
  return String(value ?? "").slice(0, 5);
}

function headersSupabase(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    "Content-Type": "application/json",
  };
}

export async function GET(request: NextRequest) {
  try {
    const data = request.nextUrl.searchParams.get("date") ?? "";

    if (!dataValida(data)) {
      return NextResponse.json(
        { error: "Data non valida" },
        { status: 400 }
      );
    }

    const { url, serviceRoleKey } = supabaseConfig();

    const risposta = await fetch(
      `${url}/rest/v1/delivery_slot_reservations?delivery_date=eq.${encodeURIComponent(
        data
      )}&select=delivery_time`,
      {
        method: "GET",
        headers: headersSupabase(serviceRoleKey),
        cache: "no-store",
      }
    );

    if (!risposta.ok) {
      return NextResponse.json(
        { error: "Impossibile leggere gli orari disponibili" },
        { status: 500 }
      );
    }

    const righe = (await risposta.json()) as Array<{
      delivery_time?: string;
    }>;

    const occupati = righe
      .map((riga) => normalizzaOrario(riga.delivery_time))
      .filter(Boolean);

    return NextResponse.json({ occupati });
  } catch {
    return NextResponse.json(
      { error: "Errore interno durante la lettura degli slot" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const data = String(body?.date ?? "");
    const orario = normalizzaOrario(body?.time);

    if (!dataValida(data) || !ORARI_CONSENTITI.has(orario)) {
      return NextResponse.json(
        { error: "Data o orario non validi" },
        { status: 400 }
      );
    }

    const oggi = dataItalia();

    if (data < oggi) {
      return NextResponse.json(
        { error: "Non è possibile prenotare una data passata" },
        { status: 400 }
      );
    }

    if (data === oggi && orario <= oraItalia()) {
      return NextResponse.json(
        { error: "Questo orario è già passato" },
        { status: 400 }
      );
    }

    const { url, serviceRoleKey } = supabaseConfig();

    const risposta = await fetch(
      `${url}/rest/v1/delivery_slot_reservations`,
      {
        method: "POST",
        headers: {
          ...headersSupabase(serviceRoleKey),
          Prefer: "return=representation",
        },
        body: JSON.stringify([
          {
            delivery_date: data,
            delivery_time: orario,
          },
        ]),
        cache: "no-store",
      }
    );

    if (!risposta.ok) {
      const testo = await risposta.text();

      let codice = "";

      try {
        codice = JSON.parse(testo)?.code ?? "";
      } catch {}

      if (risposta.status === 409 || codice === "23505") {
        return NextResponse.json(
          {
            error:
              "Questo orario è appena stato prenotato da un altro cliente",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Impossibile prenotare questo orario" },
        { status: 500 }
      );
    }

    const righe = (await risposta.json()) as Array<{ id?: string }>;

    return NextResponse.json({
      ok: true,
      id: righe[0]?.id ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Errore interno durante la prenotazione" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body?.id ?? "");

    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return NextResponse.json(
        { error: "Prenotazione non valida" },
        { status: 400 }
      );
    }

    const { url, serviceRoleKey } = supabaseConfig();

    const risposta = await fetch(
      `${url}/rest/v1/delivery_slot_reservations?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: headersSupabase(serviceRoleKey),
        cache: "no-store",
      }
    );

    if (!risposta.ok) {
      return NextResponse.json(
        { error: "Impossibile liberare lo slot" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Errore interno durante il rilascio dello slot" },
      { status: 500 }
    );
  }
}