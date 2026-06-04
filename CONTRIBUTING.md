# Contributing to voicenotes-cli

## Running locally

```bash
npm install
export NVIDIA_API_KEY="nvapi-..."
# Requires sox: brew install sox
ts-node src/index.ts
```

## Testing without a microphone

You can test transcription with an existing WAV file:

```typescript
import { transcribeAudio } from "./src/transcriber";
const transcript = await transcribeAudio("./test.wav", process.env.NVIDIA_API_KEY!);
console.log(transcript);
```

## Adding a new recording backend

Add a new case in `startRecording()` in `src/recorder.ts`.
The output must be a 16kHz mono WAV file for Parakeet ASR compatibility.

## Language support

Parakeet ASR is English-only. For multilingual support, consider NVIDIA's Canary model.
