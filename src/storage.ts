import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

const NOTES_DIR = process.env.VNOTE_DIR ?? path.join(os.homedir(), "voice-notes");
const INDEX_FILE = path.join(NOTES_DIR, ".index.json");

export interface VoiceNote {
  id: string;
  title: string;
  summary: string;
  transcript: string;
  tags: string[];
  file: string;
  duration: number;
  createdAt: string;
}

export function ensureNotesDir(): void {
  if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true });
}

export function getNotesDir(): string { return NOTES_DIR; }

export function loadIndex(): VoiceNote[] {
  if (!fs.existsSync(INDEX_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8")); } catch { return []; }
}

export function saveIndex(notes: VoiceNote[]): void {
  ensureNotesDir();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(notes, null, 2));
}

export function saveNote(
  transcript: string,
  title: string,
  summary: string,
  tags: string[],
  duration: number
): VoiceNote {
  ensureNotesDir();
  const id = crypto.randomBytes(6).toString("hex");
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0]!;
  const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  const fileName = `${dateStr}-${titleSlug}-${id}.md`;
  const filePath = path.join(NOTES_DIR, fileName);

  const content = `---
id: ${id}
title: "${title}"
date: ${now.toISOString()}
tags: [${tags.map(t => `"${t}"`).join(", ")}]
duration: ${duration.toFixed(1)}s
---

# ${title}

> ${summary}

## Transcript

${transcript}
`;

  fs.writeFileSync(filePath, content, "utf-8");

  const note: VoiceNote = { id, title, summary, transcript, tags, file: fileName, duration, createdAt: now.toISOString() };
  const index = loadIndex();
  index.unshift(note);
  saveIndex(index);

  return note;
}

export function searchNotes(query: string): VoiceNote[] {
  const notes = loadIndex();
  const q = query.toLowerCase();
  return notes.filter(n =>
    n.title.toLowerCase().includes(q) ||
    n.summary.toLowerCase().includes(q) ||
    n.transcript.toLowerCase().includes(q) ||
    n.tags.some(t => t.includes(q))
  );
}

export function deleteNote(id: string): boolean {
  const notes = loadIndex();
  const idx = notes.findIndex(n => n.id === id);
  if (idx === -1) return false;
  const note = notes[idx]!;
  const filePath = path.join(NOTES_DIR, note.file);
  try { fs.unlinkSync(filePath); } catch {}
  notes.splice(idx, 1);
  saveIndex(notes);
  return true;
}

export function getNote(id: string): VoiceNote | null {
  return loadIndex().find(n => n.id === id) ?? null;
}

export function normalizeTags(tags: string[]): string[] {
  return tags
    .map(t => t.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""))
    .filter(t => t.length > 0 && t.length <= 32)
    .slice(0, 8);
}

export function getAllTags(): string[] {
  const notes = loadIndex();
  const tags = new Set<string>();
  for (const n of notes) for (const t of n.tags) tags.add(t);
  return [...tags].sort();
}

export function getNoteStats(): { total: number; totalDuration: number; tags: string[]; oldestDate: string | null; newestDate: string | null } {
  const notes = loadIndex();
  if (notes.length === 0) return { total: 0, totalDuration: 0, tags: [], oldestDate: null, newestDate: null };
  const dates = notes.map(n => n.createdAt).sort();
  const totalDuration = notes.reduce((s, n) => s + n.duration, 0);
  const tags = getAllTags();
  return { total: notes.length, totalDuration, tags, oldestDate: dates[0]!, newestDate: dates[dates.length - 1]! };
}

export function normalizeTags(tags: string[]): string[] {
  return tags
    .map(t => t.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""))
    .filter(t => t.length > 0 && t.length <= 32)
    .slice(0, 8);
}

export function getAllTags(): string[] {
  const notes = loadIndex();
  const tags = new Set<string>();
  for (const n of notes) for (const t of n.tags) tags.add(t);
  return [...tags].sort();
}
