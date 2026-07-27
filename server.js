// EmbedGuessr × Kuaishou — backend
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "";

const DATA = path.join(__dirname, "data");
const UPLOADS = path.join(DATA, "uploads");
const SCORES_FILE = path.join(DATA, "scores.json");
const RUNS_FILE = path.join(DATA, "runs.json");
const PLATES_FILE = path.join(DATA, "plates.json");
const QUESTIONS_FILE = path.join(DATA, "questions.json");
fs.mkdirSync(UPLOADS, { recursive: true });

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}
function writeJSON(file, obj) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, file);
}

// Seed on first boot
if (!fs.existsSync(PLATES_FILE)) {
  const seed = require("./seed-plates.js");
  writeJSON(PLATES_FILE, seed);
}
if (!fs.existsSync(QUESTIONS_FILE)) {
  const seed = require("./seed-questions.js");
  writeJSON(QUESTIONS_FILE, seed);
}
if (!fs.existsSync(SCORES_FILE)) writeJSON(SCORES_FILE, []);
if (!fs.existsSync(RUNS_FILE)) writeJSON(RUNS_FILE, []);

app.use(express.json({ limit: "1mb" }));
app.use("/assets", express.static(path.join(__dirname, "public", "assets"), { maxAge: "7d" }));
app.use("/uploads", express.static(UPLOADS, { maxAge: "1d" }));

function requireAdmin(req, res, next) {
  if (!ADMIN_KEY) return next();
  if (req.get("x-admin-key") === ADMIN_KEY) return next();
  res.status(401).json({ error: "admin key required" });
}

const storage = multer.diskStorage({
  destination: (_r, _f, cb) => cb(null, UPLOADS),
  filename: (_r, file, cb) => {
    const ext = (path.extname(file.originalname) || ".png").toLowerCase().replace(/[^.a-z0-9]/g, "");
    cb(null, crypto.randomBytes(8).toString("hex") + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_r, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

app.post("/api/upload", requireAdmin, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "no image" });
  res.json({ url: "/uploads/" + req.file.filename });
});

// Legacy plates API (still supported for Studio)
app.get("/api/plates", (_req, res) => res.json(readJSON(PLATES_FILE, [])));
app.put("/api/plates", requireAdmin, (req, res) => {
  const plates = req.body && req.body.plates;
  if (!Array.isArray(plates)) return res.status(400).json({ error: "plates must be an array" });
  writeJSON(PLATES_FILE, plates);
  res.json({ ok: true, count: plates.length });
});

// Questions API — always prepends 3 tutorial questions, then shuffled regular questions
// GET /api/questions?count=10   (3 tutorial + 7 random)
// GET /api/questions            (all)
app.get("/api/questions", (req, res) => {
  const qs = readJSON(QUESTIONS_FILE, []);
  const { count, mode } = req.query;
  const isTutorial = q => q.tutorial === true || String(q.id || "").startsWith("tutorial-");
  const tutorials = qs.filter(isTutorial);
  const regular = qs.filter(q => !isTutorial(q));
  // Demo/tutorial mode: ONLY the three demo questions, in fixed easy→medium→hard order.
  if (mode === "demo" || mode === "tutorial") return res.json(tutorials);
  // Main game: 1 easy, then 2 medium, then 2 hard — a fresh random sample from each
  // difficulty bucket every run, so the same questions don't keep recurring.
  const shuf = a => a.slice().sort(() => Math.random() - 0.5);
  const byDiff = d => regular.filter(q => q.difficulty === d);
  const composition = [["easy", 1], ["medium", 2], ["hard", 2]];
  const usedIds = new Set();
  let sel = [];
  for (const [diff, k] of composition) {
    const picked = shuf(byDiff(diff)).slice(0, k);
    picked.forEach(q => usedIds.add(q.id));
    sel = sel.concat(picked);
  }
  // Backfill if a difficulty bucket is too small, to keep the run length stable.
  const target = count ? (parseInt(count, 10) || 5) : 5;
  if (sel.length < target) {
    sel = sel.concat(shuf(regular.filter(q => !usedIds.has(q.id))).slice(0, target - sel.length));
  }
  res.json(sel);
});

app.put("/api/questions", requireAdmin, (req, res) => {
  const questions = req.body && req.body.questions;
  if (!Array.isArray(questions)) return res.status(400).json({ error: "questions must be an array" });
  writeJSON(QUESTIONS_FILE, questions);
  res.json({ ok: true, count: questions.length });
});

// Leaderboard
app.get("/api/leaderboard", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  const difficulty = req.query.difficulty;
  let rows = readJSON(SCORES_FILE, []);
  if (difficulty) rows = rows.filter(r => r.difficulty === difficulty);
  rows.sort((a, b) => b.score - a.score);
  res.json(rows.slice(0, limit));
});

app.post("/api/score", (req, res) => {
  const b = req.body || {};
  const name = String(b.name || "anonymous").trim().slice(0, 18) || "anonymous";
  const score = Math.max(0, Math.min(1e7, parseInt(b.score, 10) || 0));
  const entry = {
    id: crypto.randomBytes(6).toString("hex"),
    name,
    score,
    difficulty: ["easy","medium","hard","mixed"].includes(b.difficulty) ? b.difficulty : "mixed",
    plates: Array.isArray(b.plates) ? b.plates.slice(0, 20) : [],
    ts: Date.now(),
  };
  const rows = readJSON(SCORES_FILE, []);
  rows.push(entry);
  rows.sort((a, b) => b.score - a.score);
  writeJSON(SCORES_FILE, rows.slice(0, 500));
  const rank = rows.findIndex(r => r.id === entry.id) + 1;
  res.json({ ok: true, id: entry.id, rank });
});

// Per-question run tracking
// POST /api/run/start  { name, totalQuestions:10 } → { runId }
// POST /api/run/question  { runId, questionIndex, questionId, score, distance }
// GET  /api/run/ranking?questionIndex=3&questionId=banana-weather&score=850 → { rank, total, percentile }

app.post("/api/run/start", (req, res) => {
  const b = req.body || {};
  const name = String(b.name || "anonymous").trim().slice(0, 18) || "anonymous";
  const runId = crypto.randomBytes(6).toString("hex");
  const entry = {
    runId,
    name,
    totalQuestions: parseInt(b.totalQuestions, 10) || 10,
    scores: [],    // [{ questionIndex, questionId, score, distance }]
    ts: Date.now(),
  };
  const runs = readJSON(RUNS_FILE, []);
  runs.push(entry);
  writeJSON(RUNS_FILE, runs.slice(0, 2000));
  res.json({ ok: true, runId });
});

app.post("/api/run/question", (req, res) => {
  const b = req.body || {};
  const { runId, questionIndex, questionId, score, distance } = b;
  if (!runId) return res.status(400).json({ error: "runId required" });
  const runs = readJSON(RUNS_FILE, []);
  const run = runs.find(r => r.runId === runId);
  if (!run) return res.status(404).json({ error: "run not found" });
  run.scores.push({
    questionIndex: parseInt(questionIndex, 10) || 0,
    questionId: String(questionId || ""),
    score: parseInt(score, 10) || 0,
    distance: parseFloat(distance) || 0,
  });
  writeJSON(RUNS_FILE, runs);
  // Compute ranking for this question
  const qi = run.scores[run.scores.length - 1].questionIndex;
  const allForQ = [];
  runs.forEach(r => {
    const s = r.scores.find(x => x.questionIndex === qi);
    if (s) allForQ.push({ name: r.name, score: s.score, distance: s.distance });
  });
  allForQ.sort((a, b) => b.score - a.score);
  const myScore = run.scores[run.scores.length - 1].score;
  const rank = allForQ.filter(x => x.score > myScore).length + 1;
  res.json({ ok: true, rank, total: allForQ.length, percentile: Math.round(100 * (1 - (rank - 1) / Math.max(1, allForQ.length))) });
});

app.get("/api/run/ranking", (req, res) => {
  const { questionIndex, score } = req.query;
  const qi = parseInt(questionIndex, 10);
  const sc = parseInt(score, 10) || 0;
  const runs = readJSON(RUNS_FILE, []);
  const allForQ = [];
  runs.forEach(r => {
    const s = r.scores.find(x => x.questionIndex === qi);
    if (s) allForQ.push({ name: r.name, score: s.score, distance: s.distance });
  });
  allForQ.sort((a, b) => b.score - a.score);
  const rank = allForQ.filter(x => x.score > sc).length + 1;
  res.json({ rank, total: allForQ.length, percentile: Math.round(100 * (1 - (rank - 1) / Math.max(1, allForQ.length))), top5: allForQ.slice(0, 5) });
});

app.use(express.static(path.join(__dirname, "public")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`EmbedGuessr running on http://localhost:${PORT}`));
