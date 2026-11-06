import { Redis } from "@upstash/redis";
import { FRIENDS, MONTH, YEAR, type Days, type State, type Status } from "./config";

// Vercel (intégration Upstash) injecte KV_REST_API_*, Upstash direct injecte UPSTASH_REDIS_REST_*.
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

// Repli en mémoire pour le dev local sans base (rien n'est partagé ni conservé).
const memory = new Map<string, Days>();

export const isPersistent = redis !== null;

const keyFor = (name: string) => `dispo:${YEAR}-${String(MONTH + 1).padStart(2, "0")}:${name}`;

export async function getState(): Promise<State> {
  const state: State = {};
  if (!redis) {
    for (const name of FRIENDS) state[name] = { ...(memory.get(name) ?? {}) };
    return state;
  }
  const pipe = redis.pipeline();
  for (const name of FRIENDS) pipe.hgetall<Record<string, Status>>(keyFor(name));
  const results = (await pipe.exec()) as (Record<string, Status> | null)[];
  FRIENDS.forEach((name, i) => {
    state[name] = results[i] ?? {};
  });
  return state;
}

export async function setDay(name: string, day: number, status: Status | null) {
  const field = String(day);
  if (!redis) {
    const days = { ...(memory.get(name) ?? {}) };
    if (status) days[field] = status;
    else delete days[field];
    memory.set(name, days);
    return;
  }
  if (status) await redis.hset(keyFor(name), { [field]: status });
  else await redis.hdel(keyFor(name), field);
}
