import "./style.css";
import type { Level, Mode, Quiz, RawData, Screen, View, Word } from "./types";
import { isKnown, readCustom, setKnown } from "./storage";
import { $, esc, shuffle } from "./util";
import * as Gm from "./grammar";
import * as Mg from "./manage";

const PER = 10;
/* ---------- state ---------- */
const S: { view: View; screen: Screen; lv: number; day: number; mode: Mode; i: number;
  flip: boolean; done: boolean; typed: "ok" | "bad" | null; quiz: Quiz | null } =
  { view: "hub", screen: "levels", lv: 0, day: 0, mode: "card", i: 0, flip: false, done: false, typed: null, quiz: null };
let LV: Level[] = [];
let err = "";
let RAW: RawData | null = null;

const words = (): Word[] => LV[S.lv].words.slice(S.day * PER, S.day * PER + PER);
const nDays = (): number => Math.ceil(LV[S.lv].words.length / PER);
const known = (ws: Word[]): number => ws.filter(w => isKnown(w.id)).length;

function build(d: RawData): Level[] {
  if (!d || !Array.isArray(d.levels) || !d.levels.length) throw new Error("words.json không hợp lệ.");
  const c = readCustom();
  return d.levels.map((l, li) => {
    const base = (l.words ?? [])
      .map((w, wi) => ({ ...w, id: w.id ?? `level${String(li + 1).padStart(2, "0")}-${String(wi + 1).padStart(3, "0")}` }))
      .filter(w => !c.deleted.includes(w.id))
      .map(w => ({ ...w, ...(c.edits[w.id] ?? {}), id: w.id }));
    const added = c.added.filter(w => w.lv === li);
    return {
      name: l.level, range: l.range,
      words: [...base, ...added].map((w): Word => ({
        id: String(w.id), word: String(w.word), pos: w.pos ?? "", meaning: w.meaning ?? "",
        exampleEn: w.example_en ?? "", exampleJa: w.example_ja ?? ""
      }))
    };
  });
}

function speak(t: string): void {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "en-US"; u.rate = 0.85;
    speechSynthesis.speak(u);
  } catch { /* trình duyệt không hỗ trợ */ }
}

/* ---------- views: chọn bài ---------- */
/** Cần nhớ tối thiểu bao nhiêu % từ của cấp trước để mở cấp sau (đổi thành 100 nếu muốn học xong hẳn). */
const UNLOCK_PCT = 80;
const pctOf = (l: Level): number => (l.words.length ? Math.round(known(l.words) / l.words.length * 100) : 100);
const unlocked = (i: number): boolean => i === 0 || pctOf(LV[i - 1]) >= UNLOCK_PCT;

function levelsHTML(): string {
  if (err) return `<div class="errorbox"><b>Không tải được từ vựng</b><p>${esc(err)}</p></div>`;
  const icons = ["🌱", "📘", "🚀", "🏆"];
  const cards = LV.map((l, i) => {
    const t = l.words.length, k = known(l.words), p = t ? Math.round(k / t * 100) : 0;
    const locked = !unlocked(i);
    return `<button type="button" class="level-card${locked ? " locked" : ""}" data-lv="${i}" ${locked ? "disabled" : ""}>
      <div class="level-card-top"><span class="level-number">${String(i + 1).padStart(2, "0")}</span><span class="level-range">${esc(l.range)} điểm</span></div>
      <div class="level-icon">${locked ? "🔒" : icons[i] ?? "📗"}</div>
      <div class="level-info"><h3>${esc(l.name)}</h3><p>${t} từ · ${Math.ceil(t / PER)} ngày học</p></div>
      <div class="level-progress"><span style="width:${p}%"></span></div>
      <div class="level-bottom">${locked ? `<small>Cần nhớ ${UNLOCK_PCT}% cấp trước (hiện ${pctOf(LV[i - 1])}%)</small><b>🔒</b>` : `<small>${k}/${t} từ đã nhớ</small><b>Chọn →</b>`}</div></button>`;
  }).join("");
  return `<div class="selection-head"><button class="back-selection" data-nav="hub" aria-label="Về trang chủ">←</button><div><small>TOEIC Vocabulary</small><h1>Chọn cấp độ</h1></div></div>
    <section class="selection-hero"><span class="eyebrow">BƯỚC 1</span><h2>Bạn muốn học<br>ở mức nào?</h2><p>Chọn cấp độ phù hợp với mục tiêu điểm TOEIC của bạn.</p></section>
    <div class="level-list">${cards}</div>`;
}

function daysHTML(): string {
  const L = LV[S.lv];
  const days = Array.from({ length: nDays() }, (_, d) => {
    const ws = L.words.slice(d * PER, d * PER + PER), k = known(ws);
    const p = ws.length ? Math.round(k / ws.length * 100) : 0;
    return `<button type="button" class="day-card" data-day="${d}">
      <div class="day-card-head"><span class="day-badge">${d + 1}</span>${k === ws.length ? `<span class="complete-badge">✓ Hoàn thành</span>` : `<span class="day-percent">${p}%</span>`}</div>
      <div class="day-card-body"><small>NGÀY ${d + 1}</small><h3>${ws.slice(0, 4).map(w => esc(w.word)).join(", ")}${ws.length > 4 ? "…" : ""}</h3><p>${k}/${ws.length} từ đã nhớ</p></div>
      <div class="day-progress"><span style="width:${p}%"></span></div>
      <div class="day-card-action">Bắt đầu học <b>→</b></div></button>`;
  }).join("");
  return `<div class="selection-head"><button class="back-selection" data-screen="levels" aria-label="Chọn lại cấp độ">←</button><div><small>${esc(L.name)} · ${esc(L.range)} điểm</small><h1>Chọn ngày học</h1></div></div>
    <div class="day-list">${days}</div>`;
}

function modesHTML(): string {
  const ws = words();
  const modes: [Mode, string, string, string][] = [
    ["card", "🃏", "Thẻ học", "Lật thẻ, xem nghĩa và nghe phát âm."],
    ["quiz", "🧠", "Trắc nghiệm", "Kiểm tra khả năng nhớ nghĩa và từ vựng."],
    ["type", "⌨️", "Gõ từ", "Nhìn nghĩa tiếng Nhật và tự gõ từ tiếng Anh."]
  ];
  return `<div class="selection-head"><button class="back-selection" data-screen="days" aria-label="Chọn lại ngày">←</button><div><small>${esc(LV[S.lv].name)} · Ngày ${S.day + 1}</small><h1>Chọn chế độ học</h1></div></div>
    <section class="selection-hero compact"><span class="eyebrow">BƯỚC 3</span><h2>Bắt đầu học nào!</h2><p>Ngày ${S.day + 1} có ${ws.length} từ · Bạn đã nhớ ${known(ws)}/${ws.length}.</p></section>
    <div class="mode-list">${modes.map(([k, ic, t, d]) => `<button type="button" class="mode-card mode-${k}" data-start="${k}">
      <span class="mode-icon">${ic}</span><span class="mode-copy"><h3>${t}</h3><p>${d}</p></span><b class="mode-arrow">→</b></button>`).join("")}</div>`;
}

/* ---------- views: học ---------- */
const bar = (ws: Word[]): string =>
  `<div class="bar">${ws.map(w => `<i class="${isKnown(w.id) ? "on" : ""}"></i>`).join("")}<span>Đã nhớ ${known(ws)}/${ws.length}</span></div>`;

function cardHTML(ws: Word[]): string {
  const w = ws[S.i], stub = `<span class="stub">${S.i + 1}/${ws.length}</span>`;
  const head = `<div class="tk-head"><span>TOEIC ${esc(LV[S.lv].range)}</span><span>Ngày ${S.day + 1}</span></div>`;
  const face = S.flip
    ? `${head}<div class="tk-top"><div class="pos">${esc(w.word)} · ${esc(w.pos)}</div><div class="vi">${esc(w.meaning)}</div></div>
       <div class="tk-bot"><span>${esc(w.exampleEn)}<small>${esc(w.exampleJa)}</small></span>${stub}</div>`
    : `${head}<div class="tk-top"><div class="pos">${esc(w.pos)}</div><div class="word">${esc(w.word)}</div></div>
       <div class="tk-bot"><span>Chạm để xem nghĩa tiếng Nhật</span>${stub}</div>`;
  return `${bar(ws)}<button class="card" data-act="flip" aria-label="Lật thẻ">${face}</button>
    <div class="row"><button class="btn" data-act="speak">Nghe phát âm</button><button class="btn" data-act="shuf">Từ ngẫu nhiên</button></div>
    <div class="row"><button class="btn no" data-act="unknown">Chưa nhớ</button><button class="btn ok" data-act="known">${isKnown(w.id) ? "Đã nhớ ✓" : "Đã nhớ"}</button></div>
    <div class="row"><button class="btn" data-act="prev">Từ trước</button><span class="hint">${S.i + 1}/${ws.length}</span><button class="btn main" data-act="next">Từ sau</button></div>`;
}

const makeOpts = (w: Word): Word[] =>
  shuffle([w, ...shuffle(LV[S.lv].words.filter(x => x.id !== w.id && x.meaning !== w.meaning && x.word !== w.word)).slice(0, 3)]);

function newQuiz(): Quiz {
  const list = shuffle(words());
  return (S.quiz = { list, idx: 0, score: 0, picked: null, opts: makeOpts(list[0]) });
}

function quizHTML(): string {
  const q = S.quiz ?? newQuiz();
  if (q.idx >= q.list.length) {
    const pct = Math.round(q.score / q.list.length * 100);
    return `<div class="q"><div>Kết quả của bạn</div><div class="big">${q.score}/${q.list.length}</div>
      <p class="x">${pct >= 80 ? "Rất tốt! Hãy tiếp tục ôn luyện." : pct >= 50 ? "Khá ổn. Ôn lại các từ chưa nhớ." : "Hãy quay lại thẻ học để ôn thêm."}</p>
      <div class="row"><button class="btn" data-act="retry">Làm lại</button>${S.day + 1 < nDays() ? `<button class="btn main" data-act="nextday">Ngày tiếp theo</button>` : ""}</div></div>`;
  }
  const cur = q.list[q.idx];
  const opts = q.opts.map((o, n) => {
    let c = "btn opt";
    if (q.picked) { if (o.id === cur.id) c += " right"; else if (o.id === q.picked.id) c += " wrong"; }
    return `<button class="${c}" data-opt="${esc(o.id)}" ${q.picked ? "disabled" : ""}><b class="k">${"ABCD"[n]}</b><span>${esc(o.meaning)}</span></button>`;
  }).join("");
  return `<div class="bar"><div class="track"><div class="fill" style="width:${q.idx / q.list.length * 100}%"></div></div><span>Câu ${q.idx + 1}/${q.list.length}</span></div>
    <div class="q"><div class="word">${esc(cur.word)}</div><div class="pos">${esc(cur.pos)}</div>
    <p class="x">Chọn nghĩa tiếng Nhật đúng.</p><div class="opts">${opts}</div></div>`;
}

function typeHTML(ws: Word[]): string {
  const w = ws[S.i], res = S.typed;
  return `${bar(ws)}<div class="q"><div class="vi">${esc(w.meaning)}</div>
    <div class="x">${esc(w.pos)}, ${w.word.length} chữ cái, bắt đầu bằng "${esc(w.word[0])}"</div>
    <input id="ans" class="inp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ từ tiếng Anh" aria-label="Từ tiếng Anh" ${res ? "disabled" : ""}>
    ${res ? `<p class="fb ${res}">${res === "ok" ? "Chính xác!" : "Đáp án: " + esc(w.word)}</p><div class="ex">${esc(w.exampleEn)}<small>${esc(w.exampleJa)}</small></div>` : ""}
    <div class="row">${res ? `<button class="btn main" data-act="tnext">Từ tiếp theo</button>`
      : `<button class="btn" data-act="reveal">Xem đáp án</button><button class="btn main" data-act="check">Kiểm tra</button>`}</div></div>`;
}

function doneHTML(ws: Word[]): string {
  const n = known(ws), pct = ws.length ? Math.round(n / ws.length * 100) : 0;
  return `<div class="q"><div style="font-size:3rem">🎉</div><div class="vi">Hết ${ws.length} từ rồi!</div><div class="big">${n}/${ws.length}</div>
    <p class="x">${pct === 100 ? "Hoàn hảo! Bạn đã nhớ toàn bộ từ trong ngày." : pct >= 50 ? "Khá tốt. Học lại để nhớ nốt những từ còn lại." : "Hãy học lại để ghi nhớ thêm nhé."}</p>
    <div class="row"><button class="btn" data-act="again">Học lại</button>${S.day + 1 < nDays() ? `<button class="btn main" data-act="nextday">Ngày tiếp theo</button>` : ""}</div>
    <div class="row"><button class="btn" data-act="modes">Chọn chế độ khác</button></div></div>`;
}

function studyHTML(): string {
  const ws = words();
  const head = `<div class="sh"><button class="circle" data-act="home" aria-label="Về trang chủ">←</button><div><b>Ngày ${S.day + 1}</b><small>${esc(LV[S.lv].name)} · mốc ${esc(LV[S.lv].range)}</small></div></div>`;
  if (S.mode === "quiz") return head + quizHTML();
  if (S.done) return head + doneHTML(ws);
  return head + (S.mode === "card" ? cardHTML(ws) : typeHTML(ws));
}

const ICONS: Record<string, string> = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  card: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 10h8M8 14h5"/>',
  gram: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h7M8 11h5"/>',
  manage: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'
};

function navHTML(): string {
  const items: [string, string, string][] = [["hub", "Home", "home"], ["vocab", "Từ vựng", "card"], ["grammar", "Ngữ pháp", "gram"], ["manage", "Quản lý", "manage"]];
  return items.map(([k, n, ic]) => {
    const on = k === "vocab" ? S.view === "home" || S.view === "study" : S.view === k;
    return `<button data-nav="${k}" class="${on ? "on" : ""}" aria-label="${n}"><svg viewBox="0 0 24 24">${ICONS[ic]}</svg>${n}</button>`;
  }).join("");
}

function hubHTML(): string {
  const t = LV.reduce((a, l) => a + l.words.length, 0), k = LV.reduce((a, l) => a + known(l.words), 0);
  const cards: [string, string, string, string, string][] = [
    ["vocab", "📚", "Anh – Nhật", "Từ vựng", "Chọn cấp độ, chọn ngày rồi học bằng thẻ, trắc nghiệm hoặc gõ từ."],
    ["grammar", "📖", "Part 5 · 6", "Ngữ pháp", "Đọc quy tắc, xem ví dụ và luyện tập điền vào chỗ trống."],
    ["manage", "⚙️", "Tùy chỉnh", "Quản lý", "Thêm, sửa hoặc xóa từ vựng."]
  ];
  return `<div class="selection-head"><div class="selection-avatar">🎓</div><div><small>TOEIC Study</small><h1>Học gì hôm nay?</h1></div></div>
    <section class="selection-hero"><span class="eyebrow">CHÀO MỪNG</span><h2>Chọn nội dung<br>bạn muốn học</h2><p>Học từ vựng Anh–Nhật, ôn ngữ pháp hoặc tự quản lý nội dung của bạn.</p></section>
    <div class="stats"><div class="stat o"><small>Từ đã nhớ</small><b style="font-size:2rem">${k}/${t}</b></div>
    <div class="stat l"><small>Ngữ pháp hoàn thành</small><b style="font-size:2rem">${Gm.doneCount()}/${Gm.total}</b></div></div>
    <div class="mode-list" style="margin-top:14px">${cards.map(([key, ic, label, title, desc]) => `
      <button type="button" class="mode-card mode-${key}" data-nav="${key}"><span class="mode-icon">${ic}</span>
      <span class="mode-copy"><small>${label}</small><h3>${title}</h3><p>${desc}</p></span><b class="mode-arrow">→</b></button>`).join("")}</div>`;
}

function render(): void {
  $("nav").innerHTML = navHTML();
  $("app").innerHTML =
    S.view === "hub" ? hubHTML()
    : S.view === "grammar" ? Gm.html()
    : S.view === "manage" ? Mg.html(LV, err)
    : S.view === "study" ? studyHTML()
    : S.screen === "days" ? daysHTML() : S.screen === "modes" ? modesHTML() : levelsHTML();
  if (S.view === "study" && S.mode === "type" && !S.typed && !S.done) document.getElementById("ans")?.focus();
}

function handleNav(k: string): void {
  if (k === "hub") S.view = "hub";
  else if (k === "vocab") { S.view = "home"; S.screen = "levels"; }
  else if (k === "grammar") { S.view = "grammar"; Gm.reset(); }
  else if (k === "manage") { S.view = "manage"; Mg.reset(); }
  render();
  window.scrollTo(0, 0);
}

function rebuild(): void {
  if (!RAW) return;
  LV = build(RAW);
  S.day = 0; S.i = 0; S.quiz = null; S.done = false;
  if (S.lv >= LV.length) S.lv = 0;
}

/* ---------- actions ---------- */
function pick(id: string): void {
  const q = S.quiz;
  if (!q || q.picked) return;
  const cur = q.list[q.idx];
  q.picked = q.opts.find(o => o.id === id) ?? null;
  if (q.picked?.id === cur.id) { q.score++; setKnown(cur.id, true); }
  render();
  setTimeout(() => {
    if (S.quiz !== q) return;
    q.idx++; q.picked = null;
    if (q.idx < q.list.length) q.opts = makeOpts(q.list[q.idx]);
    render();
  }, 1300);
}

function act(a: string): boolean {
  const ws = words(), w = ws[S.i];
  const reset = () => { S.done = false; S.i = 0; S.flip = false; S.typed = null; };
  const next = () => { if (S.i + 1 >= ws.length) S.done = true; else S.i++; S.flip = false; S.typed = null; };
  switch (a) {
    case "home": S.view = "home"; S.screen = "levels"; break;
    case "modes": S.done = false; S.view = "home"; S.screen = "modes"; break;
    case "flip": S.flip = !S.flip; break;
    case "next": case "tnext": next(); break;
    case "prev": S.i = (S.i - 1 + ws.length) % ws.length; S.flip = false; break;
    case "shuf": S.i = Math.floor(Math.random() * ws.length); S.flip = false; break;
    case "speak": speak(w.word); return false;
    case "known": setKnown(w.id, true); next(); break;
    case "unknown": setKnown(w.id, false); next(); break;
    case "reveal": S.typed = "bad"; break;
    case "check": {
      const el = document.getElementById("ans") as HTMLInputElement | null;
      if (!el || !el.value.trim()) return false;
      const ok = el.value.trim().toLowerCase() === w.word.toLowerCase();
      S.typed = ok ? "ok" : "bad";
      if (ok) setKnown(w.id, true);
      break;
    }
    case "retry": newQuiz(); break;
    case "again": reset(); S.quiz = null; break;
    case "nextday": if (S.day + 1 < nDays()) S.day++; reset(); S.quiz = null; break;
  }
  return true;
}

document.addEventListener("click", e => {
  const b = (e.target as HTMLElement).closest("button");
  if (!b) return;
  const d = b.dataset;
  if (d.nav) { handleNav(d.nav); return; }
  if (d.m) {
    const r = Mg.handle(d, LV, rebuild);
    if (r !== "skip") { render(); if (r === "top") window.scrollTo(0, 0); }
    return;
  }
  if (d.gt !== undefined || d.gact || d.gopt !== undefined) {
    const top = Gm.handle(d);
    render();
    if (top) window.scrollTo(0, 0);
    return;
  }
  if (d.lv !== undefined) { if (!unlocked(+d.lv)) return; S.lv = +d.lv; S.day = 0; S.screen = "days"; }
  else if (d.day !== undefined) { S.day = +d.day; S.screen = "modes"; }
  else if (d.screen) S.screen = d.screen as Screen;
  else if (d.start) { S.view = "study"; S.mode = d.start as Mode; S.i = 0; S.flip = false; S.done = false; S.typed = null; S.quiz = null; }
  else if (d.opt !== undefined) { pick(d.opt); return; }
  else if (d.act) { if (!act(d.act)) return; }
  render();
  window.scrollTo(0, 0);
});

document.addEventListener("keydown", e => {
  if (e.key === "Enter" && (e.target as HTMLElement).id === "ans" && act("check")) render();
});

document.addEventListener("input", e => {
  const t = e.target as HTMLInputElement;
  if (t.id === "msearch") Mg.search(t.value, LV);
});

/* ---------- boot ---------- */
async function boot(): Promise<void> {
  try {
    const res = await fetch(import.meta.env.BASE_URL + "words.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Không tải được words.json (${res.status})`);
    RAW = (await res.json()) as RawData;
    LV = build(RAW);
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
  }
  render();
}
void boot();
