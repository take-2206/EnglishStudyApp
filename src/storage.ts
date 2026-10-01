import type { RawWord } from "./types";
const KEY = "toeic-progress-v1";
type Progress = Record<string, { known: boolean; updated_at: string }>;

function read(): Progress {
  try {
    const d: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return d && typeof d === "object" ? (d as Progress) : {};
  } catch { return {}; }
}

export const isKnown = (id: string): boolean => Boolean(read()[id]);

export function setKnown(id: string, known: boolean): void {
  const p = read();
  if (known) p[id] = { known: true, updated_at: new Date().toISOString() };
  else delete p[id];
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage bị chặn */ }
}

export interface Custom { added: (RawWord & { id: string; lv: number })[]; edits: Record<string, RawWord>; deleted: string[] }
const CK = "toeic-custom-v1";
function rawCustom(): Record<string, unknown> {
  try { const d: unknown = JSON.parse(localStorage.getItem(CK) ?? "{}"); return d && typeof d === "object" ? (d as Record<string, unknown>) : {}; }
  catch { return {}; }
}
export function readCustom(): Custom {
  const v = (rawCustom().vocab ?? {}) as Partial<Custom>;
  return { added: Array.isArray(v.added) ? v.added : [], edits: v.edits && typeof v.edits === "object" ? v.edits : {}, deleted: Array.isArray(v.deleted) ? v.deleted : [] };
}
export function writeCustom(c: Custom): boolean {
  try { localStorage.setItem(CK, JSON.stringify({ ...rawCustom(), vocab: c })); return true; } catch { return false; }
}
