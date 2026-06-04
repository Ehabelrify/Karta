// ── Language Registry ──
// To add a new language:
// 1. Create a folder: languages/<code>/
// 2. Add a words.js file in that folder (same format as german/words.js)
// 3. Add an entry here
// That's it. The app handles everything else automatically.

const LANGUAGE_REGISTRY = [
  {
    code: 'german',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    // JSON files for each level
    dataFiles: [
      'languages/german/a1.json',
      'languages/german/a2.json',
      'languages/german/b1.json',
      'languages/german/b2.json'
    ],
    // Direction: 'ltr' or 'rtl'
    dir: 'ltr',
    // The field in each word object that holds the target language text
    targetField: 'target',
    // The field for the native language (translation)
    nativeField: 'native',
    // Levels used in this language's word list
    levels: ['A1', 'A2', 'B1', 'B2'],
    levelSystem: 'CEFR', // e.g. 'CEFR', 'JLPT', 'HSK', 'Custom'
    levelNames: {
      A1: 'Beginner',
      A2: 'Elementary',
      B1: 'Intermediate',
      B2: 'Upper-Intermediate',
    },
    // Word count (informational only)
    wordCount: 2000,
    // Optional: grammar notes, article system, etc.
    notes: 'Nouns have grammatical gender (der/die/das)',
  },

  // ── Template for adding Spanish ──
  // {
  //   code: 'spanish',
  //   name: 'Spanish',
  //   nativeName: 'Español',
  //   flag: '🇪🇸',
  //   script: 'languages/spanish/words.js',
  //   dir: 'ltr',
  //   targetField: 'es',
  //   nativeField: 'en',
  //   levels: ['A1', 'A2', 'B1', 'B2'],
  //   levelSystem: 'CEFR',
  //   levelNames: { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper-Intermediate' },
  //   wordCount: 1000,
  // },

  // ── Template for adding Arabic ──
  // {
  //   code: 'arabic',
  //   name: 'Arabic',
  //   nativeName: 'العربية',
  //   flag: '🇪🇬',
  //   script: 'languages/arabic/words.js',
  //   dir: 'rtl',
  //   targetField: 'ar',
  //   nativeField: 'en',
  //   levels: ['A1', 'A2', 'B1', 'B2'],
  //   levelSystem: 'CEFR',
  //   levelNames: { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper-Intermediate' },
  //   wordCount: 1000,
  // },

  // ── Template for adding Japanese ──
  // {
  //   code: 'japanese',
  //   name: 'Japanese',
  //   nativeName: '日本語',
  //   flag: '🇯🇵',
  //   script: 'languages/japanese/words.js',
  //   dir: 'ltr',
  //   targetField: 'jp',
  //   nativeField: 'en',
  //   levels: ['N5', 'N4', 'N3', 'N2', 'N1'],
  //   levelSystem: 'JLPT',
  //   levelNames: { N5: 'Beginner', N4: 'Elementary', N3: 'Intermediate', N2: 'Upper-Intermediate', N1: 'Advanced' },
  //   wordCount: 2000,
  // },
];
