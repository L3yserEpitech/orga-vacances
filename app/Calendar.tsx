"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FRIENDS, MONTH, MONTH_LABEL, YEAR, daysInMonth, type State, type Status } from "@/lib/config";

const DOW = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const COLORS = ["#ff7a3d", "#3d7bff", "#a64dff", "#16a34a", "#e11d74", "#0ea5a4", "#c58a00", "#6b7280", "#ef4444", "#7c3aed", "#0284c7", "#65a30d"];
const POLL_MS = 4000;
const STORAGE_KEY = "dispo-me";

const next = (s: Status | undefined): Status | null => (!s ? "in" : s === "in" ? "out" : null);

export default function Calendar() {
  const [me, setMe] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<State>({});
  const [status, setStatus] = useState<{ text: string; warn?: boolean }>({ text: "Connexion…" });
  const [today, setToday] = useState<number | null>(null);

  // Clics pas encore confirmés par le serveur : "Prénom|jour" -> valeur voulue
  const pending = useRef(new Map<string, Status | null>());

  // ---- Prénom mémorisé sur cet appareil + jour courant
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && FRIENDS.includes(saved)) setMe(saved);
    } catch {}
    const now = new Date();
    if (now.getFullYear() === YEAR && now.getMonth() === MONTH) setToday(now.getDate());
    setReady(true);
  }, []);

  const choose = (name: string | null) => {
    setMe(name);
    window.scrollTo(0, 0);
    try {
      if (name) localStorage.setItem(STORAGE_KEY, name);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  // ---- Lecture + rafraîchissement régulier
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dispo", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { state: State; persistent: boolean };
      const merged: State = {};
      for (const name of FRIENDS) merged[name] = { ...(data.state[name] ?? {}) };
      // on garde les clics locaux en cours d'envoi
      pending.current.forEach((value, key) => {
        const [name, day] = key.split("|");
        if (!merged[name]) return;
        if (value) merged[name][day] = value;
        else delete merged[name][day];
      });
      setState(merged);
      setStatus(
        data.persistent
          ? { text: "Synchronisé" }
          : { text: "Pas de base connectée : rien n'est partagé", warn: true },
      );
    } catch {
      setStatus({ text: "Hors connexion", warn: true });
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [load]);

  // ---- Clic sur un jour
  const toggle = async (day: number) => {
    if (!me) return;
    const key = `${me}|${day}`;
    const value = next(state[me]?.[String(day)]);
    pending.current.set(key, value);
    setState((s) => {
      const mine = { ...(s[me] ?? {}) };
      if (value) mine[String(day)] = value;
      else delete mine[String(day)];
      return { ...s, [me]: mine };
    });
    try {
      const res = await fetch("/api/dispo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: me, day, status: value }),
      });
      if (!res.ok) throw new Error();
      setStatus({ text: "Enregistré ✓" });
    } catch {
      setStatus({ text: "Pas enregistré, réessaie", warn: true });
    } finally {
      // ne retire que si aucun clic plus récent n'a remplacé celui-ci
      if (pending.current.get(key) === value) pending.current.delete(key);
    }
  };

  if (!ready) return null;

  // ================= Écran de choix =================
  if (!me) {
    return (
      <main className="picker">
        <header className="picker-head">
          <h1>
            Qui est là<span>?</span>
          </h1>
          <p className="sub">Vacances entre potes · {MONTH_LABEL}</p>
          <p className="picker-ask">Tu es qui ?</p>
        </header>
        <div className="names">
          {FRIENDS.map((n, i) => (
            <button key={n} className="name-btn" onClick={() => choose(n)}>
              <span className="dot" style={{ background: COLORS[i % COLORS.length] }} />
              {n}
            </button>
          ))}
        </div>
      </main>
    );
  }

  // ================= Calendrier =================
  const offset = (new Date(YEAR, MONTH, 1).getDay() + 6) % 7; // lundi = 0
  const total = daysInMonth();
  const days = Array.from({ length: total }, (_, i) => i + 1);
  const dowOf = (d: number) => (offset + d - 1) % 7;

  const scores = days.map((d) => ({ d, nIn: FRIENDS.filter((f) => state[f]?.[String(d)] === "in").length }));
  const answered = FRIENDS.filter((f) => Object.keys(state[f] ?? {}).length > 0);
  const missing = FRIENDS.filter((f) => !answered.includes(f));
  const max = Math.max(0, ...scores.map((s) => s.nIn));
  const best = max ? scores.filter((s) => s.nIn === max).map((s) => s.d) : [];
  const monthShort = MONTH_LABEL.split(" ")[0].slice(0, 3).toLowerCase() + ".";

  return (
    <main className="app">
      {/* Barre du haut, collée en haut sur mobile */}
      <header className="bar">
        <div className="bar-me">
          <span className="bar-label">Tu es</span>
          <b>{me}</b>
        </div>
        <span className={"status" + (status.warn ? " warn" : "")}>{status.text}</span>
        <button className="bar-switch" onClick={() => choose(null)}>
          Changer
        </button>
      </header>

      <section className="intro">
        <h1>{MONTH_LABEL}</h1>
        <p className="sub">
          Appuie sur un jour : <b className="t-in">1× là</b> · <b className="t-out">2× pas là</b> · 3× effacer
        </p>
      </section>

      <section className="summary">
        <div className="sum-row">
          <span className="sum-big">
            {answered.length}
            <small>/{FRIENDS.length}</small>
          </span>
          <span className="sum-text">
            ont répondu
            {missing.length > 0 && (
              <>
                <br />
                <span className="muted">On attend : {missing.join(", ")}</span>
              </>
            )}
          </span>
        </div>
        {best.length > 0 && (
          <div className="sum-best">
            <span className="muted">Le plus de monde ({max}/{FRIENDS.length}) :</span>
            <div className="best">
              {best.map((d) => (
                <span key={d}>
                  {DOW[dowOf(d)].toLowerCase()} {d} {monthShort}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="cal">
        {DOW.map((d) => (
          <div key={d} className="dow">
            {d}
          </div>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div key={"e" + i} className="day empty" aria-hidden />
        ))}
        {days.map((d) => {
          const mine = state[me]?.[String(d)];
          const dow = dowOf(d);
          const people = FRIENDS.map((f) => ({ f, s: state[f]?.[String(d)] })).filter((p) => p.s);
          const nIn = people.filter((p) => p.s === "in").length;
          const nOut = people.length - nIn;
          const cls = [
            "day",
            dow >= 5 && "weekend",
            dow === 0 && "monday",
            mine,
            nIn === FRIENDS.length && "all",
            d === today && "today",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button key={d} className={cls} onClick={() => toggle(d)} aria-label={`${DOW[dow]} ${d} ${MONTH_LABEL}`}>
              <div className="day-head">
                <span className="date">
                  <span className="date-dow">{DOW[dow]}</span>
                  <b>{d}</b>
                  {d === today && <span className="today-tag">auj.</span>}
                </span>
                <span className="count">
                  {nIn > 0 && <span className="g">{nIn}✓</span>}
                  {nOut > 0 && <span className="r">{nOut}✗</span>}
                </span>
                <span className={"mine " + (mine ?? "none")}>
                  {mine === "in" ? "Je suis là" : mine === "out" ? "Pas là" : "?"}
                </span>
              </div>
              {people.length > 0 && (
                <div className="bubbles">
                  {people.map(({ f, s }) => (
                    <span key={f} className={`b ${s}${f === me ? " self" : ""}`}>
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <footer className="legend">
        <span className="chip"><i className="sw" style={{ background: "var(--green)" }} />Là</span>
        <span className="chip"><i className="sw" style={{ background: "var(--red)" }} />Pas là</span>
        <span className="chip"><i className="sw ring" />Tout le monde est là</span>
      </footer>
    </main>
  );
}
