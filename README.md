# 📚 Language Flashcards PWA

A lightweight, offline-first flashcard Progressive Web App for vocabulary learning — built with vanilla HTML, CSS, and JavaScript. No frameworks, no accounts, no ads, no subscriptions.

Designed from the ground up to support multiple languages. Currently includes **German** with 1,000 words (A1–B2 CEFR). Additional languages can be added through contributions and updates.

---

## ✨ Features

- **Smart spaced repetition** — SM-2 algorithm (same as Anki): intervals grow based on how well you know each word
- **CEFR levels** — A1 · A2 · B1 · B2, all unlocked from the start
- **Categories** — People & Family · Food & Drink · Travel · Work · Body · Nature · Emotions · Colors · Places · Numbers · Time
- **Intelligent review mix** — ~70% due/overdue words, ~30% new words per session
- **Phonetic pronunciation** — every word has an English-letter approximation
- **Example sentences** — in target language + English translation, with the target word highlighted
- **Tap to peek** — tap/hover the word to reveal the translation without flipping the card
- **Add custom words** — add your own vocabulary with full SRS tracking
- **Offline support** — works with no internet after first load (Service Worker)
- **Installable** — add to iPhone/Android home screen, behaves like a native app
- **Multi-language ready** — add Spanish, Arabic, Japanese, etc. by dropping in one file
- **No backend** — all data stored locally on-device via `localStorage`
- **No account required**
- **Free, open source**

---

## 📁 Project Structure

```
flashcard-app/
│
├── index.html                  # App shell (single page)
├── manifest.json               # PWA manifest
├── sw.js                       # Service worker (offline)
│
├── core/
│   ├── app.js                  # UI logic — language-agnostic
│   ├── srs.js                  # Spaced repetition engine (SM-2)
│   └── languages.js            # Language registry — configure languages here
│
├── languages/
│   └── german/
│       └── words.js            # 1,000 German words (A1–B2)
│   └── spanish/                # ← drop a words.js here to add Spanish
│   └── arabic/                 # ← drop a words.js here to add Arabic
│
└── assets/
    └── icons/
        ├── icon-192.svg
        └── icon-512.svg
```

---

## 🚀 Try Live

**No installation needed** — use the app right now on GitHub Pages:

[**→ Open Live Demo**](https://ehabelrify.github.io/karta)

The app works fully offline after the first load and can be installed on your phone home screen.

---

## 🏃 Quick Start

### Run Locally

Open `index.html` directly in your browser, or use a static file server:

```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx serve .
```

Then open `http://localhost:8080` in your browser.

**Note:** The service worker (offline mode) requires HTTPS or `localhost`. On a plain `file://` URL, offline mode won't activate, but the app works fine otherwise.

### Install as an App

After opening the app in your browser:

- **Android:** Click the install prompt that appears, or tap the menu → "Install app"
- **iPhone:** Tap **Share** (box with arrow) → **"Add to Home Screen"** → **Add**

The app icon appears on your home screen and works fully offline.

---

## 🎯 How to Use

1. **Open the app** — available languages are ready to study (see [Available Languages](#-available-languages) below)
2. **Select a language** — switch between available languages anytime
3. **Choose a level** — A1, A2, B1, or B2 (pick any level, no progression lock)
4. **Choose a category** — or mix all categories together
5. **Study** — flip cards, rate your knowledge (Again / Good / Easy)
6. **Add custom words** — click "Add Word" to add your own vocabulary
7. **Track progress** — the app remembers what you know and schedules reviews

Your progress is saved automatically in your browser and persists offline.

---

## 📚 Available Languages

| Language | Level | Availability |
|----------|-------|---------------|
| German 🇩🇪 | A1–B2 | ✅ Included (1,000 words) |
| Spanish 🇪🇸 | A1–B2 | ⏳ Planned — contributions welcome |
| French 🇫🇷 | A1–B2 | ⏳ Planned — contributions welcome |
| More languages | — | 🔄 Open for community contributions |

**Want to add a language?** See the [Add a New Language](#-add-a-new-language) section below. Community contributions are welcome!

---

## 🔄 How the Review Algorithm Works

The app uses **SM-2** (the same algorithm as Anki and SuperMemo):

| Button | Meaning | Next Review |
|--------|---------|-------------|
| **Again** | Didn't know it | 10 minutes |
| **Good** | Knew it with effort | Interval × ease factor |
| **Easy** | Knew it instantly | Interval × ease × 1.3 |

**How it works:**
- Cards start with an ease factor of 2.5
- "Again" lowers the ease (hard cards get reviewed more)
- "Easy" raises the ease (easy cards get reviewed less)
- A word is "mastered" at ≥3 successful reps and ≥7-day interval
- Each session mixes ~70% due/overdue words with ~30% new words

---

## ➕ Add a New Language

To add a language that's not yet available:

### 1. Create the word list

Create `languages/spanish/words.js` (replace `spanish` with your language code).

Each word needs this structure:

```js
const WORDS = [
  {
    id: 1,                          // unique integer
    level: "A1",                    // A1 | A2 | B1 | B2
    category: "People & Family",    // any category
    es: "la madre",                 // target language (field name matches targetField in registry)
    en: "mother",                   // translation
    pronunciation: "la MAH-dre",    // phonetic pronunciation
    example: "Mi madre cocina bien.", // example sentence
    exampleEn: "My mother cooks well." // English translation
  },
  // ... more words
];
```

### 2. Register the language

Open `core/languages.js` and add a new entry:

```js
{
  code: 'spanish',
  name: 'Spanish',
  nativeName: 'Español',
  flag: '🇪🇸',
  script: 'languages/spanish/words.js',
  dir: 'ltr',
  targetField: 'es',       // must match the field in words.js
  nativeField: 'en',
  levels: ['A1', 'A2', 'B1', 'B2'],
  levelSystem: 'CEFR',
  levelNames: { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper-Intermediate' },
  wordCount: 1000,
},
```

### 3. Link the script

Add this line to `index.html` before `<script src="core/app.js"></script>`:

```html
<script src="languages/spanish/words.js"></script>
```

Done. The app automatically shows a language picker when you have multiple languages. Progress for each language is tracked separately.

---

## 📄 License

MIT — see [LICENSE](LICENSE)
