import type { Question } from "./types";
import { TOPICS } from "./grammarData";
import { esc, shuffle } from "./util";

const KEY = "toeic-grammar-v1";
type Scores = Record<string, { best: number; total: number; updated_at: string }>;
interface GQuiz { qs: Question[]; idx: number; score: number; picked: number | null }
const G: { screen: "list" | "lesson" | "quiz"; t: number; quiz: GQuiz | null } = { screen: "list", t: 0, quiz: null };

function scores(): Scores {
  try { const d: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}"); return d && typeof d === "object" ? (d as Scores) : {}; }
  catch { return {}; }
}
function saveScore(id: string, score: number, total: number): void {
  try {
    const d = scores();
    d[id] = { best: Math.max(d[id]?.best ?? 0, score), total, updated_at: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch { /* storage bị chặn */ }
}
export const total = TOPICS.length;
export const doneCount = (): number => { const s = scores(); return TOPICS.filter(t => s[t.id]?.best === t.q.length).length; };
export const reset = (): void => { G.screen = "list"; G.quiz = null; };

const fmt = (s: string): string => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
const head = (back: string, sub: string, title: string): string =>
  `<div class="selection-head"><button class="back-selection" ${back} aria-label="Quay lại">←</button><div><small>${sub}</small><h1>${title}</h1></div></div>`;

function listHTML(): string {
  const sc = scores();
  const cards = TOPICS.map((t, i) => {
    const n = t.q.length, best = sc[t.id]?.best ?? null, pct = best === null ? 0 : Math.round(best / n * 100);
    const badge = best === null ? `<span class="day-percent">Chưa làm</span>`
      : best === n ? `<span class="complete-badge">✓ ${best}/${n}</span>` : `<span class="day-percent">Tốt nhất ${best}/${n}</span>`;
    return `<button type="button" class="day-card" data-gt="${i}"><div class="day-card-head"><span class="day-badge">${t.icon}</span>${badge}</div>
      <div class="day-card-body"><small>CHỦ ĐỀ ${i + 1} · ${esc(t.ja)}</small><h3>${esc(t.title)}</h3><p>${esc(t.summary)}</p></div>
      <div class="day-progress"><span style="width:${pct}%"></span></div><div class="day-card-action">Xem bài <b>→</b></div></button>`;
  }).join("");
  return `${head('data-nav="hub"', "TOEIC Grammar", "Ngữ pháp")}
    <section class="selection-hero compact"><span class="eyebrow">PART 5 · 6</span><h2>Ôn ngữ pháp trọng tâm</h2><p>Đọc quy tắc và ví dụ, sau đó làm các câu luyện tập cho mỗi chủ đề.</p></section>
    <div class="day-list">${cards}</div>`;
}

function lessonHTML(): string {
  const t = TOPICS[G.t];
  return `${head('data-gact="list"', `Ngữ pháp · ${esc(t.ja)}`, esc(t.title))}
    <section class="selection-hero compact"><span class="eyebrow">TÓM TẮT</span><h2>${t.icon} ${esc(t.title)}</h2><p>${esc(t.summary)}</p></section>
    <div class="q" style="text-align:left"><div class="pos">QUY TẮC</div>
      <ul class="g-list">${t.rules.map(r => `<li>${fmt(r)}</li>`).join("")}</ul>
      <div class="pos" style="margin-top:16px">VÍ DỤ</div>
      ${t.examples.map(([en, ja]) => `<div class="ex"><div>${fmt(en)}</div><small>${esc(ja)}</small></div>`).join("")}</div>
    <div class="row"><button class="btn main" data-gact="start">Luyện tập (${t.q.length} câu)</button></div>`;
}

function startQuiz(): void {
  const qs = shuffle(TOPICS[G.t].q).map(q => {
    const order = shuffle(q.o.map((_, i) => i));
    return { s: q.s, o: order.map(i => q.o[i]), a: order.indexOf(q.a), e: q.e };
  });
  G.quiz = { qs, idx: 0, score: 0, picked: null };
}

function quizHTML(): string {
  const t = TOPICS[G.t];
  if (!G.quiz) startQuiz();
  const q = G.quiz as GQuiz, n = q.qs.length;
  if (q.idx >= n) {
    const pct = Math.round(q.score / n * 100);
    return `${head('data-gact="list"', `Ngữ pháp · ${esc(t.title)}`, "Kết quả")}
      <div class="q"><div style="font-size:3rem">${pct === 100 ? "🎉" : "📝"}</div><div class="big">${q.score}/${n}</div>
      <p class="x">${pct === 100 ? "Hoàn hảo! Bạn đã nắm vững chủ đề này." : pct >= 50 ? "Khá tốt. Đọc lại quy tắc rồi thử lại nhé." : "Hãy xem lại bài học rồi làm lại."}</p>
      <div class="row"><button class="btn" data-gact="lesson">Xem lại bài</button><button class="btn" data-gact="start">Làm lại</button></div>
      <div class="row">${G.t + 1 < TOPICS.length ? `<button class="btn main" data-gact="nexttopic">Chủ đề tiếp theo</button>` : `<button class="btn main" data-gact="list">Về danh sách</button>`}</div></div>`;
  }
  const cur = q.qs[q.idx], answered = q.picked !== null;
  const opts = cur.o.map((txt, i) => {
    let c = "btn opt";
    if (answered) { if (i === cur.a) c += " right"; else if (i === q.picked) c += " wrong"; }
    return `<button class="${c}" data-gopt="${i}" ${answered ? "disabled" : ""}><b class="k">${"ABCD"[i]}</b><span>${esc(txt)}</span></button>`;
  }).join("");
  const sentence = esc(cur.s).replace("___", `<b style="color:var(--orgd)">＿＿＿</b>`);
  return `${head('data-gact="lesson"', `Ngữ pháp · ${esc(t.title)}`, "Luyện tập")}
    <div class="bar"><div class="track"><div class="fill" style="width:${q.idx / n * 100}%"></div></div><span>Câu ${q.idx + 1}/${n}</span></div>
    <div class="q"><div class="vi" style="font-size:1.4rem">${sentence}</div><p class="x">Chọn đáp án đúng để điền vào chỗ trống.</p>
    <div class="opts">${opts}</div>
    ${answered ? `<p class="fb ${q.picked === cur.a ? "ok" : "bad"}">${q.picked === cur.a ? "Chính xác!" : "Chưa đúng"}</p><div class="g-note">${esc(cur.e)}</div>
      <div class="row"><button class="btn main" data-gact="gnext">${q.idx + 1 < n ? "Câu tiếp theo" : "Xem kết quả"}</button></div>` : ""}</div>`;
}

export const html = (): string => G.screen === "lesson" ? lessonHTML() : G.screen === "quiz" ? quizHTML() : listHTML();

/** Trả về true nếu nên cuộn lên đầu trang. */
export function handle(d: DOMStringMap): boolean {
  if (d.gt !== undefined) { G.t = +d.gt; G.screen = "lesson"; G.quiz = null; return true; }
  if (d.gopt !== undefined) {
    const q = G.quiz;
    if (!q || q.picked !== null) return false;
    q.picked = +d.gopt;
    if (q.picked === q.qs[q.idx].a) q.score++;
    if (q.idx === q.qs.length - 1) saveScore(TOPICS[G.t].id, q.score, q.qs.length);
    return false;
  }
  switch (d.gact) {
    case "list": G.screen = "list"; G.quiz = null; break;
    case "lesson": G.screen = "lesson"; G.quiz = null; break;
    case "start": startQuiz(); G.screen = "quiz"; break;
    case "gnext": if (G.quiz && G.quiz.picked !== null) { G.quiz.idx++; G.quiz.picked = null; } break;
    case "nexttopic": if (G.t + 1 < TOPICS.length) { G.t++; G.screen = "lesson"; G.quiz = null; } break;
  }
  return true;
}
