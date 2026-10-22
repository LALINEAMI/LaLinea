// LALINEA_LEADERBOARD_V1
import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/lalinea-game/classifica.html", request.url));
}
