# 📚 Language Flashcards PWA

A lightweight, offline-first flashcard Progressive Web App for vocabulary learning, built with vanilla HTML, CSS, and JavaScript. No frameworks, no accounts, no ads, and no subscriptions.

The project is designed to support multiple languages. It currently includes **German** with over **1,000 words** across **A1–B2 CEFR** levels, stored in JSON files for maintainability and future expansion.

---

## ✨ Features

- **Spaced repetition learning** — powered by an SM-2 style review system
- **Offline-first PWA** — works without an internet connection after the first load
- **Installable** — add it to your phone or desktop like a native app
- **CEFR-based study levels** — A1, A2, B1, and B2 are available from the start
- **Category filtering** — study by topic or mix categories together
- **Pronunciation support** — phonetic hints plus browser-based text-to-speech
- **Example sentences** — target-language examples with English translations
- **Translation peek** — reveal the meaning without flipping the card
- **Custom vocabulary** — add your own words with local progress tracking
- **Multi-language ready** — structured to support additional languages
- **Local-first storage** — progress and custom words are stored in `localStorage`
- **No backend required** — simple static deployment on GitHub Pages or any web server

---

## 📁 Project Structure

```text
.
├── index.html                  # Main app shell
├── manifest.json               # PWA manifest
├── sw.js                       # Service worker for offline support
├── README.md                   # Project documentation
├── LICENSE
├── assets/
│   └── icons/
│       ├── icon-192.svg
│       └── icon-512.svg
├── core/
│   ├── app.js                  # UI and application logic
│   ├── languages.js            # Language registry and configuration
│   └── srs.js                  # Spaced repetition logic
└── languages/
    └── german/
        ├── README.md           # German dataset notes
        ├── a1.json             # A1 vocabulary
        ├── a2.json             # A2 vocabulary
        ├── b1.json             # B1 vocabulary
        └── b2.json             # B2 vocabulary
```

---

## 🚀 Live Demo

Use the app directly on GitHub Pages:

[**→ Open Live Demo**](https://ehabelrify.github.io/Karta/)

After the first load, the app can work offline and can be installed on supported devices.

---

## 🏃 Getting Started

### Run Locally

You can open `index.html` directly in a browser, but using a local static server is recommended for full PWA behavior.

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .
```

Then open `http://localhost:8080` in your browser.

> **Note:** Service workers require `https://` or `localhost`. If you open the app with `file://`, the core interface still works, but offline support will not be enabled.

### Install as an App

After opening the app in your browser:

- **Android:** Use the browser install prompt or the browser menu → **Install app**
- **iPhone/iPad:** Tap **Share** → **Add to Home Screen**
- **Desktop browsers:** Use the install icon in the address bar when available

---

## 🎯 How to Use

1. Open the app
2. Select a language
3. Choose a CEFR level
4. Filter by category, or study all categories together
5. Review cards and rate your recall using **Again**, **Good**, or **Easy**
6. Add custom words if you want to study personal vocabulary
7. Return regularly to review due cards and build long-term retention

Progress is saved automatically in your browser.

---

## 📚 Available Languages

| Language | Levels | Status |
|----------|--------|--------|
| German 🇩🇪 | A1–B2 | ✅ Included (1,000 words) |
| Additional languages | Varies | 🔄 Planned / contribution-friendly |

If you want to add another language, see [Adding a New Language](#-adding-a-new-language).

---

## 🔄 Review System

The app uses an **SM-2 style spaced repetition system** similar to the approach popularized by Anki and SuperMemo.

| Rating | Meaning | Effect |
|--------|---------|--------|
| **Again** | You did not remember the word | Resets or shortens the interval significantly |
| **Good** | You remembered with some effort | Increases the interval normally |
| **Easy** | You remembered immediately | Increases the interval more aggressively |

In general:

- Cards become less frequent as you answer them correctly
- Difficult cards return sooner
- Review sessions prioritize due and overdue cards
- Progress is tracked separately in local storage

---

## 🔊 Pronunciation

The app supports browser-native pronunciation through the **Web Speech API**.

- Use the speaker icon to hear the target word
- Pronunciation depends on browser and device voice support
- No external API key or backend service is required
- Works especially well on modern mobile and desktop browsers

Language voice mappings are configured in [`core/app.js`](core/app.js).

---

## ➕ Adding a New Language

The repository is structured so additional languages can be added without changing the overall app architecture.

### 1. Create a language directory

Add a new folder under `languages/`, for example:

```text
languages/spanish/
```

### 2. Add level-based JSON files

Create one or more JSON files such as:

```text
languages/spanish/a1.json
languages/spanish/a2.json
languages/spanish/b1.json
languages/spanish/b2.json
```

Each file should follow the same general structure used by the German dataset:

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
      "examples": [
        {
          "target": "Mi madre cocina bien.",
          "native": "My mother cooks well."
        }
      ]
    }
  ]
}
```

### 3. Register the language

Update `core/languages.js` with the new language configuration so the app can load and display it.

### 4. Test the dataset

Verify that:
- IDs are unique
- Levels are correct
- Required fields are present
- JSON is valid
- The language appears correctly in the app

For a concrete reference, see [`languages/german/README.md`](languages/german/README.md).

---

## 🛠️ Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Service Worker API
- Web App Manifest
- Web Speech API
- `localStorage`

---

## 🤝 Contributing

Contributions are welcome, especially for:

- New language datasets
- Content improvements
- UX and accessibility enhancements
- Documentation refinements
- Testing and validation improvements

If you contribute a language dataset, keep the structure consistent with the existing JSON-based format.

---

## 📄 License

MIT — see [LICENSE](LICENSE).
