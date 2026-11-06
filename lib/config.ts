// ====== À MODIFIER : la liste des potes ======
export const FRIENDS = [
  "Greg",
  "Arthur",
  "Lorenzo",
  "Héloïse",
  "Mahaut",
  "Zulma",
  "Antton",
  "Milo",
  "Rose",
  "Emiel",
  "Yanis",
  "Jules photo",
  "Achille",
  "Jeremy",
  "Jul",
  "Julie",
  "Bastien",
];
// =============================================

// Mois affiché (MONTH : janvier = 0, donc novembre = 10)
export const YEAR = 2026;
export const MONTH = 10;
export const MONTH_LABEL = "Novembre 2026";

export type Status = "in" | "out";
export type Days = Record<string, Status>; // { "1": "in", "14": "out" }
export type State = Record<string, Days>; // { "Jules": {...}, ... }

export const daysInMonth = () => new Date(YEAR, MONTH + 1, 0).getDate();
