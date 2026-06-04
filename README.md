# voicenotes-cli

> Terminal voice notes with AI transcription. Press ENTER to record, press ENTER again to stop. The note is transcribed, titled, tagged, and saved to a local markdown file automatically.

```
$ vnote

  ◆ vnote

  → Recording with sox — press ENTER to stop

  ● Recording...

  ✔ Recorded 23.4s of audio
  → Transcribing with NVIDIA Parakeet ASR...
  ✔ Transcript: Need to follow up with the design team about the onboarding...
  → Generating title, summary, and tags...
  ✔ Title: Design Team Onboarding Follow-up
  ✔ Tags: #design #onboarding #followup #meeting

  ◆ Note saved! ID: 4af2b9
  → ~/voice-notes/2025-01-14-design-team-onboarding-follow-up-4af2b9.md
```

---

## Install

```bash
npm install -g voicenotes-cli
# Command available as: vnote
```

**Requires:** `sox`, `arecord` (Linux), or `ffmpeg` for audio recording

```bash
# macOS
brew install sox

# Ubuntu/Debian
sudo apt install sox

# Any OS (fallback)
brew install ffmpeg  # or your package manager
```

**Get your free NVIDIA API key:** [build.nvidia.com](https://build.nvidia.com)

## Usage

```bash
# Record a new voice note
vnote
vnote record

# List all notes
vnote list

# Search notes
vnote search meeting
vnote search "project alpha"
vnote search design

# Read a full note
vnote open 4af2b9

# Delete a note
vnote delete 4af2b9

# Print notes directory
vnote dir
```

## How It Works

1. **Record** — uses `sox`, `arecord`, or `ffmpeg` to capture audio (16kHz mono WAV)
2. **Transcribe** — sends audio to `nvidia/parakeet-ctc-0.6b-asr` (free NVIDIA NIM endpoint)
3. **Summarize** — sends transcript to Nemotron-Ultra to generate title, summary, and tags
4. **Save** — writes a Markdown file with YAML frontmatter to `~/voice-notes/`

## Note Format

Each note is saved as a Markdown file:

```markdown
---
id: 4af2b9
title: "Design Team Onboarding Follow-up"
date: 2025-01-14T14:32:01.000Z
tags: ["design", "onboarding", "followup", "meeting"]
duration: 23.4s
---

# Design Team Onboarding Follow-up

> Brief summary of the note

## Transcript

Need to follow up with the design team about the onboarding flow...
```

## Notes Directory

Notes are stored in `~/voice-notes/` by default. Override with:

```bash
export VNOTE_DIR=/path/to/my/notes
```

Files are named `YYYY-MM-DD-title-slug-id.md`.

## Options

| Flag | Description |
|------|-------------|
| `--api-key <key>` | NVIDIA NIM API key (or `NVIDIA_API_KEY` env var) |
| `--no-summary` | Skip AI processing, save raw recording only |

## Powered By (free NVIDIA NIM)

- **`nvidia/parakeet-ctc-0.6b-asr`** — NVIDIA's speech-to-text model
- **`nvidia/nemotron-3-ultra-550b-a55b`** — Generates title, summary, and tags

## Zero Dependencies

Only Node.js built-ins. Audio recording uses system tools (sox/arecord/ffmpeg).

## License

MIT

## Keyboard Shortcuts

When recording:
- `ENTER` — stop recording and transcribe
- `Ctrl+C` — cancel recording (no note saved)

## Automations

```bash
# Add to .bashrc/.zshrc for quick access
alias vn="vnote"
alias vnl="vnote list"
alias vns="vnote search"

# Morning brain dump
alias morning="vnote record"
```

## Keyboard Shortcuts

When recording:
- `ENTER` — stop recording and transcribe
- `Ctrl+C` — cancel recording (no note saved)

## Automations

```bash
# Add to .bashrc/.zshrc for quick access
alias vn="vnote"
alias vnl="vnote list"
alias vns="vnote search"

# Morning brain dump
alias morning="vnote record"
```
