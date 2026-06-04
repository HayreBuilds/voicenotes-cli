#!/usr/bin/env node
import * as readline from "readline";
import * as path from "path";
import { getRecorder, startRecording, getTempWavPath, cleanupWav, getRecordingDuration } from "./recorder.js";
import { transcribeAudio, generateMetadata } from "./transcriber.js";
import { saveNote, searchNotes, loadIndex, deleteNote, getNotesDir } from "./storage.js";

const VERSION = "1.0.0";
const HELP = `
vnote v${VERSION} — Terminal voice notes with AI transcription

Usage:
  vnote                    Record a new voice note (press ENTER to stop)
  vnote record             Same as above
  vnote list               List all notes
  vnote search <query>     Search notes by title, content, or tag
  vnote open <id>          Print full transcript of a note
  vnote delete <id>        Delete a note
  vnote dir                Print notes directory

Options:
  --api-key <key>          NVIDIA NIM API key (or NVIDIA_API_KEY env var)
  --no-summary             Skip AI summary/tagging (just save raw transcript)
  -v, --version            Print version
  -h, --help               Show help

Environment:
  NVIDIA_API_KEY           Free at https://build.nvidia.com
  VNOTE_DIR                Custom notes directory (default: ~/voice-notes)

Requires: sox, arecord, or ffmpeg for recording

Examples:
  vnote                    Start recording
  vnote list
  vnote search meeting
  vnote search "project alpha"
`;

const R = "\x1b[0m", B = "\x1b[1m", DIM = "\x1b[2m";
const GR = "\x1b[32m", CY = "\x1b[36m", YE = "\x1b[33m", RE = "\x1b[31m", MA = "\x1b[35m";
const c = (col: string, t: string) => process.stdout.isTTY ? `${col}${t}${R}` : t;
const log = (m: string) => process.stdout.write(`  ${c(CY,"→")} ${m}\n`);
const ok  = (m: string) => process.stdout.write(`  ${c(GR,"✔")} ${m}\n`);
const err = (m: string) => process.stdout.write(`  ${c(RE,"✖")} ${m}\n`);
const hi  = (m: string) => process.stdout.write(`  ${c(MA,"◆")} ${m}\n`);

function parseArgs(argv: string[]) {
  const opts = { command: "record", args: [] as string[], apiKey: process.env.NVIDIA_API_KEY ?? "", noSummary: false };
  const nonFlags: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "-h" || a === "--help") { process.stdout.write(HELP); process.exit(0); }
    if (a === "-v" || a === "--version") { process.stdout.write(`vnote v${VERSION}\n`); process.exit(0); }
    if (a === "--no-summary") { opts.noSummary = true; continue; }
    if (a === "--api-key" && argv[i+1]) { opts.apiKey = argv[++i]!; continue; }
    if (!a.startsWith("-")) nonFlags.push(a);
  }
  if (nonFlags.length > 0) {
    const cmd = nonFlags[0]!;
    if (["record","list","search","open","delete","dir"].includes(cmd)) {
      opts.command = cmd;
      opts.args = nonFlags.slice(1);
    } else {
      opts.command = "record";
    }
  }
  return opts;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

async function cmdRecord(apiKey: string, noSummary: boolean) {
  const recorder = getRecorder();
  if (!recorder) {
    err("No recorder found. Install sox, arecord, or ffmpeg:");
    process.stdout.write(`    macOS:  brew install sox\n`);
    process.stdout.write(`    Ubuntu: sudo apt install sox\n`);
    process.exit(1);
  }

  if (!apiKey && !noSummary) {
    err("NVIDIA API key required for transcription. Set NVIDIA_API_KEY or use --api-key");
    process.stdout.write(`  Get your free key: ${c(CY,"https://build.nvidia.com")}\n`);
    process.exit(1);
  }

  process.stdout.write(`\n  ${c(B, c(MA, "◆ vnote"))}\n\n`);
  log(`Recording with ${c(B, recorder)} — press ${c(B, "ENTER")} to stop\n`);

  const wavPath = getTempWavPath();
  const recording = startRecording(wavPath, recorder);

  process.stdout.write(`  ${c(RE, "●")} Recording...  `);

  let dots = 0;
  const ticker = setInterval(() => {
    dots = (dots + 1) % 4;
    process.stdout.write(`\r  ${c(RE, "●")} Recording... ${".".repeat(dots).padEnd(3)}`);
  }, 500);

  await new Promise<void>((resolve) => {
    const rl = readline.createInterface({ input: process.stdin });
    rl.once("line", () => { rl.close(); resolve(); });
    process.stdin.once("data", () => { rl.close(); resolve(); });
  });

  clearInterval(ticker);
  process.stdout.write(`\r\x1b[K`);
  log("Stopping...");

  await recording.stop();
  const duration = getRecordingDuration(wavPath);

  if (duration < 0.5) {
    cleanupWav(wavPath);
    err("Recording too short. Try again.");
    process.exit(1);
  }

  ok(`Recorded ${duration.toFixed(1)}s of audio`);

  if (noSummary) {
    cleanupWav(wavPath);
    ok("Saved (no transcription — --no-summary flag set)");
    return;
  }

  log("Transcribing with NVIDIA Parakeet ASR...");
  let transcript: string;
  try {
    transcript = await transcribeAudio(wavPath, apiKey);
  } finally {
    cleanupWav(wavPath);
  }

  if (!transcript) { err("Transcription returned empty result"); process.exit(1); }
  ok(`Transcript: ${c(DIM, transcript.slice(0, 80))}${transcript.length > 80 ? "..." : ""}`);

  log("Generating title, summary, and tags...");
  const meta = await generateMetadata(transcript, apiKey);
  ok(`Title: ${c(B, meta.title)}`);
  ok(`Tags: ${meta.tags.map(t => c(CY, `#${t}`)).join(" ")}`);

  const note = saveNote(transcript, meta.title, meta.summary, meta.tags, duration);
  process.stdout.write(`\n`);
  hi(`Note saved! ${c(DIM, `ID: ${note.id}`)}`);
  process.stdout.write(`  ${c(DIM, `→ ${getNotesDir()}/${note.file}`)}\n\n`);
}

function cmdList() {
  const notes = loadIndex();
  if (notes.length === 0) { log("No notes yet. Run `vnote` to record your first note."); return; }
  process.stdout.write(`\n  ${c(B, `Voice Notes (${notes.length})`)}  ${c(DIM, getNotesDir())}\n\n`);
  for (const note of notes) {
    process.stdout.write(`  ${c(CY, note.id)}  ${c(B, note.title)}\n`);
    process.stdout.write(`         ${c(DIM, formatDate(note.createdAt))}  ${c(DIM, `${note.duration.toFixed(0)}s`)}  ${note.tags.map(t => c(MA, `#${t}`)).join(" ")}\n`);
    process.stdout.write(`         ${c(DIM, note.summary)}\n\n`);
  }
}

function cmdSearch(query: string) {
  if (!query) { err("Usage: vnote search <query>"); process.exit(1); }
  const results = searchNotes(query);
  if (results.length === 0) { log(`No notes matching "${query}"`); return; }
  process.stdout.write(`\n  ${c(B, `Search: "${query}" — ${results.length} result${results.length !== 1 ? "s" : ""}`)}\n\n`);
  for (const note of results) {
    process.stdout.write(`  ${c(CY, note.id)}  ${c(B, note.title)}\n`);
    process.stdout.write(`         ${c(DIM, formatDate(note.createdAt))}  ${note.tags.map(t => c(MA, `#${t}`)).join(" ")}\n\n`);
  }
}

function cmdOpen(id: string) {
  const notes = loadIndex();
  const note = notes.find(n => n.id === id);
  if (!note) { err(`Note not found: ${id}`); process.exit(1); }
  process.stdout.write(`\n  ${c(B, note.title)}\n`);
  process.stdout.write(`  ${c(DIM, formatDate(note.createdAt))}  ${c(DIM, `${note.duration.toFixed(1)}s`)}  ${note.tags.map(t => c(MA, `#${t}`)).join(" ")}\n\n`);
  process.stdout.write(`  ${c(DIM, note.summary)}\n\n`);
  process.stdout.write(`  ${c(B, "Transcript:")}\n  ${note.transcript}\n\n`);
}

function cmdDelete(id: string) {
  if (!id) { err("Usage: vnote delete <id>"); process.exit(1); }
  const deleted = deleteNote(id);
  if (deleted) ok(`Deleted note ${id}`);
  else err(`Note not found: ${id}`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  switch (opts.command) {
    case "record": await cmdRecord(opts.apiKey, opts.noSummary); break;
    case "list": cmdList(); break;
    case "search": cmdSearch(opts.args.join(" ")); break;
    case "open": cmdOpen(opts.args[0] ?? ""); break;
    case "delete": cmdDelete(opts.args[0] ?? ""); break;
    case "dir": process.stdout.write(getNotesDir() + "\n"); break;
  }
}

main().catch(e => { err((e as Error).message); process.exit(1); });
