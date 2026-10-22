// LALINEA_LEADERBOARD_V1
import { NextRequest, NextResponse } from "next/server";
import { authenticate, database, GameError, SESSION_COOKIE } from "../../../../lib/lalineaGameServer";
import { projectLeaderboard } from "../../../../lib/lalinea-leaderboard.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store, private",
  "Vary": "Cookie",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(request: NextRequest) {
  try {
    let viewerId: string | null = null;
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token) {
      try { viewerId = String((await authenticate(token)).id); }
      catch (error) {
        if (!(error instanceof GameError && error.status === 401)) throw error;
      }
    }
    const data = await database<unknown>("rpc/llg_leaderboard", { p_customer_id: viewerId, p_limit: 100 });
    const secret = String(process.env.SB_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "");
    return NextResponse.json(projectLeaderboard(data, { secret, viewerId }), { headers });
  } catch {
    return NextResponse.json({ error: "La classifica è momentaneamente non disponibile. Riprova tra poco." }, { status: 503, headers });
  }
}
