# 🎙️ voicenotes-cli

[![Build Status](https://img.shields.io/github/actions/workflow/status/HayreBuilds/voicenotes-cli/ci.yml?branch=main)](https://github.com/HayreBuilds/voicenotes-cli/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA-NIM-76B900?logo=nvidia&logoColor=white)](https://build.nvidia.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/HayreBuilds/voicenotes-cli/pulls)

**Terminal voice notes with AI transcription. Speak, transcribe, title, and tag—all from your CLI.**

> Think faster than you type? **voicenotes-cli** captures your thoughts via voice, transcribes them using NVIDIA Parakeet ASR, and generates a structured Markdown note with AI-powered summaries and tags.

---

## 🚀 Quick Start

```bash
# Record a new voice note
npx vnote
```

1. Press **ENTER** to start recording.
2. Speak your thoughts.
3. Press **ENTER** again to stop and transcribe.
4. Your note is saved to `~/voice-notes/`.

---

## ✨ Key Features

- **🎙️ Instant Recording**: Cross-platform support for `sox`, `arecord`, or `ffmpeg`.
- **✍️ AI Transcription**: Uses `nvidia/parakeet-ctc-0.6b-asr` for high-accuracy speech-to-text.
- **🏷️ Auto-Tagging**: Nemotron-Ultra automatically generates titles, summaries, and relevant tags.
- **🔍 Semantic Search**: Instantly find notes by searching for keywords or tags.
- **📂 Local-First Storage**: Notes are saved as clean Markdown files with YAML frontmatter.
- **⚡ Zero Setup**: No local LLM required. Uses free NVIDIA NIM endpoints.

---

## 💻 Installation

```bash
npm install -g voicenotes-cli
```

### System Dependencies
- **macOS**: `brew install sox`
- **Linux**: `sudo apt install sox` (or `ffmpeg`)

---

## 🛠️ Usage Examples

### Record & Transcribe
```bash
vnote record
```

### Search Your Notes
```bash
vnote search "onboarding"
vnote search #design
```

### List & Open
```bash
# List last 10 notes
vnote list

# Open a specific note in your default editor
vnote open 4af2b9
```

---

## 🔍 How it Works

1. **Audio Capture**: Records high-quality mono WAV audio (16kHz).
2. **ASR Pipeline**: Sends the audio buffer to NVIDIA's Parakeet ASR model.
3. **LLM Enrichment**: The transcript is processed by `Nemotron-Ultra` to extract metadata.
4. **Markdown Export**: Generates a file with YAML frontmatter containing the ID, date, tags, and summary.

---

## ⚙️ Configuration Options

| Flag | Description |
|:---|:---|
| `--api-key <key>` | NVIDIA NIM API key (or `NVIDIA_API_KEY` env var) |
| `--no-summary` | Skip AI processing and save the raw transcript only |
| `--dir <path>` | Custom directory for storing notes (Default: `~/voice-notes/`) |

---

## 🤝 Contributing

We love contributions! See our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 💖 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=HayreBuilds/voicenotes-cli&type=Date)](https://star-history.com/#HayreBuilds/voicenotes-cli&Date)
