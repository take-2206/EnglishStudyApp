import type { Level, Word } from "./types";
import { readCustom, writeCustom } from "./storage";
import { esc } from "./util";

const M: { lv: number; q: string; edit: { id: string | null; lv: number } | null; confirm: string | null } =
  { lv: 0, q: "", edit: null, confirm: null };
export const reset = (): void => { M.edit = null; M.confirm = null; };
const val = (id: string): string => (document.getElementById(id) as HTMLInputElement).value.trim();
const uid = (): string => "custom-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const head = (back: string, sub: string, title: string): string =>
  `<div class="selection-head"><button class="back-selection" ${back} aria-label="Quay lại">←</button><div><small>${sub}</small><h1>${title}</h1></div></div>`;

function listHTML(LV: Level[]): string {
  const L = LV[M.lv];
  if (!L) return "";
  const q = M.q.trim().toLowerCase();
  const rows = L.words.filter(w => !q || w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q));
  if (!rows.length) return `<div class="q"><p class="x">Không có từ nào.</p></div>`;
  return `<p class="hint" style="margin:0 0 8px">${rows.length}/${L.words.length} từ</p>` + rows.map(w => `
    <div class="m-row"><div class="m-main"><b>${esc(w.word)}</b> <span class="pos">${esc(w.pos)}</span><small>${esc(w.meaning)}</small></div>
    <div class="m-act"><button class="mbtn" data-m="editw" data-v="${esc(w.id)}">Sửa</button>
    <button class="mbtn del" data-m="delw" data-v="${esc(w.id)}">${M.confirm === "w:" + w.id ? "Chắc chắn?" : "Xóa"}</button></div></div>`).join("");
}

function formHTML(LV: Level[]): string {
  const e = M.edit!;
  const found: Word | undefined = e.id === null ? undefined : LV.flatMap(l => l.words).find(w => w.id === e.id);
  const w = found ?? { id: "", word: "", pos: "", meaning: "", exampleEn: "", exampleJa: "" };
  const f = (id: string, label: string, v: string, extra = ""): string =>
    `<label class="fld"><span>${label}</span><input id="${id}" value="${esc(v)}" autocomplete="off" ${extra}></label>`;
  return `${head('data-m="cancel"', esc(LV[e.lv]?.name ?? ""), e.id === null ? "Thêm từ mới" : "Sửa từ")}
    <div class="q" style="text-align:left">
      ${f("wf-word", "Từ tiếng Anh *", w.word, 'autocapitalize="off" spellcheck="false"')}
      ${f("wf-pos", "Loại từ (n., v., adj., adv....)", w.pos)}
      ${f("wf-mean", "Nghĩa tiếng Nhật *", w.meaning)}
      ${f("wf-en", "Câu ví dụ (tiếng Anh)", w.exampleEn)}
      ${f("wf-ja", "Dịch câu ví dụ (tiếng Nhật)", w.exampleJa)}
      <p id="ferr" class="fb bad"></p>
      <div class="row"><button class="btn" data-m="cancel">Hủy</button><button class="btn main" data-m="save">Lưu</button></div></div>`;
}

export function html(LV: Level[], err: string): string {
  if (M.edit) return formHTML(LV);
  const body = err || !LV.length
    ? `<div class="errorbox"><b>Chưa có dữ liệu từ vựng</b><p>${esc(err || "words.json chưa có dữ liệu.")}</p></div>`
    : `<div class="chips">${LV.map((l, i) => `<button class="chip ${i === M.lv ? "on" : ""}" data-m="lv" data-v="${i}">${esc(l.name)}<small>${l.words.length}</small></button>`).join("")}</div>
      <label class="fld"><span>Tìm từ</span><input id="msearch" value="${esc(M.q)}" placeholder="Nhập từ hoặc nghĩa" autocomplete="off"></label>
      <div class="row"><button class="btn main" data-m="addw">＋ Thêm từ vào ${esc(LV[M.lv].name)}</button></div>
      <div id="mlist" style="margin-top:14px">${listHTML(LV)}</div>
      <div class="row" style="margin-top:18px"><button class="btn no" data-m="reset">${M.confirm === "reset" ? "Bấm lần nữa để khôi phục" : "Khôi phục dữ liệu mặc định"}</button></div>`;
  return `${head('data-nav="hub"', "Quản lý", "Từ vựng")}${body}`;
}

export function search(v: string, LV: Level[]): void {
  M.q = v;
  const el = document.getElementById("mlist");
  if (el) el.innerHTML = listHTML(LV);
}

export function handle(d: DOMStringMap, LV: Level[], rebuild: () => void): "skip" | "render" | "top" {
  const v = d.v ?? "";
  if (!["delw", "reset"].includes(d.m ?? "")) M.confirm = null;
  switch (d.m) {
    case "lv": M.lv = +v; M.q = ""; return "render";
    case "addw": M.edit = { id: null, lv: M.lv }; return "top";
    case "editw": M.edit = { id: v, lv: M.lv }; return "top";
    case "cancel": M.edit = null; return "top";
    case "delw": {
      if (M.confirm !== "w:" + v) { M.confirm = "w:" + v; return "render"; }
      const c = readCustom(), i = c.added.findIndex(x => x.id === v);
      if (i >= 0) c.added.splice(i, 1); else { if (!c.deleted.includes(v)) c.deleted.push(v); delete c.edits[v]; }
      writeCustom(c); rebuild(); M.confirm = null; return "render";
    }
    case "reset":
      if (M.confirm !== "reset") { M.confirm = "reset"; return "render"; }
      writeCustom({ added: [], edits: {}, deleted: [] }); rebuild(); M.confirm = null; return "render";
    case "save": {
      const e = M.edit;
      if (!e) return "skip";
      const f = { word: val("wf-word"), pos: val("wf-pos"), meaning: val("wf-mean"), example_en: val("wf-en"), example_ja: val("wf-ja") };
      if (!f.word || !f.meaning) { document.getElementById("ferr")!.textContent = "Cần nhập từ tiếng Anh và nghĩa tiếng Nhật."; return "skip"; }
      const c = readCustom();
      if (e.id === null) c.added.push({ id: uid(), lv: e.lv, ...f });
      else {
        const i = c.added.findIndex(x => x.id === e.id);
        if (i >= 0) c.added[i] = { ...c.added[i], ...f }; else c.edits[e.id] = f;
      }
      writeCustom(c); rebuild(); M.lv = e.lv; M.edit = null; return "top";
    }
  }
  return "skip";
}
