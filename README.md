# Karta — Vocabulary Flashcards

A lightweight, offline-first flashcard Progressive Web App for vocabulary learning, built with vanilla HTML, CSS, and JavaScript. No frameworks, no accounts, no ads, no subscriptions.

Designed for multiple languages. Currently ships **German** with **2,000 words** across **A1–B2 CEFR** levels.

---

## Features

- **Spaced repetition (SRS)** — SM-2 style scheduling; cards resurface based on how well you know them
- **Smart Start** — begins a session with words you haven't seen yet, prioritized by difficulty
- **Smart Review** — surfaces only cards that are due, ordered by urgency
- **Offline-first PWA** — works without internet after the first load; installable on any device
- **CEFR levels** — A1, A2, B1, B2 available from day one
- **Category filtering** — study by topic (People & Family, Travel, Food, etc.) or mix all together
- **Register filter** — filter words by formal, informal, or neutral register in the Browse view
- **Browse & search** — full searchable word list with level, category, and register filters
- **Bookmarks** — save any word for focused review sessions
- **Pronunciation** — tap a word to hear it via browser TTS; choose a preferred device voice in Settings
- **Example sentences** — target-language examples with English translations on every card
- **Translation peek** — reveal the meaning without fully flipping the card
- **Custom words** — add personal vocabulary; it lives alongside the built-in list with its own SRS progress
- **Streak tracking** — daily review streak displayed on the home screen
- **Local-first** — all progress and custom words stored in `localStorage`; no backend, no account
- **Multi-language ready** — add any language by dropping in JSON files and a registry entry

---

## Project Structure

```
.
├── index.html                  # App shell: all CSS + HTML
├── manifest.json               # PWA manifest
├── sw.js                       # Service worker (offline / caching)
├── core/
│   ├── app.js                  # UI, session logic, SRS integration
│   ├── languages.js            # Language registry
│   └── srs.js                  # Spaced-repetition algorithm
└── languages/
    └── german/
        ├── a1.json             # A1 vocabulary
        ├── a2.json             # A2 vocabulary
        ├── b1.json             # B1 vocabulary
        └── b2.json             # B2 vocabulary
```

---

## Live Demo

[**→ Open on GitHub Pages**](https://ehabelrify.github.io/Karta/)

After the first load the app works fully offline and can be installed to your home screen.

---

## Run Locally

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .
```

Open `http://localhost:8080`. A local server is needed for full PWA behaviour (service workers require `https://` or `localhost`).

### Install as an App

- **Android** — browser menu → **Install app**, or use the install banner
- **iPhone / iPad** — tap **Share** → **Add to Home Screen**
- **Desktop** — click the install icon in the address bar

---

## How to Use

1. Open the app and select a language (or it opens directly if only one is configured)
2. On the home screen, pick a study mode:
   - **Smart Start** — new words you haven't learned yet
   - **Smart Review** — cards that are due for review today
   - **By Level** — choose A1, A2, B1, or B2
   - **By Category** — focus on a topic (Travel, Food, etc.)
   - **Bookmarks** — review only your saved words
3. During review, rate each card:
   - **Again** — didn't remember; card comes back soon
   - **Good** — remembered with effort; interval increases normally
   - **Easy** — recalled instantly; interval increases more aggressively
4. Tap the speaker icon to hear pronunciation; tap the translation area to peek at the meaning
5. Use **Browse** (list icon) to search all words, filter by level / category / register, and bookmark any word
6. Add custom vocabulary with the **+** button in Browse
7. Access **Settings** (gear icon) to switch language, change the TTS voice, or reset progress

Progress saves automatically.

---

## Review System

The app uses an SM-2 style spaced repetition algorithm — the same approach used by Anki and SuperMemo.

| Rating | Meaning | Effect |
|--------|---------|--------|
| **Again** | Did not recall | Resets or shortens the interval |
| **Good** | Recalled with effort | Interval grows at a normal rate |
| **Easy** | Recalled immediately | Interval grows faster |

Cards that you know well appear less and less frequently. Difficult cards return sooner. The review queue always prioritizes due and overdue cards.

---

## Available Languages

| Language | Levels | Words | Status |
|----------|--------|-------|--------|
| German 🇩🇪 | A1–B2 | ~2,000 | ✅ Included |
| More | — | — | Planned |

---

## Adding a Language

1. Create `languages/<code>/` and add level JSON files (`a1.json`, `a2.json`, etc.)
2. Each file follows this structure:

```json
{
  "language": "spanish",
  "level": "A1",
  "words": [
    {
      "id": "es_a1_001",
      "target": "la madre",
      "native": "mother",
      "pronunciation": "la MAH-dreh",
      "category": "People & Family",
      "register": "neutral",
      "examples": [
        { "target": "Mi madre cocina bien.", "native": "My mother cooks well." }
      ]
    }
  ]
}
```

3. Add an entry to `core/languages.js` — the app handles everything else automatically
4. Add the new JSON paths to the `ASSETS` array in `sw.js` so they're cached for offline use

See [`languages/german/README.md`](languages/german/README.md) for a full reference.

---

## Settings

| Option | Description |
|--------|-------------|
| **Language** | Switch between installed languages |
| **Pronunciation Voice** | Choose a TTS voice from the ones installed on your device |
| **Reload App** | Force-refreshes the page to pick up the latest cached version |
| **Reset Progress** | Clears all SRS data, custom words, and streak (irreversible) |

---

## Technology

- HTML5, CSS3, vanilla JavaScript (no build step)
- Service Worker API (offline / PWA caching)
- Web App Manifest
- Web Speech API (TTS pronunciation)
- `localStorage` (progress persistence)

---

## License

MIT — see [LICENSE](LICENSE).
