import { NextResponse } from "next/server";
import { FRIENDS, daysInMonth } from "@/lib/config";
import { getState, isPersistent, setDay } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getState();
    return NextResponse.json({ state, persistent: isPersistent }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lecture impossible" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const { name, day, status } = (body ?? {}) as { name?: unknown; day?: unknown; status?: unknown };

  if (typeof name !== "string" || !FRIENDS.includes(name)) {
    return NextResponse.json({ error: "Prénom inconnu" }, { status: 400 });
  }
  if (typeof day !== "number" || !Number.isInteger(day) || day < 1 || day > daysInMonth()) {
    return NextResponse.json({ error: "Jour invalide" }, { status: 400 });
  }
  if (status !== "in" && status !== "out" && status !== null) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  try {
    await setDay(name, day, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }
}
