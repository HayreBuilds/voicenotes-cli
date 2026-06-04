import { spawn, spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Detects the best available recording tool on the current platform
export function getRecorder(): "sox" | "arecord" | "ffmpeg" | null {
  for (const cmd of ["sox", "arecord", "ffmpeg"]) {
    const r = spawnSync("which", [cmd], { stdio: "ignore" });
    if (r.status === 0) return cmd as "sox" | "arecord" | "ffmpeg";
  }
  return null;
}

export function getTempWavPath(): string {
  return path.join(os.tmpdir(), `vnote-${Date.now()}.wav`);
}

export interface RecordingProcess {
  wavPath: string;
  stop: () => Promise<void>;
}

export function startRecording(wavPath: string, recorder: "sox" | "arecord" | "ffmpeg"): RecordingProcess {
  let proc: ReturnType<typeof spawn>;

  if (recorder === "sox") {
    proc = spawn("sox", ["-d", "-r", "16000", "-c", "1", "-b", "16", wavPath], { stdio: "ignore" });
  } else if (recorder === "arecord") {
    proc = spawn("arecord", ["-f", "cd", "-r", "16000", "-c", "1", "--duration=300", wavPath], { stdio: "ignore" });
  } else {
    proc = spawn("ffmpeg", ["-y", "-f", "avfoundation", "-i", ":0", "-ar", "16000", "-ac", "1", wavPath], { stdio: "ignore" });
  }

  return {
    wavPath,
    stop: () => new Promise<void>((resolve) => {
      proc.on("exit", () => resolve());
      proc.kill("SIGTERM");
      setTimeout(() => { try { proc.kill("SIGKILL"); } catch {} resolve(); }, 1500);
    }),
  };
}

export function wavToBase64(wavPath: string): string {
  if (!fs.existsSync(wavPath)) throw new Error(`WAV file not found: ${wavPath}`);
  return fs.readFileSync(wavPath).toString("base64");
}

export function cleanupWav(wavPath: string): void {
  try { fs.unlinkSync(wavPath); } catch {}
}

export function getRecordingDuration(wavPath: string): number {
  try {
    const buf = fs.readFileSync(wavPath);
    if (buf.length < 44) return 0;
    const sampleRate = buf.readUInt32LE(24);
    const byteRate = buf.readUInt32LE(28);
    const dataSize = buf.readUInt32LE(40);
    return byteRate > 0 ? dataSize / byteRate : 0;
  } catch { return 0; }
}

export const MAX_RECORDING_DURATION = 300; // 5 minutes

export function startRecordingWithLimit(wavPath: string, recorder: "sox" | "arecord" | "ffmpeg", maxSeconds = MAX_RECORDING_DURATION): RecordingProcess {
  // For long recordings, pass duration limit to the recording tool
  const proc = recorder === "sox"
    ? require("child_process").spawn("sox", ["-d", "-r", "16000", "-c", "1", "-b", "16", wavPath, "trim", "0", String(maxSeconds)], { stdio: "ignore" })
    : require("child_process").spawn("arecord", ["-f", "cd", "-r", "16000", `-c`, "1", `--duration=${maxSeconds}`, wavPath], { stdio: "ignore" });
  return {
    wavPath,
    stop: () => new Promise<void>((resolve) => { proc.on("exit", resolve); proc.kill("SIGTERM"); setTimeout(() => { try { proc.kill("SIGKILL"); } catch {} resolve(); }, 1500); }),
  };
}

export const MAX_RECORDING_DURATION = 300; // 5 minutes

export function startRecordingWithLimit(wavPath: string, recorder: "sox" | "arecord" | "ffmpeg", maxSeconds = MAX_RECORDING_DURATION): RecordingProcess {
  // For long recordings, pass duration limit to the recording tool
  const proc = recorder === "sox"
    ? require("child_process").spawn("sox", ["-d", "-r", "16000", "-c", "1", "-b", "16", wavPath, "trim", "0", String(maxSeconds)], { stdio: "ignore" })
    : require("child_process").spawn("arecord", ["-f", "cd", "-r", "16000", `-c`, "1", `--duration=${maxSeconds}`, wavPath], { stdio: "ignore" });
  return {
    wavPath,
    stop: () => new Promise<void>((resolve) => { proc.on("exit", resolve); proc.kill("SIGTERM"); setTimeout(() => { try { proc.kill("SIGKILL"); } catch {} resolve(); }, 1500); }),
  };
}
