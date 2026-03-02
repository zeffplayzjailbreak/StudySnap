import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = "https://api.anthropic.com/v1/messages";

async function callClaude(systemPrompt, userPrompt) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  const raw = data.content.map((i) => i.text || "").join("").replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap');
`;

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Nunito', sans-serif; }
  
  :root {
    --bg: #0d1117;
    --bg2: #161b22;
    --bg3: #1c2330;
    --border: #2d3748;
    --green: #3ddc84;
    --green2: #2cb870;
    --green-dim: rgba(61,220,132,0.12);
    --green-glow: rgba(61,220,132,0.25);
    --text: #e6edf3;
    --text2: #8b949e;
    --text3: #6e7681;
    --red: #ff7b7b;
    --red-bg: rgba(255,123,123,0.12);
    --yellow: #ffd060;
    --r: 14px;
    --r2: 20px;
  }

  .app {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Nunito', sans-serif;
  }

  /* HEADER */
  .hdr {
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
    padding: 14px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .logo {
    font-family: 'Fredoka One', cursive;
    font-size: 1.55rem;
    color: var(--green);
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: 0.5px;
  }
  .logo-dot { color: var(--text); }
  .logo-badge {
    font-family: 'Nunito', sans-serif;
    font-size: 0.72rem;
    font-weight: 800;
    background: var(--green-dim);
    color: var(--green);
    border: 1px solid rgba(61,220,132,0.3);
    padding: 4px 11px;
    border-radius: 100px;
    letter-spacing: 0.04em;
  }

  /* HOME */
  .home-wrap {
    max-width: 720px;
    margin: 0 auto;
    padding: 36px 18px 100px;
  }
  .hero {
    text-align: center;
    margin-bottom: 32px;
  }
  .hero h1 {
    font-family: 'Fredoka One', cursive;
    font-size: clamp(2rem, 5vw, 3rem);
    line-height: 1.1;
    margin-bottom: 10px;
    letter-spacing: 0.5px;
  }
  .hero h1 em { color: var(--green); font-style: normal; }
  .hero p { color: var(--text2); font-size: 1rem; line-height: 1.65; max-width: 460px; margin: 0 auto; font-weight: 600; }

  /* CARD */
  .card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--r2);
    padding: 22px;
    margin-bottom: 16px;
  }
  .card-title {
    font-weight: 800;
    font-size: 0.92rem;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text);
  }
  .card-title-icon {
    width: 26px; height: 26px;
    background: var(--green-dim);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.82rem;
  }

  .tip {
    background: var(--green-dim);
    border: 1px solid rgba(61,220,132,0.2);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 0.82rem;
    color: var(--text2);
    margin-bottom: 13px;
    display: flex;
    gap: 8px;
    line-height: 1.5;
    font-weight: 600;
  }

  textarea {
    width: 100%;
    min-height: 140px;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px;
    font-family: 'Nunito', sans-serif;
    font-size: 0.93rem;
    color: var(--text);
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;
    line-height: 1.6;
    font-weight: 600;
  }
  textarea:focus { border-color: var(--green); }
  textarea::placeholder { color: var(--text3); }
  .char-ct { text-align: right; font-size: 0.76rem; color: var(--text3); margin-top: 5px; font-weight: 700; }

  /* MODE SELECTOR */
  .mode-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }
  @media(max-width:460px) { .mode-grid { grid-template-columns: 1fr; } }

  .mode-opt {
    background: var(--bg2);
    border: 2px solid var(--border);
    border-radius: var(--r2);
    padding: 18px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    text-align: left;
  }
  .mode-opt:hover { border-color: rgba(61,220,132,0.4); background: var(--bg3); }
  .mode-opt.active { border-color: var(--green); background: var(--green-dim); box-shadow: 0 0 0 3px var(--green-glow); }
  .mode-opt .mo-icon { font-size: 1.6rem; margin-bottom: 7px; }
  .mode-opt .mo-name { font-family: 'Fredoka One', cursive; font-size: 1.05rem; color: var(--text); letter-spacing: 0.3px; }
  .mode-opt .mo-desc { font-size: 0.79rem; color: var(--text2); margin-top: 3px; font-weight: 600; line-height: 1.4; }
  .mode-opt .mo-chk {
    position: absolute; top: 11px; right: 11px;
    width: 20px; height: 20px;
    background: var(--green);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #0d1117;
    font-size: 0.65rem;
    font-weight: 900;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .mode-opt.active .mo-chk { opacity: 1; }

  /* COUNT */
  .cnt-row {
    display: flex;
    align-items: center;
    gap: 11px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .cnt-lbl { font-weight: 800; font-size: 0.9rem; color: var(--text2); flex-shrink: 0; }
  .chips { display: flex; gap: 7px; flex-wrap: wrap; }
  .chip {
    padding: 6px 15px;
    border: 2px solid var(--border);
    border-radius: 100px;
    font-size: 0.85rem;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.18s;
    background: transparent;
    color: var(--text2);
    font-family: 'Nunito', sans-serif;
  }
  .chip:hover { border-color: var(--green); color: var(--green); }
  .chip.active { background: var(--green); border-color: var(--green); color: #0d1117; }

  /* GEN BUTTON */
  .btn-gen {
    width: 100%;
    padding: 15px;
    background: var(--green);
    color: #0d1117;
    border: none;
    border-radius: 14px;
    font-family: 'Fredoka One', cursive;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    letter-spacing: 0.4px;
  }
  .btn-gen:hover:not(:disabled) { background: var(--green2); transform: translateY(-1px); box-shadow: 0 6px 24px var(--green-glow); }
  .btn-gen:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .spin {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(0,0,0,0.2);
    border-top-color: #0d1117;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .err-box {
    background: var(--red-bg);
    border: 1px solid rgba(255,123,123,0.3);
    border-radius: 11px;
    padding: 13px 17px;
    color: var(--red);
    font-size: 0.87rem;
    margin-top: 13px;
    font-weight: 700;
    line-height: 1.5;
  }

  .loading-wrap {
    text-align: center;
    padding: 36px 20px;
  }
  .loading-emoji { font-size: 2rem; animation: bob 0.8s ease-in-out infinite alternate; display: block; }
  @keyframes bob { from{transform:translateY(0)} to{transform:translateY(-8px)} }
  .loading-title { font-family: 'Fredoka One', cursive; font-size: 1.15rem; color: var(--green); margin-top: 14px; letter-spacing: 0.3px; }
  .loading-sub { font-size: 0.86rem; color: var(--text2); margin-top: 5px; font-weight: 600; }

  /* MODE HEADER */
  .mode-hdr {
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
    padding: 13px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .mode-hdr-l { display: flex; align-items: center; gap: 10px; }
  .btn-back {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 9px;
    padding: 7px 13px;
    font-family: 'Nunito', sans-serif;
    font-size: 0.84rem;
    font-weight: 800;
    color: var(--text2);
    cursor: pointer;
    transition: all 0.18s;
  }
  .btn-back:hover { border-color: var(--green); color: var(--green); }
  .mode-name-hdr { font-family: 'Fredoka One', cursive; font-size: 1.05rem; color: var(--text); letter-spacing: 0.3px; }
  .prog-text { font-size: 0.84rem; color: var(--text2); font-weight: 800; }

  .prog-bar { height: 3px; background: var(--bg3); }
  .prog-fill { height: 100%; background: linear-gradient(90deg, var(--green), #6ee7b7); transition: width 0.4s ease; }

  /* FLASHCARD */
  .fc-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px 16px; gap: 22px; }
  .fc-scene { width: 100%; max-width: 500px; height: 275px; perspective: 1200px; cursor: pointer; user-select: none; }
  @media(max-width:460px) { .fc-scene { height: 215px; } }
  .fc-inner { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 0.52s cubic-bezier(.4,0,.2,1); }
  .fc-inner.flipped { transform: rotateY(180deg); }
  .fc-face {
    position: absolute; width: 100%; height: 100%;
    backface-visibility: hidden;
    border-radius: 20px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 28px; text-align: center;
    border: 1px solid var(--border);
  }
  .fc-front { background: var(--bg2); box-shadow: 0 8px 40px rgba(0,0,0,0.4); }
  .fc-back { background: var(--bg3); border-color: rgba(61,220,132,0.3); transform: rotateY(180deg); box-shadow: 0 8px 40px rgba(61,220,132,0.1); }
  .face-lbl { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text3); margin-bottom: 13px; }
  .face-lbl.ans { color: var(--green); }
  .fc-q { font-family: 'Fredoka One', cursive; font-size: 1.15rem; line-height: 1.45; color: var(--text); letter-spacing: 0.3px; }
  .fc-a { font-size: 0.97rem; font-weight: 600; line-height: 1.6; color: var(--text2); }
  .tap-hint { font-size: 0.77rem; color: var(--text3); margin-top: 14px; font-weight: 700; }

  .fc-result-row { display: flex; gap: 11px; justify-content: center; flex-wrap: wrap; }
  .btn-know { padding: 10px 20px; background: rgba(61,220,132,0.15); border: 2px solid rgba(61,220,132,0.4); border-radius: 100px; color: var(--green); font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: all 0.18s; }
  .btn-know:hover { background: rgba(61,220,132,0.25); }
  .btn-miss { padding: 10px 20px; background: var(--red-bg); border: 2px solid rgba(255,123,123,0.35); border-radius: 100px; color: var(--red); font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: all 0.18s; }
  .btn-miss:hover { background: rgba(255,123,123,0.2); }

  .fc-nav { display: flex; align-items: center; gap: 11px; flex-wrap: wrap; justify-content: center; }
  .fcb { padding: 10px 20px; border: 2px solid var(--border); border-radius: 100px; background: transparent; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.88rem; cursor: pointer; color: var(--text2); transition: all 0.18s; }
  .fcb:hover:not(:disabled) { border-color: var(--green); color: var(--green); }
  .fcb.prim { background: var(--green); border-color: var(--green); color: #0d1117; font-family: 'Fredoka One', cursive; font-size: 0.95rem; }
  .fcb.prim:hover { background: var(--green2); border-color: var(--green2); }
  .fcb:disabled { opacity: 0.3; cursor: not-allowed; }

  /* FC SUMMARY */
  .fc-summary { text-align: center; padding: 40px 20px; }
  .fc-summary h2 { font-family: 'Fredoka One', cursive; font-size: 1.7rem; color: var(--text); margin-bottom: 8px; letter-spacing: 0.4px; }
  .sum-stats { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin: 20px 0; }
  .stat-pill { padding: 14px 22px; border-radius: 14px; font-weight: 800; }
  .stat-pill.g { background: var(--green-dim); color: var(--green); border: 1px solid rgba(61,220,132,0.3); }
  .stat-pill.r { background: var(--red-bg); color: var(--red); border: 1px solid rgba(255,123,123,0.3); }
  .stat-num { font-family: 'Fredoka One', cursive; font-size: 1.7rem; display: block; letter-spacing: 0.3px; }
  .stat-lbl { font-size: 0.77rem; opacity: 0.8; }
  .sum-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 4px; }

  /* QUIZ */
  .q-timer-row { display: flex; justify-content: center; padding: 16px 16px 0; }
  .timer {
    display: flex; align-items: center; gap: 7px;
    background: var(--bg2); border: 2px solid var(--border);
    border-radius: 100px; padding: 7px 18px;
    font-family: 'Fredoka One', cursive; font-size: 1rem;
    color: var(--text); transition: all 0.25s; letter-spacing: 0.3px;
  }
  .timer.urg { border-color: rgba(255,123,123,0.5); background: var(--red-bg); color: var(--red); animation: shk 0.3s ease; }
  @keyframes shk { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }

  .quiz-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 18px 16px 36px; gap: 15px; max-width: 580px; margin: 0 auto; width: 100%; }
  .q-card { width: 100%; background: var(--bg2); border: 1px solid var(--border); border-radius: 18px; padding: 22px; }
  .q-num { font-size: 0.73rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.09em; color: var(--green); margin-bottom: 9px; display: flex; align-items: center; gap: 5px; }
  .q-text { font-family: 'Fredoka One', cursive; font-size: 1.08rem; line-height: 1.5; color: var(--text); letter-spacing: 0.3px; }

  .opts { width: 100%; display: flex; flex-direction: column; gap: 8px; }
  .opt {
    width: 100%; padding: 13px 17px;
    border: 2px solid var(--border);
    border-radius: 12px; background: var(--bg2);
    font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 700;
    color: var(--text2); text-align: left; cursor: pointer;
    transition: all 0.18s; display: flex; align-items: center; gap: 10px; line-height: 1.4;
  }
  .opt:hover:not(:disabled) { border-color: rgba(61,220,132,0.4); background: var(--bg3); color: var(--text); }
  .opt-l { width: 25px; height: 25px; flex-shrink: 0; border-radius: 7px; background: var(--bg3); color: var(--text2); font-weight: 900; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; transition: all 0.18s; font-family: 'Fredoka One', cursive; }
  .opt:hover:not(:disabled) .opt-l { background: var(--green-dim); color: var(--green); }
  .opt.correct { border-color: rgba(61,220,132,0.5); background: var(--green-dim); color: var(--green); }
  .opt.correct .opt-l { background: var(--green); color: #0d1117; }
  .opt.wrong { border-color: rgba(255,123,123,0.4); background: var(--red-bg); color: var(--red); }
  .opt.wrong .opt-l { background: var(--red); color: #fff; }
  .opt.reveal { border-color: rgba(61,220,132,0.3); background: rgba(61,220,132,0.06); }
  .opt:disabled { cursor: default; }

  .exp-box { display: flex; gap: 9px; background: var(--bg3); border: 1px solid rgba(61,220,132,0.2); border-radius: 12px; padding: 13px 16px; width: 100%; animation: fu 0.3s ease; }
  @keyframes fu { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .exp-lbl { font-size: 0.73rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: var(--green); margin-bottom: 5px; }
  .exp-t { font-size: 0.88rem; color: var(--text2); line-height: 1.55; font-weight: 600; }

  .q-nav { display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 11px; }
  .score-badge { font-family: 'Fredoka One', cursive; font-size: 0.9rem; color: var(--green); background: var(--green-dim); padding: 7px 14px; border-radius: 100px; border: 1px solid rgba(61,220,132,0.25); letter-spacing: 0.3px; }
  .btn-next { padding: 12px 24px; background: var(--green); color: #0d1117; border: none; border-radius: 11px; font-family: 'Fredoka One', cursive; font-size: 0.98rem; cursor: pointer; transition: all 0.2s; letter-spacing: 0.3px; }
  .btn-next:hover:not(:disabled) { background: var(--green2); transform: translateY(-1px); }
  .btn-next:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

  /* QUIZ RESULTS */
  .qz-res { width: 100%; max-width: 500px; margin: 0 auto; padding: 34px 16px; text-align: center; }
  .score-ring { width: 128px; height: 128px; border-radius: 50%; border: 5px solid var(--green); margin: 0 auto 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 0 10px var(--green-dim), 0 0 40px var(--green-glow); }
  .ring-n { font-family: 'Fredoka One', cursive; font-size: 2.1rem; color: var(--green); letter-spacing: 0.5px; }
  .ring-d { font-size: 0.8rem; color: var(--text2); font-weight: 800; }
  .res-grade { font-family: 'Fredoka One', cursive; font-size: 1.5rem; color: var(--text); margin-bottom: 6px; letter-spacing: 0.4px; }
  .res-sub { color: var(--text2); margin-bottom: 22px; font-size: 0.91rem; font-weight: 700; }
  .res-bd { text-align: left; border: 1px solid var(--border); border-radius: 13px; overflow: hidden; margin-bottom: 20px; max-height: 260px; overflow-y: auto; background: var(--bg2); }
  .bd-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 17px; border-bottom: 1px solid var(--border); }
  .bd-item:last-child { border-bottom: none; }
  .bd-q { flex: 1; margin-right: 11px; color: var(--text2); line-height: 1.4; font-size: 0.85rem; font-weight: 700; }
  .res-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
  .btn-act { padding: 11px 22px; border-radius: 11px; border: 2px solid var(--border); background: transparent; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; color: var(--text2); }
  .btn-act:hover { border-color: var(--green); color: var(--green); }
  .btn-act.prim { background: var(--green); border-color: var(--green); color: #0d1117; font-family: 'Fredoka One', cursive; font-size: 0.96rem; }
  .btn-act.prim:hover { background: var(--green2); border-color: var(--green2); }

  footer { text-align: center; padding: 16px; color: var(--text3); font-size: 0.78rem; border-top: 1px solid var(--border); background: var(--bg2); position: fixed; bottom: 0; left: 0; right: 0; z-index: 10; font-weight: 700; }
  footer span { color: var(--green); }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  @keyframes si { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .ai { animation: si 0.4s ease both; }
  .d1{animation-delay:.05s}.d2{animation-delay:.1s}.d3{animation-delay:.15s}.d4{animation-delay:.2s}
`;

// ── SCREENS ──
const SCREEN = { HOME: "home", FC: "flashcard", QUIZ: "quiz" };

export default function StudySnap() {
  const [screen, setScreen] = useState(SCREEN.HOME);
  const [mode, setMode] = useState("flashcard");
  const [count, setCount] = useState(5);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Flashcard state
  const [flashcards, setFlashcards] = useState([]);
  const [fcIdx, setFcIdx] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);
  const [fcKnown, setFcKnown] = useState(0);
  const [fcUnknown, setFcUnknown] = useState(0);
  const [fcDone, setFcDone] = useState(false);

  // Quiz state
  const [quizQs, setQuizQs] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [qScore, setQScore] = useState(0);
  const [qAnswered, setQAnswered] = useState(false);
  const [qSelected, setQSelected] = useState(null);
  const [qLog, setQLog] = useState([]);
  const [qDone, setQDone] = useState(false);
  const [timer, setTimer] = useState(30);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef(null);

  const TIMER_SECS = 30;

  // Timer effect
  useEffect(() => {
    if (screen !== SCREEN.QUIZ || qDone || qAnswered) return;
    setTimer(TIMER_SECS);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setTimedOut(true);
          setQAnswered(true);
          setQLog(prev => {
            const q = quizQs[qIdx];
            return [...prev, { q: q.question, ok: false, a: "⏰ Timed out", r: q.options[q.correct] }];
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [qIdx, screen, qDone]);

  async function handleGenerate() {
    if (inputText.trim().length < 40) {
      setError("Please enter at least 40 characters of study material.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (mode === "flashcard") {
        const data = await callClaude(
          `You are a study tool. Return ONLY a valid JSON array, no markdown, no explanation, no code fences. Each item must have exactly: {"question":"...","answer":"..."}. Generate exactly ${count} items.`,
          `Generate ${count} flashcards from this text:\n\n${inputText.trim()}`
        );
        setFlashcards(data);
        setFcIdx(0); setFcFlipped(false); setFcKnown(0); setFcUnknown(0); setFcDone(false);
        setScreen(SCREEN.FC);
      } else {
        const data = await callClaude(
          `You are a study tool. Return ONLY a valid JSON array, no markdown, no explanation. Each item: {"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}. "correct" is 0-indexed integer. Generate exactly ${count} items.`,
          `Generate ${count} multiple-choice quiz questions from this text:\n\n${inputText.trim()}`
        );
        setQuizQs(data);
        setQIdx(0); setQScore(0); setQAnswered(false); setQSelected(null); setQLog([]); setQDone(false); setTimedOut(false);
        setScreen(SCREEN.QUIZ);
      }
    } catch (e) {
      setError("Generation failed. Please try again. (" + e.message + ")");
    }
    setLoading(false);
  }

  function goHome() {
    clearInterval(timerRef.current);
    setScreen(SCREEN.HOME);
  }

  // ── FLASHCARD HANDLERS ──
  function doFlip() { setFcFlipped(f => !f); }
  function markCard(knew) {
    if (knew) setFcKnown(k => k + 1);
    else setFcUnknown(u => u + 1);
    goNextFC();
  }
  function goNextFC() {
    if (fcIdx + 1 >= flashcards.length) { setFcDone(true); return; }
    setFcIdx(i => i + 1);
    setFcFlipped(false);
  }
  function goPrevFC() { if (fcIdx > 0) { setFcIdx(i => i - 1); setFcFlipped(false); } }
  function restartFC() { setFcIdx(0); setFcFlipped(false); setFcKnown(0); setFcUnknown(0); setFcDone(false); }

  // ── QUIZ HANDLERS ──
  function selectAnswer(idx) {
    if (qAnswered) return;
    clearInterval(timerRef.current);
    setQAnswered(true);
    setQSelected(idx);
    const q = quizQs[qIdx];
    const ok = idx === q.correct;
    if (ok) setQScore(s => s + 1);
    setQLog(prev => [...prev, { q: q.question, ok, a: q.options[idx], r: q.options[q.correct] }]);
  }
  function goNextQ() {
    if (qIdx + 1 >= quizQs.length) { setQDone(true); return; }
    setQIdx(i => i + 1);
    setQAnswered(false);
    setQSelected(null);
    setTimedOut(false);
  }
  function restartQuiz() { setQIdx(0); setQScore(0); setQAnswered(false); setQSelected(null); setQLog([]); setQDone(false); setTimedOut(false); }

  // ── GRADE ──
  function getGrade(score, total) {
    const p = score / total * 100;
    if (p === 100) return { g: "🏆 Perfect!", s: "Absolutely flawless. You're a legend!" };
    if (p >= 80) return { g: "🎉 Excellent!", s: "You really know your stuff." };
    if (p >= 60) return { g: "👍 Good Work!", s: "Solid — review the ones you missed." };
    if (p >= 40) return { g: "📚 Keep Going!", s: "You're getting there — more practice!" };
    return { g: "💪 Don't Give Up!", s: "Review your notes and try again!" };
  }

  const LETTERS = ["A", "B", "C", "D"];

  // ── RENDER ──
  return (
    <>
      <style>{FONTS}{css}</style>

      {/* ── HOME ── */}
      {screen === SCREEN.HOME && (
        <div className="app">
          <header className="hdr">
            <div className="logo">⚡ StudySnap<span className="logo-dot">.</span></div>
            <div className="logo-badge">AI-Powered ✦</div>
          </header>
          <div className="home-wrap">
            <div className="hero ai">
              <h1>Turn any text into<br /><em>instant</em> study tools</h1>
              <p>Paste your notes — StudySnap generates flashcards & quizzes with AI in seconds.</p>
            </div>

            <div className="card ai d1">
              <div className="card-title"><div className="card-title-icon">📄</div>Your Study Material</div>
              <div className="tip"><span>💡</span><span>Works best with textbook excerpts, lecture notes, or any factual content. More detail = better cards!</span></div>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={"Paste your paragraph or notes here...\n\nExample: The mitochondria is the powerhouse of the cell. It produces ATP through cellular respiration..."}
                maxLength={6000}
              />
              <div className="char-ct">{inputText.length} / 6000</div>
            </div>

            <div className="mode-grid ai d2">
              {[
                { id: "flashcard", icon: "🃏", name: "Flashcards", desc: "Flip Q&A cards, mark what you know" },
                { id: "quiz", icon: "🧠", name: "Quiz", desc: "Timed MCQ with scoring & explanations" },
              ].map(m => (
                <div key={m.id} className={`mode-opt${mode === m.id ? " active" : ""}`} onClick={() => setMode(m.id)}>
                  <div className="mo-chk">✓</div>
                  <div className="mo-icon">{m.icon}</div>
                  <div className="mo-name">{m.name}</div>
                  <div className="mo-desc">{m.desc}</div>
                </div>
              ))}
            </div>

            <div className="cnt-row ai d3">
              <div className="cnt-lbl">How many?</div>
              <div className="chips">
                {[3, 5, 8, 10, 15].map(n => (
                  <div key={n} className={`chip${count === n ? " active" : ""}`} onClick={() => setCount(n)}>{n}</div>
                ))}
              </div>
            </div>

            <button className="btn-gen ai d4" onClick={handleGenerate} disabled={loading}>
              {loading ? <><div className="spin" />Generating...</> : "⚡ Generate Study Content"}
            </button>

            {error && <div className="err-box">⚠️ {error}</div>}

            {loading && (
              <div className="loading-wrap">
                <span className="loading-emoji">🟢</span>
                <div className="loading-title">StudySnap is thinking...</div>
                <div className="loading-sub">Generating your personalized study content with AI</div>
              </div>
            )}
          </div>
          <footer>Made with <span>♥</span> for students · StudySnap 2025</footer>
        </div>
      )}

      {/* ── FLASHCARD MODE ── */}
      {screen === SCREEN.FC && flashcards.length > 0 && (
        <div className="app" style={{ display: "flex", flexDirection: "column" }}>
          <div className="mode-hdr">
            <div className="mode-hdr-l">
              <button className="btn-back" onClick={goHome}>← Back</button>
              <div className="mode-name-hdr">🃏 Flashcards</div>
            </div>
            <div className="prog-text">{fcDone ? flashcards.length : fcIdx + 1} / {flashcards.length}</div>
          </div>
          <div className="prog-bar"><div className="prog-fill" style={{ width: `${fcDone ? 100 : (fcIdx / flashcards.length) * 100}%` }} /></div>

          {!fcDone ? (
            <div className="fc-wrap">
              <div className="fc-scene" onClick={doFlip}>
                <div className={`fc-inner${fcFlipped ? " flipped" : ""}`}>
                  <div className="fc-face fc-front">
                    <div className="face-lbl">Question</div>
                    <div className="fc-q">{flashcards[fcIdx]?.question}</div>
                    <div className="tap-hint">👆 Tap to reveal answer</div>
                  </div>
                  <div className="fc-face fc-back">
                    <div className="face-lbl ans">Answer</div>
                    <div className="fc-a">{flashcards[fcIdx]?.answer}</div>
                  </div>
                </div>
              </div>

              {fcFlipped && (
                <div className="fc-result-row">
                  <button className="btn-know" onClick={() => markCard(true)}>✓ Got it!</button>
                  <button className="btn-miss" onClick={() => markCard(false)}>✗ Still learning</button>
                </div>
              )}

              <div className="fc-nav">
                <button className="fcb" onClick={goPrevFC} disabled={fcIdx === 0}>← Prev</button>
                <button className="fcb prim" onClick={doFlip}>{fcFlipped ? "Flip Back" : "Flip Card"}</button>
                <button className="fcb" onClick={goNextFC} disabled={fcIdx === flashcards.length - 1}>Next →</button>
              </div>
            </div>
          ) : (
            <div className="fc-summary">
              <div style={{ fontSize: "2.8rem", marginBottom: "13px" }}>🎉</div>
              <h2>Session Complete!</h2>
              <p style={{ color: "var(--text2)", marginBottom: "4px", fontWeight: 700 }}>Here's your breakdown:</p>
              <div className="sum-stats">
                <div className="stat-pill g"><span className="stat-num">{fcKnown}</span><span className="stat-lbl">Got it ✓</span></div>
                <div className="stat-pill r"><span className="stat-num">{fcUnknown}</span><span className="stat-lbl">Still learning</span></div>
              </div>
              <div className="sum-actions">
                <button className="btn-act prim" onClick={restartFC}>🔄 Study Again</button>
                <button className="btn-act" onClick={goHome}>← New Text</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── QUIZ MODE ── */}
      {screen === SCREEN.QUIZ && quizQs.length > 0 && (() => {
        const q = quizQs[qIdx];
        const { g, s } = getGrade(qScore, quizQs.length);
        return (
          <div className="app" style={{ display: "flex", flexDirection: "column" }}>
            <div className="mode-hdr">
              <div className="mode-hdr-l">
                <button className="btn-back" onClick={goHome}>← Back</button>
                <div className="mode-name-hdr">🧠 Quiz</div>
              </div>
              <div className="prog-text">{qDone ? quizQs.length : qIdx + 1} / {quizQs.length}</div>
            </div>
            <div className="prog-bar"><div className="prog-fill" style={{ width: `${qDone ? 100 : (qIdx / quizQs.length) * 100}%` }} /></div>

            {!qDone ? (
              <>
                <div className="q-timer-row">
                  <div className={`timer${timer <= 5 ? " urg" : ""}`}>⏱ {timer}s</div>
                </div>
                <div className="quiz-wrap">
                  <div className="q-card">
                    <div className="q-num"><span>✦</span><span>Question {qIdx + 1}</span></div>
                    <div className="q-text">{q.question}</div>
                  </div>
                  <div className="opts">
                    {q.options.map((opt, i) => {
                      let cls = "opt";
                      if (qAnswered) {
                        if (i === q.correct) cls += " correct";
                        else if (i === qSelected && i !== q.correct) cls += " wrong";
                        else if (i !== q.correct && i !== qSelected) cls += " reveal";
                      }
                      return (
                        <button key={i} className={cls} onClick={() => selectAnswer(i)} disabled={qAnswered}>
                          <span className="opt-l">{LETTERS[i]}</span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                  {qAnswered && q.explanation && (
                    <div className="exp-box">
                      <div>
                        <div className="exp-lbl">💡 Explanation</div>
                        <div className="exp-t">{timedOut ? "⏰ Time ran out! " : ""}{q.explanation}</div>
                      </div>
                    </div>
                  )}
                  <div className="q-nav">
                    <div className="score-badge">Score: {qScore}</div>
                    <button className="btn-next" onClick={goNextQ} disabled={!qAnswered}>
                      {qIdx < quizQs.length - 1 ? "Next →" : "Finish →"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="qz-res">
                <div className="score-ring">
                  <span className="ring-n">{qScore}</span>
                  <span className="ring-d">/ {quizQs.length}</span>
                </div>
                <div className="res-grade">{g}</div>
                <div className="res-sub">{s}</div>
                <div className="res-bd">
                  {qLog.map((l, i) => (
                    <div key={i} className="bd-item">
                      <div className="bd-q">{l.q}</div>
                      <div>{l.ok ? "✅" : "❌"}</div>
                    </div>
                  ))}
                </div>
                <div className="res-actions">
                  <button className="btn-act prim" onClick={restartQuiz}>🔄 Retry Quiz</button>
                  <button className="btn-act" onClick={goHome}>← New Text</button>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </>
  );
}
