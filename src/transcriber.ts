import * as fs from "fs";

const NIM_BASE = "https://integrate.api.nvidia.com/v1";
const ASR_MODEL = "nvidia/parakeet-ctc-0.6b-asr";
const CHAT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";

export async function transcribeAudio(wavPath: string, apiKey: string): Promise<string> {
  const audioBase64 = fs.readFileSync(wavPath).toString("base64");

  const resp = await fetch(`${NIM_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: ASR_MODEL,
      audio: audioBase64,
      format: "wav",
      language: "en",
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`ASR error ${resp.status}: ${body}`);
  }

  const data = await resp.json() as { text?: string; transcript?: string };
  return (data.text ?? data.transcript ?? "").trim();
}

export interface NoteMetadata {
  summary: string;
  tags: string[];
  title: string;
}

export async function generateMetadata(transcript: string, apiKey: string): Promise<NoteMetadata> {
  const prompt = `Given this voice note transcript, extract:
1. A short title (5-8 words max, no quotes)
2. A one-sentence summary
3. 3-5 relevant tags (single words or hyphenated, lowercase)

Transcript: "${transcript}"

Respond with ONLY valid JSON in this exact format:
{"title": "...", "summary": "...", "tags": ["tag1", "tag2", "tag3"]}`;

  const resp = await fetch(`${NIM_BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 200,
    }),
  });

  if (!resp.ok) {
    return { title: "Voice Note", summary: transcript.slice(0, 100), tags: ["voice-note"] };
  }

  const data = await resp.json() as { choices: Array<{ message: { content: string } }> };
  const content = data.choices[0]?.message.content ?? "";

  try {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as NoteMetadata;
  } catch {}

  return { title: "Voice Note", summary: transcript.slice(0, 100), tags: ["voice-note"] };
}
