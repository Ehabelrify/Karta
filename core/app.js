// ── Karta — Core App  (Phase 4) ──
// Phases 1–4 complete: SRS · voice · settings · Smart Start/Review · Browse · Bookmarks
// Forward hooks wired for Phase 5 (Word List Rework).

// ── Category icons — all 14 Phase-5 categories pre-registered ──
const CAT_ICONS = {
  // Current categories
  'People & Family':  '👥',
  'Food & Drink':     '🍽️',
  'Travel':           '✈️',
  'Work':             '💼',
  'Body':             '🫀',
  'Nature':           '🌿',
  'Emotions':         '💭',
  'Colors':           '🎨',
  'Places':           '📍',
  'Numbers':          '🔢',
  'Time':             '🕐',
  // Phase-5 new categories (words will arrive; icons already mapped)
  'Essentials':       '🗣️',
  'Core Verbs':       '🔤',
  'Daily Life':       '🏠',
  'Time & Dates':     '🕐',
  'Travel & Transport':'✈️',
  'Work & Study':     '💼',
  'Body & Health':    '🫀',
  'People & Society': '👥',
  'Description':      '🎨',
  'default':          '📌',
};

// ── Centralised language → IETF tag map (used by both word & sentence TTS) ──
const SPEAK_LANG_MAP = {
  german:   'de-DE',
  spanish:  'es-ES',
  french:   'fr-FR',
  italian:  'it-IT',
  arabic:   'ar-SA',
  japanese: 'ja-JP',
  mandarin: 'zh-CN',
  portuguese:'pt-PT',
};

// ── App State ──
const State = {
  activeLang:      null,
  allWords:        [],
  currentLevel:    null,
  currentCategory: null,
  reviewQueue:     [],
  reviewIndex:     0,
  // reviewMode: 'smart-start' | 'smart-review' | 'level' | 'category' | 'bookmarks'
  // Used by Phase 2 Smart Start / Smart Review logic
  reviewMode:      'category',
  sessionStats:    { again: 0, good: 0, easy: 0 },
  cardRevealed:    false,
  swipeShown:      false,
  streakCount:     0,
  lastReviewDate:  null,
  // Phase 4 — bookmarks (word IDs), loaded/saved per language
  bookmarks:       new Set(),
  // Voice preference per language — Phase 1
  preferredVoice:  null,
};

// ── Boot ──
async function boot() {
  if (LANGUAGE_REGISTRY.length === 0) {
    showError('No languages configured. Check core/languages.js.');
    return;
  }
  loadStreakData();
  bindNav();
  bindAdd();
  bindSettingsSheet();   // gear icon → settings (voice + lang + reload + reset)
  bindLangSheet();       // language bottom sheet — always accessible
  bindBrowse();          // Phase 3 — browse overlay events

  if (LANGUAGE_REGISTRY.length === 1) {
    await loadLanguage(LANGUAGE_REGISTRY[0]);
  } else {
    document.getElementById('loading-screen').classList.add('hidden');
    showLanguagePicker();
  }

  // Initialize voice synthesis
  if ('speechSynthesis' in window) {
    // Trigger voices to load
    speechSynthesis.getVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.onvoiceschanged = null;
        // Voice list is now loaded, update UI if needed
        if (State.activeLang && document.getElementById('settings-voice-val')) {
          const voiceName = State.preferredVoice
            ? (State.preferredVoice.name || 'Device default')
            : 'Device default';
          document.getElementById('settings-voice-val').textContent = voiceName;
        }
      };
    }
  }
}

// ── Activate a language ──
function activateLanguage(lang, loadedWords) {
  State.activeLang     = lang;
  const custom         = SRS.getCustomWords(lang.code);
  State.allWords       = [...(loadedWords || []), ...custom];
  State.bookmarks      = loadBookmarks(lang.code);         // Phase 4 ready
  State.preferredVoice = loadPreferredVoice(lang.code);    // Phase 1
  document.documentElement.dir = lang.dir || 'ltr';
  document.getElementById('loading-screen').classList.add('hidden');
  renderHome();
  showScreen('home');
  updateNavForHome();
}

// ══════════════════════════════════════════════
//  LANGUAGE PICKER & SHEET
// ══════════════════════════════════════════════

// Full-screen picker (only when >1 language, no active lang yet)
function showLanguagePicker() {
  const screen = document.getElementById('lang-pick');
  screen.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'home-header';
  title.innerHTML = '<h1>Karta</h1><p>Choose a language to study</p>';
  screen.appendChild(title);
  const grid = document.createElement('div');
  grid.className = 'level-grid';
  for (const lang of LANGUAGE_REGISTRY) {
    const card = document.createElement('div');
    card.className = 'level-card';
    card.innerHTML = `
      <div class="level-badge" style="font-size:26px;background:var(--surface2)">${lang.flag}</div>
      <div class="level-info">
        <div class="level-name">${lang.name}</div>
        <div class="level-sub">${lang.nativeName} · ${lang.wordCount} words · ${lang.levelSystem}</div>
      </div>
      <div class="level-arrow">›</div>`;
    card.addEventListener('click', () => loadLanguage(lang));
    grid.appendChild(card);
  }
  screen.appendChild(grid);
  showScreen('lang-pick');
  document.getElementById('nav-wordmark').style.display = '';
  document.getElementById('nav-title').style.display   = 'none';
  document.getElementById('nav-back').style.display    = 'none';
  document.getElementById('nav-settings').style.display = 'none';
}

// ── Language bottom sheet ──
// ALWAYS accessible — shows picker if >1 lang, info panel if single lang
function bindLangSheet() {
  const overlay = document.getElementById('lang-overlay');
  const sheet   = document.getElementById('lang-sheet');
  const list    = document.getElementById('lang-sheet-list');

  window._openLangSheet = function() {
    list.innerHTML = '';

    if (LANGUAGE_REGISTRY.length === 1) {
      // Single language — info panel
      const lang = LANGUAGE_REGISTRY[0];
      list.innerHTML = `
        <div class="lang-info-panel">
          <div class="lang-info-flag">${lang.flag}</div>
          <div class="lang-info-name">${lang.name}</div>
          <div class="lang-info-sub">${lang.nativeName} · ${lang.wordCount} words · ${lang.levelSystem}</div>
          <div class="lang-info-note">More languages coming soon</div>
        </div>`;
    } else {
      for (const lang of LANGUAGE_REGISTRY) {
        const opt = document.createElement('div');
        opt.className = `lang-option ${State.activeLang?.code === lang.code ? 'active' : ''}`;
        opt.innerHTML = `
          <div class="flag">${lang.flag}</div>
          <div class="lang-option-info">
            <div class="lang-option-name">${lang.name}</div>
            <div class="lang-option-sub">${lang.nativeName} · ${lang.wordCount} words</div>
          </div>
          <div class="lang-option-check">✓</div>`;
        opt.addEventListener('click', async () => {
          closeLangSheet();
          if (State.activeLang?.code !== lang.code) {
            document.getElementById('loading-screen').classList.remove('hidden');
            document.getElementById('loading-text').textContent = `Loading ${lang.name}…`;
            await loadLanguage(lang);
          }
        });
        list.appendChild(opt);
      }
    }
    overlay.classList.add('open');
    sheet.classList.add('open');
  };

  function closeLangSheet() {
    overlay.classList.remove('open');
    sheet.classList.remove('open');
  }

  overlay.addEventListener('click', closeLangSheet);
  document.getElementById('lang-sheet-close').addEventListener('click', closeLangSheet);
}

// ══════════════════════════════════════════════
//  SETTINGS SHEET  (gear icon)
//  Sections: Language · Voice · Reset
// ══════════════════════════════════════════════
function bindSettingsSheet() {
  const overlay    = document.getElementById('settings-overlay');
  const sheet      = document.getElementById('settings-sheet');
  const navSettings = document.getElementById('nav-settings');

  function openSettings() {
    renderSettingsSheet();
    overlay.classList.add('open');
    sheet.classList.add('open');
  }
  function closeSettings() {
    overlay.classList.remove('open');
    sheet.classList.remove('open');
    // Also close any sub-sheet
    closeVoiceSheet();
  }

  navSettings.addEventListener('click', openSettings);
  overlay.addEventListener('click', closeSettings);
  document.getElementById('settings-close-btn').addEventListener('click', closeSettings);

  // ── Settings actions ──
  document.getElementById('settings-lang-btn').addEventListener('click', () => {
    closeSettings();
    window._openLangSheet();
  });

  document.getElementById('settings-voice-btn').addEventListener('click', () => {
    closeSettings();
    openVoiceSheet();
  });

  document.getElementById('settings-reload-btn').addEventListener('click', () => {
    closeSettings();
    window.location.reload(true);
  });

  document.getElementById('settings-reset-btn').addEventListener('click', () => {
    closeSettings();
    openResetConfirm();
  });
}

function renderSettingsSheet() {
  const lang = getLang();
  // Update language row
  const langRow = document.getElementById('settings-lang-btn');
  if (lang) {
    langRow.querySelector('.settings-row-value').textContent =
      `${lang.flag} ${lang.name}`;
  }
  // Update voice row
  const voiceRow = document.getElementById('settings-voice-btn');
  const voiceName = State.preferredVoice
    ? (State.preferredVoice.name || 'Device default')
    : 'Device default';
  voiceRow.querySelector('.settings-row-value').textContent = voiceName;
}

// ── Voice selector sheet ──
function openVoiceSheet() {
  const overlay = document.getElementById('voice-overlay');
  const sheet   = document.getElementById('voice-sheet');
  const list    = document.getElementById('voice-list');
  list.innerHTML = '';

  const lang      = getLang();
  const targetTag = SPEAK_LANG_MAP[lang?.code] || 'de-DE';
  const langPrefix = targetTag.split('-')[0];

  function getVoices() {
    const all = speechSynthesis.getVoices();
    // Match voices for this language
    return all.filter(v => v.lang === targetTag || v.lang.startsWith(langPrefix));
  }

  function renderVoiceList() {
    const voices = getVoices();
    list.innerHTML = '';

    if (voices.length === 0) {
      list.innerHTML = `
        <div class="voice-empty">
          <div class="voice-empty-icon">📱</div>
          <div class="voice-empty-title">No ${lang?.name || ''} voices found</div>
          <div class="voice-empty-sub">Download an enhanced voice on your iPhone:</div>
          <div class="voice-steps">
            <div class="voice-step"><span class="step-num">1</span>Open <strong>Settings</strong></div>
            <div class="voice-step"><span class="step-num">2</span>Go to <strong>Accessibility → Spoken Content → Voices</strong></div>
            <div class="voice-step"><span class="step-num">3</span>Choose <strong>${lang?.name || 'German'}</strong></div>
            <div class="voice-step"><span class="step-num">4</span>Tap a voice and download <strong>Enhanced</strong> quality</div>
            <div class="voice-step"><span class="step-num">5</span>Come back and select it here</div>
          </div>
          <button class="voice-refresh-btn" id="voice-refresh-btn">Refresh voice list</button>
        </div>`;
      document.getElementById('voice-refresh-btn')?.addEventListener('click', () => {
        speechSynthesis.getVoices(); // trigger reload
        setTimeout(renderVoiceList, 500);
      });
      return;
    }

    // "Device default" option
    const defaultOpt = document.createElement('div');
    defaultOpt.className = `voice-option ${!State.preferredVoice ? 'active' : ''}`;
    defaultOpt.innerHTML = `
      <div class="voice-option-info">
        <div class="voice-option-name">Device default</div>
        <div class="voice-option-sub">Let the system choose</div>
      </div>
      <div class="voice-option-check">✓</div>`;
    defaultOpt.addEventListener('click', () => {
      State.preferredVoice = null;
      savePreferredVoice(lang.code, null);
      closeVoiceSheet();
    });
    list.appendChild(defaultOpt);

    // One option per available voice
    voices.forEach(v => {
      const isActive = State.preferredVoice?.name === v.name;
      const quality  = v.name.toLowerCase().includes('enhanced') ||
                       v.name.toLowerCase().includes('premium')  ||
                       v.name.toLowerCase().includes('neural')
                       ? '⭐ Enhanced' : 'Standard';
      const opt = document.createElement('div');
      opt.className = `voice-option ${isActive ? 'active' : ''}`;
      opt.innerHTML = `
        <div class="voice-option-info">
          <div class="voice-option-name">${v.name}</div>
          <div class="voice-option-sub">${v.lang} · ${quality}</div>
        </div>
        <div class="voice-option-check">✓</div>`;
      opt.addEventListener('click', () => {
        // Preview the voice
        pronounceWord('Hallo, wie geht es Ihnen?', lang.code, null, v);
        State.preferredVoice = v;
        savePreferredVoice(lang.code, v);
        // Re-render to show active state
        renderVoiceList();
      });
      list.appendChild(opt);
    });
  }

  // iOS loads voices lazily
  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.onvoiceschanged = () => {
      speechSynthesis.onvoiceschanged = null;
      renderVoiceList();
    };
  } else {
    renderVoiceList();
  }

  document.getElementById('voice-close-btn').onclick = closeVoiceSheet;
  document.getElementById('voice-overlay').onclick   = closeVoiceSheet;

  overlay.classList.add('open');
  sheet.classList.add('open');
}

function closeVoiceSheet() {
  document.getElementById('voice-overlay')?.classList.remove('open');
  document.getElementById('voice-sheet')?.classList.remove('open');
}

// ── Reset confirm ──
function openResetConfirm() {
  const overlay = document.getElementById('reset-overlay');
  const sheet   = document.getElementById('reset-sheet');
  overlay.classList.add('open');
  sheet.classList.add('open');

  function closeReset() {
    overlay.classList.remove('open');
    sheet.classList.remove('open');
  }

  overlay.onclick = closeReset;
  document.getElementById('reset-cancel-btn').onclick = closeReset;

  document.getElementById('reset-progress-btn').onclick = () => {
    closeReset();
    const lang = getLang();
    if (!lang) return;
    localStorage.removeItem(`srs_v2_${lang.code}`);
    localStorage.removeItem(`custom_v1_${lang.code}`);
    localStorage.removeItem(`bookmarks_${lang.code}`);
    localStorage.removeItem('lastReviewDate');
    localStorage.removeItem('streakCount');
    State.streakCount    = 0;
    State.lastReviewDate = null;
    State.bookmarks      = new Set();
    loadLanguage(lang);
  };

  document.getElementById('reload-app-btn').onclick = () => {
    closeReset();
    window.location.reload(true);
  };
}

// ══════════════════════════════════════════════
//  LOAD LANGUAGE
// ══════════════════════════════════════════════
function setLoadSub(text) {
  const el = document.getElementById('load-sub');
  if (el) el.textContent = text;
}

function setLoadProgress(pct) {
  const p = Math.min(100, Math.max(0, pct));
  const fill  = document.getElementById('load-progress-fill');
  const label = document.getElementById('load-pct');
  if (fill)  fill.style.width  = p + '%';
  if (label) label.textContent = Math.round(p) + '%';
}

function formatBytes(n) {
  if (n < 1024)    return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}

async function loadLanguage(lang) {
  try {
    document.getElementById('loading-text').textContent = 'Preparing…';
    setLoadSub('');
    setLoadProgress(0);
    document.getElementById('loading-screen').classList.remove('hidden');

    const files = lang.dataFiles;
    const levelData = [];

    for (let i = 0; i < files.length; i++) {
      const f          = files[i];
      const level      = f.split('/').pop().replace('.json', '').toUpperCase();
      const levelLabel = lang.levelNames?.[level] || level;

      document.getElementById('loading-text').textContent =
        `Loading ${levelLabel} words… (${i + 1} / ${files.length})`;
      setLoadProgress((i / files.length) * 100);

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 30000);

      try {
        const r = await fetch(f, { signal: controller.signal });
        if (!r.ok) throw new Error(`${f}: ${r.statusText}`);

        if (r.body?.getReader) {
          // Stream the body so we can show live byte progress
          const reader     = r.body.getReader();
          const contentLen = r.headers.get('content-length');
          const total      = contentLen ? parseInt(contentLen, 10) : null;
          const chunks     = [];
          let received     = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            const filePct = total ? received / total : 0;
            setLoadProgress(((i + filePct) / files.length) * 100);
            setLoadSub(total
              ? `${formatBytes(received)} / ${formatBytes(total)}`
              : `${formatBytes(received)} downloaded`);
          }

          const merged = new Uint8Array(received);
          let pos = 0;
          for (const c of chunks) { merged.set(c, pos); pos += c.length; }
          levelData.push(JSON.parse(new TextDecoder().decode(merged)));
        } else {
          // Fallback for environments without ReadableStream
          setLoadSub('Loading…');
          levelData.push(await r.json());
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    setLoadProgress(100);
    document.getElementById('loading-text').textContent = 'Processing words…';
    setLoadSub('');

    const allWords = [];
    levelData.forEach(data => {
      data.words.forEach(w => {
        if (!w.target || !w.native) {
          console.warn(`[Karta] Skipping invalid word in ${lang.name}:`, w);
          return;
        }
        allWords.push({
          id:            w.id,
          level:         data.level,
          category:      w.category,
          [lang.targetField]: w.target,
          [lang.nativeField]: w.native,
          pronunciation: w.pronunciation || '',
          examples:      w.examples || [],
          example:       w.examples?.[0]?.target || '',
          exampleEn:     w.examples?.[0]?.native || '',
          register:      w.register     || 'neutral',
          difficulty:    w.difficulty   || 3,
          tags:          w.tags         || [],
          registerPair:  w.registerPair || null,
        });
      });
    });

    console.log(`[Karta] ${lang.name}: ${allWords.length} valid words loaded`);
    activateLanguage(lang, allWords);
  } catch (err) {
    console.error('[Karta] Load failed:', err);
    showError(`Failed to load ${lang.name}.<br>Check your connection and try again.`);
  }
}

// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════
function filterWords(level, category) {
  return State.allWords
    .filter(w => (!level || w.level === level) && (!category || w.category === category))
    .map(w => w.id);
}
function wordById(id)   { return State.allWords.find(w => w.id == id); }
function getLang()      { return State.activeLang; }
function levelBadgeClass(level) {
  return { A1:'a1', A2:'a2', B1:'b1', B2:'b2', N5:'a1', N4:'a2', N3:'b1', N2:'b2', N1:'c1' }[level] || 'a1';
}

// ── Bookmark helpers (Phase 4 ready) ──
function loadBookmarks(langCode) {
  try {
    const raw = localStorage.getItem(`bookmarks_${langCode}`);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}
function saveBookmarks(langCode, set) {
  localStorage.setItem(`bookmarks_${langCode}`, JSON.stringify([...set]));
}
function toggleBookmark(wordId) {
  const lang = getLang();
  if (State.bookmarks.has(wordId)) State.bookmarks.delete(wordId);
  else State.bookmarks.add(wordId);
  saveBookmarks(lang.code, State.bookmarks);
}

// ── Voice preference helpers ──
function loadPreferredVoice(langCode) {
  try {
    const raw = localStorage.getItem(`preferred_voice_${langCode}`);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    // Match saved voice name against currently available voices
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Voices not loaded yet, return saved voice data to match later
      return { name: saved.name, lang: saved.lang };
    }
    return voices.find(v => v.name === saved.name && v.lang === saved.lang) || null;
  } catch { return null; }
}
function savePreferredVoice(langCode, voice) {
  if (!voice) { localStorage.removeItem(`preferred_voice_${langCode}`); return; }
  localStorage.setItem(`preferred_voice_${langCode}`, JSON.stringify({ name: voice.name, lang: voice.lang }));
}

// ══════════════════════════════════════════════
//  HOME
// ══════════════════════════════════════════════
function renderHome() {
  const lang   = getLang();
  const allIds = State.allWords.map(w => w.id);
  const stats  = SRS.getStats(allIds, lang.code);

  ['stat-card-seen','stat-card-mastered','stat-card-due'].forEach(id =>
    document.getElementById(id)?.classList.remove('skeleton'));

  document.getElementById('stat-total').textContent    = stats.seen;
  document.getElementById('stat-mastered').textContent = stats.mastered;
  document.getElementById('stat-due').textContent      = stats.due;

  // Studying badge
  const badge = document.getElementById('studying-badge');
  if (badge) {
    document.getElementById('studying-flag').textContent = lang.flag;
    document.getElementById('studying-name').textContent = lang.name;
    badge.style.display = 'inline-flex';
  }

  // Phase 2 — Smart Start / Smart Review / Browse
  const srsData = SRS.load(lang.code);
  const reinforcementIds = allIds.filter(id => {
    const c = srsData[id];
    return !SRS.isNew(c) && !SRS.isDue(c);
  });
  renderHomeActions(allIds, stats, reinforcementIds);

  // Bookmarks card (Phase 4 — slot exists, hidden until bookmarks exist)
  const bmCard = document.getElementById('bookmarks-home-card');
  if (bmCard) {
    if (State.bookmarks.size > 0) {
      bmCard.classList.remove('hidden');
      bmCard.querySelector('.bm-count').textContent =
        `${State.bookmarks.size} word${State.bookmarks.size > 1 ? 's' : ''}`;
      bmCard.onclick = () => {
        State.reviewMode = 'bookmarks';
        startReview([...State.bookmarks], null, null);
      };
    } else {
      bmCard.classList.add('hidden');
    }
  }

  // Level grid
  const grid = document.getElementById('level-grid');
  grid.innerHTML = '';
  for (const lvl of lang.levels) {
    const ids = filterWords(lvl, null);
    if (!ids.length) continue;
    const s   = SRS.getStats(ids, lang.code);
    const pct = Math.round((s.mastered / ids.length) * 100);
    const card = document.createElement('div');
    card.className = 'level-card';
    card.innerHTML = `
      <div class="level-badge badge-${levelBadgeClass(lvl)}">${lvl}</div>
      <div class="level-info">
        <div class="level-name">${lvl} — ${lang.levelNames[lvl] || lvl}</div>
        <div class="level-sub">${ids.length} words · ${s.mastered} mastered</div>
        <div class="level-progress">
          <div class="level-progress-fill" style="width:${pct}%"></div>
          <div class="level-progress-pct">${pct}%</div>
        </div>
      </div>
      ${s.due > 0 ? `<div class="due-badge">${s.due} due</div>` : ''}
      <div class="level-arrow">›</div>`;
    card.addEventListener('click', () => openLevel(lvl));
    grid.appendChild(card);
  }

  updateStreakDisplay();
}

function renderHomeActions(allIds, stats, reinforcementIds) {
  const container = document.getElementById('home-actions');
  container.innerHTML = '';
  const newCount = allIds.length - stats.seen;

  const smartBtn = document.createElement('button');
  smartBtn.className = 'action-btn action-btn-primary';
  const smartSub = stats.due > 0
    ? `${stats.due} words due for review`
    : newCount > 0
      ? 'Start with new words'
      : 'Review your words';
  smartBtn.innerHTML = `
    <div class="action-icon">🎯</div>
    <div class="action-info">
      <div class="action-title">Smart Start</div>
      <div class="action-sub">${smartSub}</div>
    </div>
    <div class="action-arrow">→</div>`;
  smartBtn.addEventListener('click', () => {
    State.reviewMode = 'smart-start';
    startReview(allIds, null, null);
  });
  container.appendChild(smartBtn);

  if (reinforcementIds.length > 0) {
    const revBtn = document.createElement('button');
    revBtn.className = 'action-btn action-btn-secondary';
    revBtn.innerHTML = `
      <div class="action-icon">🔁</div>
      <div class="action-info">
        <div class="action-title">Smart Review</div>
        <div class="action-sub">${reinforcementIds.length} words to reinforce</div>
      </div>
      <div class="action-arrow">→</div>`;
    revBtn.addEventListener('click', () => {
      State.reviewMode = 'smart-review';
      startReview(reinforcementIds, null, null);
    });
    container.appendChild(revBtn);
  }

  const browseBtn = document.createElement('button');
  browseBtn.className = 'action-btn action-btn-secondary';
  browseBtn.innerHTML = `
    <div class="action-icon">📚</div>
    <div class="action-info">
      <div class="action-title">Browse</div>
      <div class="action-sub">${allIds.length} words</div>
    </div>
    <div class="action-arrow">→</div>`;
  browseBtn.addEventListener('click', () => openBrowse());
  container.appendChild(browseBtn);
}

// ══════════════════════════════════════════════
//  BROWSE MODE (Phase 3)
// ══════════════════════════════════════════════
const _browse = { levelFilter: null, registerFilter: null, searchQuery: '' };
let _browseTimer = null;

function bindBrowse() {
  document.getElementById('browse-close-btn').addEventListener('click', closeBrowse);
  document.getElementById('browse-search-input').addEventListener('input', e => {
    clearTimeout(_browseTimer);
    _browseTimer = setTimeout(() => {
      _browse.searchQuery = e.target.value.trim();
      renderBrowseList();
    }, 200);
  });
}

function openBrowse(initialLevel) {
  _browse.levelFilter = initialLevel || null;
  _browse.registerFilter = null;
  _browse.searchQuery = '';
  const input = document.getElementById('browse-search-input');
  input.value = '';
  renderBrowseFilters();
  renderBrowseList();
  document.getElementById('browse-overlay').classList.add('open');
  setTimeout(() => input.focus(), 350);
}

function closeBrowse() {
  document.getElementById('browse-overlay').classList.remove('open');
  speechSynthesis?.cancel();
}

function renderBrowseFilters() {
  const container = document.getElementById('browse-filters');
  container.innerHTML = '';
  const lang = getLang();

  // Level chips
  ['All', ...lang.levels].forEach(lvl => {
    const isActive = lvl === 'All' ? !_browse.levelFilter : _browse.levelFilter === lvl;
    const chip = document.createElement('button');
    chip.className = `filter-chip ${isActive ? 'active' : ''}`;
    chip.textContent = lvl;
    chip.addEventListener('click', () => {
      _browse.levelFilter = lvl === 'All' ? null : lvl;
      renderBrowseFilters();
      renderBrowseList();
    });
    container.appendChild(chip);
  });

  // Divider
  const br = document.createElement('div');
  br.className = 'browse-filter-break';
  container.appendChild(br);

  // Register chips
  [['All', null], ['Formal', 'formal'], ['Informal', 'informal']].forEach(([label, val]) => {
    const isActive = _browse.registerFilter === val;
    const chip = document.createElement('button');
    chip.className = `filter-chip ${val ? `filter-chip-${val}` : ''} ${isActive ? 'active' : ''}`;
    chip.textContent = label;
    chip.addEventListener('click', () => {
      _browse.registerFilter = val;
      renderBrowseFilters();
      renderBrowseList();
    });
    container.appendChild(chip);
  });
}

function getSrsStatus(wordId, langCode) {
  const card = SRS.getCardState(wordId, langCode);
  if (SRS.isNew(card)) return { label: 'New', cls: 'srs-new' };
  if (SRS.isDue(card)) return { label: 'Due', cls: 'srs-due' };
  if (card.reps >= 3 && card.interval >= 7) return { label: 'Mastered', cls: 'srs-mastered' };
  return { label: 'Learning', cls: 'srs-learning' };
}

function renderBrowseList() {
  const container = document.getElementById('browse-list');
  container.innerHTML = '';
  const lang = getLang();

  let words = [...State.allWords];
  if (_browse.levelFilter)
    words = words.filter(w => w.level === _browse.levelFilter);
  if (_browse.registerFilter)
    words = words.filter(w => (w.register || 'neutral') === _browse.registerFilter);
  if (_browse.searchQuery) {
    const q = _browse.searchQuery.toLowerCase();
    words = words.filter(w =>
      (w[lang.targetField] || '').toLowerCase().includes(q) ||
      (w[lang.nativeField] || '').toLowerCase().includes(q)
    );
  }

  if (words.length === 0) {
    container.innerHTML = `
      <div class="browse-empty">
        <div class="browse-empty-icon">🔍</div>
        <div class="browse-empty-text">No words found</div>
      </div>`;
    return;
  }

  const grouped = {};
  words.forEach(w => {
    const cat = w.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(w);
  });

  const showGroups = !_browse.searchQuery;
  const frag = document.createDocumentFragment();

  for (const [cat, catWords] of Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b))) {
    if (showGroups) {
      const icon = CAT_ICONS[cat] || CAT_ICONS['default'];
      const header = document.createElement('div');
      header.className = 'browse-group-title';
      header.textContent = `${icon}  ${cat} · ${catWords.length}`;
      frag.appendChild(header);
    }
    for (const w of catWords) frag.appendChild(buildBrowseItem(w, lang));
  }

  container.appendChild(frag);
}

function buildBrowseItem(w, lang) {
  const srs = getSrsStatus(w.id, lang.code);
  const isBookmarked = State.bookmarks.has(w.id);
  const targetText = w[lang.targetField] || '';
  const nativeText = w[lang.nativeField] || '';

  const item = document.createElement('div');
  item.className = 'browse-word';

  // Summary row
  const summary = document.createElement('div');
  summary.className = 'browse-word-summary';

  const tgt = document.createElement('div');
  tgt.className = 'browse-word-target';
  tgt.textContent = targetText;
  summary.appendChild(tgt);

  const ntv = document.createElement('div');
  ntv.className = 'browse-word-native';
  ntv.textContent = nativeText;
  summary.appendChild(ntv);

  const badge = document.createElement('span');
  badge.className = `browse-srs-badge ${srs.cls}`;
  badge.textContent = srs.label;
  summary.appendChild(badge);

  item.appendChild(summary);

  // Expandable details
  const details = document.createElement('div');
  details.className = 'browse-word-details';

  if (w.pronunciation) {
    const pron = document.createElement('div');
    pron.className = 'browse-pron';
    pron.textContent = w.pronunciation;
    details.appendChild(pron);
  }

  const actions = document.createElement('div');
  actions.className = 'browse-actions';

  const speakBtn = document.createElement('button');
  speakBtn.className = 'speak-btn speak-btn-sm';
  speakBtn.title = 'Pronounce word';
  speakBtn.innerHTML = speakerIcon();
  speakBtn.addEventListener('click', e => {
    e.stopPropagation();
    hapticFeedback('light');
    pronounceWord(targetText, lang.code, speakBtn);
  });
  actions.appendChild(speakBtn);

  if (w.example) {
    const speakExBtn = document.createElement('button');
    speakExBtn.className = 'speak-btn speak-btn-sm';
    speakExBtn.title = 'Pronounce sentence';
    speakExBtn.innerHTML = speakerIcon();
    speakExBtn.addEventListener('click', e => {
      e.stopPropagation();
      hapticFeedback('light');
      pronounceWord(w.example, lang.code, speakExBtn);
    });
    actions.appendChild(speakExBtn);
  }

  // replaced below by multi-example block — this speak button stays for first example

  const bmBtn = document.createElement('button');
  bmBtn.className = `bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`;
  bmBtn.innerHTML = isBookmarked ? '⭐' : '☆';
  bmBtn.addEventListener('click', e => {
    e.stopPropagation();
    hapticFeedback('light');
    toggleBookmark(w.id);
    const now = State.bookmarks.has(w.id);
    bmBtn.innerHTML = now ? '⭐' : '☆';
    bmBtn.classList.toggle('bookmarked', now);
  });
  actions.appendChild(bmBtn);
  details.appendChild(actions);

  const browseExamples = w.examples?.length ? w.examples
    : (w.example ? [{ target: w.example, native: w.exampleEn }] : []);
  browseExamples.forEach(ex => {
    if (!ex.target) return;
    const exBox = document.createElement('div');
    exBox.className = 'browse-example';
    if (ex.label) {
      const lbl = document.createElement('div');
      lbl.className = `example-label example-label-${ex.label.toLowerCase().replace(/\s+/g,'-')}`;
      lbl.textContent = ex.label.charAt(0).toUpperCase() + ex.label.slice(1);
      exBox.appendChild(lbl);
    }
    const exDe = document.createElement('div');
    exDe.className = 'browse-example-de';
    exDe.textContent = ex.target;
    exBox.appendChild(exDe);
    if (ex.native) {
      const exEn = document.createElement('div');
      exEn.className = 'browse-example-en';
      exEn.textContent = ex.native;
      exBox.appendChild(exEn);
    }
    details.appendChild(exBox);
  });

  item.appendChild(details);

  summary.addEventListener('click', () => {
    const wasExpanded = item.classList.contains('expanded');
    item.closest('.browse-list')?.querySelectorAll('.browse-word.expanded').forEach(el => {
      if (el !== item) el.classList.remove('expanded');
    });
    item.classList.toggle('expanded', !wasExpanded);
  });

  return item;
}

// ══════════════════════════════════════════════
//  LEVEL VIEW
// ══════════════════════════════════════════════
function openLevel(level) {
  State.currentLevel    = level;
  State.currentCategory = null;
  const lang  = getLang();
  const ids   = filterWords(level, null);
  const s     = SRS.getStats(ids, lang.code);
  const queue = SRS.buildQueue(ids, lang.code, 40);

  showScreen('level-view');
  setNavTitle(`${level} — ${lang.levelNames[level] || level}`);
  document.getElementById('nav-back').style.display = '';
  document.getElementById('review-level-sub').textContent =
    `${queue.length} cards · ${s.due} due · ${s.seen} seen`;
  document.getElementById('review-level-btn').onclick = () => {
    State.reviewMode = 'level';
    startReview(ids, level, null);
  };
  document.getElementById('browse-level-sub').textContent = `${ids.length} words in ${level}`;
  document.getElementById('browse-level-btn').onclick = () => openBrowse(level);
  renderCategories(level);
}

function renderCategories(level) {
  const list = document.getElementById('category-list');
  list.innerHTML = '';
  const lang = getLang();
  const cats = [...new Set(
    State.allWords.filter(w => w.level === level).map(w => w.category)
  )].sort();

  for (const cat of cats) {
    const ids  = filterWords(level, cat);
    const s    = SRS.getStats(ids, lang.code);
    const icon = CAT_ICONS[cat] || CAT_ICONS['default'];
    const card = document.createElement('div');
    card.className = `category-card ${s.due === 0 ? 'dimmed' : ''}`;
    card.innerHTML = `
      <div class="cat-icon">${icon}</div>
      <div class="cat-info">
        <div class="cat-name">${cat}</div>
        <div class="cat-sub">${ids.length} words · ${s.mastered} mastered</div>
      </div>
      ${s.due > 0
        ? `<div class="cat-due">${s.due} due</div>`
        : `<div class="cat-due" style="opacity:0.3">0 due</div>`}
      <div class="cat-arrow">›</div>`;
    card.addEventListener('click', () => {
      State.reviewMode = 'category';
      startReview(ids, level, cat);
    });
    list.appendChild(card);
  }
}

// ══════════════════════════════════════════════
//  REVIEW
// ══════════════════════════════════════════════
function startReview(wordIds, level, category) {
  const lang  = getLang();
  const queue = SRS.buildQueue(wordIds, lang.code, 40);
  if (!queue.length) { alert('No words to review right now!'); return; }

  State.currentLevel    = level;
  State.currentCategory = category;
  State.reviewQueue     = queue;
  State.reviewIndex     = 0;
  State.sessionStats    = { again: 0, good: 0, easy: 0 };
  State.cardRevealed    = false;
  State.swipeShown      = false;

  showScreen('review');
  const modeTitle = { 'smart-start': 'Smart Start', 'smart-review': 'Smart Review', 'bookmarks': 'Starred' };
  setNavTitle(category ? `${level} · ${category}` : level || modeTitle[State.reviewMode] || 'Review');
  document.getElementById('nav-back').style.display    = '';
  document.getElementById('nav-add').style.display     = 'none';
  document.getElementById('nav-settings').style.display = 'none';

  renderCard();
}

function renderCard() {
  const lang  = getLang();
  const total = State.reviewQueue.length;
  const idx   = State.reviewIndex;

  document.getElementById('review-progress-fill').style.width =
    (total > 0 ? Math.round((idx / total) * 100) : 0) + '%';
  document.getElementById('review-count').textContent = `${idx} / ${total}`;

  // Done check FIRST — before any DOM work
  if (idx >= total) { showDone(); return; }

  State.cardRevealed = false;
  const wordId    = State.reviewQueue[idx];
  const word      = wordById(wordId);
  if (!word) { State.reviewIndex++; renderCard(); return; }

  const cardState = SRS.getCardState(wordId, lang.code);
  const isNew     = SRS.isNew(cardState);

  const targetText    = word[lang.targetField] || '';
  const nativeText    = word[lang.nativeField]  || '';
  const pronunciation = word.pronunciation || '';
  const exampleTarget = word.example    || '';
  const exampleNative = word.exampleEn  || '';
  const allExamples   = word.examples?.length ? word.examples
                        : (exampleTarget ? [{ target: exampleTarget, native: exampleNative }] : []);
  // Phase 5 fields — safe defaults already set in loadLanguage
  const register      = word.register   || 'neutral';
  const isBookmarked  = State.bookmarks.has(wordId);

  function highlightExample(sentence, fullWord) {
    const clean = fullWord.replace(/^[\w\u00C0-\u024F]+\s+/i, '').trim();
    if (!clean || !sentence) return sentence || '';
    const esc = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return sentence.replace(new RegExp(`(${esc})`, 'gi'),
      '<span class="highlight-word">$1</span>');
  }
  const exHighlighted = highlightExample(exampleTarget, targetText);

  // ── Build DOM ──
  const area = document.getElementById('card-area');
  area.innerHTML = '';

  // Swipe hint (once per session)
  if (!State.swipeShown) {
    const hint = document.createElement('div');
    hint.className = 'swipe-instruction visible';
    hint.innerHTML = '← Again &nbsp;·&nbsp; swipe &nbsp;·&nbsp; Easy →';
    area.appendChild(hint);
    State.swipeShown = true;
    setTimeout(() => hint.classList.remove('visible'), 3000);
  }

  // ── Flashcard ──
  const flashcard = document.createElement('div');
  flashcard.className = 'flashcard';
  flashcard.id = 'flashcard';

  // Swipe colour overlays
  ['left','right'].forEach(dir => {
    const h = document.createElement('div');
    h.className = `swipe-hint swipe-hint-${dir}`;
    h.textContent = dir === 'left' ? '↶ Again' : 'Easy ↷';
    flashcard.appendChild(h);
  });

  // ── Card meta row ──
  const meta = document.createElement('div');
  meta.className = 'card-meta';

  const lvTag = document.createElement('span');
  lvTag.className = `card-level-tag tag-${levelBadgeClass(word.level)}`;
  lvTag.textContent = word.level;
  meta.appendChild(lvTag);

  const ctTag = document.createElement('span');
  ctTag.className = 'card-cat-tag';
  ctTag.textContent = word.category;
  meta.appendChild(ctTag);

  // Register badge — Phase 5 will populate; renders now when field present
  if (register !== 'neutral') {
    const regTag = document.createElement('span');
    regTag.className = `card-cat-tag register-tag register-${register}`;
    regTag.textContent = register === 'formal' ? '🎩 Formal' : '💬 Informal';
    meta.appendChild(regTag);
  }

  if (isNew) {
    const nTag = document.createElement('span');
    nTag.className = 'card-cat-tag new-tag';
    nTag.textContent = 'New';
    meta.appendChild(nTag);
  }

  // Bookmark button — top-right of meta (Phase 4 functional already)
  const bmBtn = document.createElement('button');
  bmBtn.className = `bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`;
  bmBtn.setAttribute('aria-label', isBookmarked ? 'Remove bookmark' : 'Bookmark');
  bmBtn.innerHTML = isBookmarked ? '⭐' : '☆';
  bmBtn.addEventListener('click', e => {
    e.stopPropagation();
    hapticFeedback('light');
    toggleBookmark(wordId);
    bmBtn.innerHTML = State.bookmarks.has(wordId) ? '⭐' : '☆';
    bmBtn.classList.toggle('bookmarked', State.bookmarks.has(wordId));
  });
  meta.appendChild(bmBtn);

  flashcard.appendChild(meta);

  // ── Card front ──
  const front = document.createElement('div');
  front.className = 'card-front';

  // Word + speak button row
  const wc = document.createElement('div');
  wc.className = 'german-word-container';

  const wordEl = document.createElement('div');
  wordEl.className = 'german-word';
  wordEl.id = 'target-word';
  wordEl.textContent = targetText;
  wc.appendChild(wordEl);

  const speakWordBtn = document.createElement('button');
  speakWordBtn.className = 'speak-btn';
  speakWordBtn.title = 'Pronounce word';
  speakWordBtn.setAttribute('aria-label', 'Pronounce word');
  speakWordBtn.innerHTML = speakerIcon();
  speakWordBtn.addEventListener('click', e => {
    e.stopPropagation();
    hapticFeedback('light');
    pronounceWord(targetText, lang.code, speakWordBtn);
  });
  wc.appendChild(speakWordBtn);
  front.appendChild(wc);

  if (pronunciation) {
    const pd = document.createElement('div');
    pd.className = 'pronunciation';
    pd.textContent = pronunciation;
    front.appendChild(pd);
  }

  // Example boxes — supports multiple labeled examples (e.g. formal / informal)
  allExamples.forEach((ex, i) => {
    if (!ex.target) return;
    const highlighted = i === 0 ? exHighlighted : highlightExample(ex.target, targetText);
    const exBox = document.createElement('div');
    exBox.className = 'example-box';

    if (ex.label) {
      const lbl = document.createElement('div');
      lbl.className = `example-label example-label-${ex.label.toLowerCase().replace(/\s+/g,'-')}`;
      lbl.textContent = ex.label.charAt(0).toUpperCase() + ex.label.slice(1);
      exBox.appendChild(lbl);
    }

    const exRow = document.createElement('div');
    exRow.className = 'example-row';

    const exDe = document.createElement('div');
    exDe.className = 'example-de';
    exDe.innerHTML = highlighted;
    exRow.appendChild(exDe);

    const speakExBtn = document.createElement('button');
    speakExBtn.className = 'speak-btn speak-btn-sm';
    speakExBtn.title = 'Pronounce sentence';
    speakExBtn.setAttribute('aria-label', 'Pronounce sentence');
    speakExBtn.innerHTML = speakerIcon();
    speakExBtn.addEventListener('click', e => {
      e.stopPropagation();
      hapticFeedback('light');
      pronounceWord(ex.target, lang.code, speakExBtn);
    });
    exRow.appendChild(speakExBtn);
    exBox.appendChild(exRow);

    const exEn = document.createElement('div');
    exEn.className = 'example-en';
    if (i === 0) exEn.id = 'ex-native';
    exEn.textContent = ex.native || '';
    exBox.appendChild(exEn);

    front.appendChild(exBox);
  });
  flashcard.appendChild(front);

  // ── Card back ──
  const back = document.createElement('div');
  back.className = 'card-back';
  back.id = 'card-back';
  const divEl = document.createElement('div'); divEl.className = 'divider'; back.appendChild(divEl);
  const th    = document.createElement('div'); th.className = 'translation-hint'; th.textContent = 'Translation'; back.appendChild(th);
  const tr    = document.createElement('div'); tr.className = 'translation'; tr.textContent = nativeText; back.appendChild(tr);

  // Phase 5 — register pair flip button slot (renders when registerPair present)
  if (word.registerPair) {
    const flipBtn = document.createElement('button');
    flipBtn.className = 'register-flip-btn';
    flipBtn.textContent = register === 'formal' ? '💬 Show informal form' : '🎩 Show formal form';
    flipBtn.addEventListener('click', e => {
      e.stopPropagation();
      const pair = wordById(word.registerPair);
      if (pair) {
        tr.textContent = pair[lang.targetField] || nativeText;
        flipBtn.textContent = 'Back to original';
      }
    });
    back.appendChild(flipBtn);
  }

  flashcard.appendChild(back);

  // Tap hint
  const tapHint = document.createElement('div');
  tapHint.className = 'tap-hint';
  tapHint.id = 'tap-hint';
  tapHint.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg> Tap to reveal`;
  flashcard.appendChild(tapHint);

  area.appendChild(flashcard);

  // Reveal button
  const revealBtn = document.createElement('button');
  revealBtn.className = 'reveal-btn';
  revealBtn.id = 'reveal-btn';
  revealBtn.textContent = 'Show Answer';
  area.appendChild(revealBtn);

  // Answer buttons
  const answerBtns = document.createElement('div');
  answerBtns.className = 'answer-btns';
  answerBtns.id = 'answer-btns';
  answerBtns.style.display = 'none';
  [
    { cls:'btn-again', q:'again', label:'Again', sub:'10 min' },
    { cls:'btn-good',  q:'good',  label:'Good',  sub:`+${getNextInterval(cardState,'good')}d` },
    { cls:'btn-easy',  q:'easy',  label:'Easy',  sub:`+${getNextInterval(cardState,'easy')}d` },
  ].forEach(({ cls, q, label, sub }) => {
    const b = document.createElement('button');
    b.className = `answer-btn ${cls}`;
    b.innerHTML = `${label} <span class="btn-sub">${sub}</span>`;
    b.addEventListener('click', e => {
      e.stopPropagation();
      hapticFeedback('medium');
      handleAnswer(q);
    });
    answerBtns.appendChild(b);
  });
  area.appendChild(answerBtns);

  // ── Events ──
  flashcard.addEventListener('click', revealCard);
  revealBtn.addEventListener('click', revealCard);
  setupWordTooltip(wordEl, nativeText);

  area.querySelectorAll('.highlight-word').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('ex-native')?.classList.toggle('visible');
    });
    el.addEventListener('mouseenter', e => {
      e.stopPropagation();
      document.getElementById('ex-native')?.classList.add('visible');
    });
    el.addEventListener('mouseleave', () => {
      if (!State.cardRevealed)
        document.getElementById('ex-native')?.classList.remove('visible');
    });
  });

  // ── Swipe gestures ──
  let tStartX = 0, tStartY = 0;
  flashcard.addEventListener('touchstart', e => {
    tStartX = e.touches[0].clientX;
    tStartY = e.touches[0].clientY;
  }, { passive: true });

  flashcard.addEventListener('touchmove', e => {
    if (!State.cardRevealed) return;
    const dx = e.touches[0].clientX - tStartX;
    const dy = Math.abs(e.touches[0].clientY - tStartY);
    if (Math.abs(dx) > dy * 1.5) {
      flashcard.classList.toggle('swiping-left',  dx < -30);
      flashcard.classList.toggle('swiping-right', dx >  30);
      if (Math.abs(dx) > 30) e.preventDefault();
    }
  }, { passive: false });

  flashcard.addEventListener('touchend', e => {
    if (!State.cardRevealed) return;
    const dx = e.changedTouches[0].clientX - tStartX;
    flashcard.classList.remove('swiping-left', 'swiping-right');
    if (Math.abs(dx) > 80) {
      hapticFeedback('medium');
      handleAnswer(dx < 0 ? 'again' : 'easy');
    }
  });
}

function speakerIcon() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>`;
}

function getNextInterval(state, quality) {
  if (!state || state.reps === 0) return quality === 'good' ? 1 : 3;
  const i = state.interval || 1, e = state.ease || 2.5;
  return quality === 'good' ? Math.round(i * e) : Math.round(i * e * 1.3);
}

// ══════════════════════════════════════════════
//  TEXT-TO-SPEECH  (word + sentence)
// ══════════════════════════════════════════════
function pronounceWord(text, langCode, btnEl, forceVoice) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();

  const targetLang = SPEAK_LANG_MAP[langCode] || 'de-DE';
  const langPrefix = targetLang.split('-')[0];

  function speak() {
    const voices    = speechSynthesis.getVoices();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang   = targetLang;
    utterance.rate   = 0.85;
    utterance.pitch  = 1.0;
    utterance.volume = 1.0;

    // Voice selection priority:
    // 1. Explicitly forced voice (voice selector preview)
    // 2. User's saved preference
    // 3. Exact locale match (de-DE)
    // 4. Language prefix match (de-*)
    // 5. Browser default
    const voice =
      forceVoice ||
      State.preferredVoice ||
      voices.find(v => v.lang === targetLang) ||
      voices.find(v => v.lang.startsWith(langPrefix));
    if (voice) utterance.voice = voice;

    if (btnEl) {
      btnEl.classList.add('speaking');
      utterance.onend   = () => btnEl.classList.remove('speaking');
      utterance.onerror = () => btnEl.classList.remove('speaking');
    }

    speechSynthesis.speak(utterance);
  }

  // iOS loads voices lazily
  if (speechSynthesis.getVoices().length > 0) {
    speak();
  } else {
    speechSynthesis.onvoiceschanged = () => {
      speechSynthesis.onvoiceschanged = null;
      speak();
    };
  }
}

// ══════════════════════════════════════════════
//  CARD ACTIONS
// ══════════════════════════════════════════════
function revealCard() {
  if (State.cardRevealed) return;
  State.cardRevealed = true;
  hapticFeedback('light');
  document.getElementById('card-back').classList.add('revealed');
  document.getElementById('tap-hint').style.display     = 'none';
  document.getElementById('reveal-btn').style.display   = 'none';
  document.getElementById('answer-btns').style.display  = 'grid';
  document.getElementById('ex-native')?.classList.add('visible');
}

function handleAnswer(quality) {
  const wordId = State.reviewQueue[State.reviewIndex];
  SRS.answer(wordId, quality, getLang().code);
  State.sessionStats[quality]++;
  if (quality === 'again') {
    const rest = State.reviewQueue.slice(State.reviewIndex + 1);
    if (!rest.includes(wordId)) State.reviewQueue.push(wordId);
  }
  State.reviewIndex++;
  renderCard();
}

function showDone() {
  updateStreakOnSessionComplete();
  showScreen('done-view');
  setNavTitle('Session Done');
  document.getElementById('nav-add').style.display      = '';
  document.getElementById('nav-settings').style.display = '';
  document.getElementById('done-again').textContent     = State.sessionStats.again;
  document.getElementById('done-good').textContent      = State.sessionStats.good;
  document.getElementById('done-easy').textContent      = State.sessionStats.easy;
  const total = Object.values(State.sessionStats).reduce((a,b) => a+b, 0);
  document.getElementById('done-sub').textContent = `You reviewed ${total} cards. Keep it up!`;
}

// ══════════════════════════════════════════════
//  HAPTIC
// ══════════════════════════════════════════════
const _hapticCtx = { ctx: null };
function hapticFeedback(intensity = 'light') {
  if (navigator.vibrate) { navigator.vibrate(intensity === 'medium' ? 12 : 6); return; }
  try {
    if (!_hapticCtx.ctx)
      _hapticCtx.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _hapticCtx.ctx;
    if (ctx.state === 'suspended') ctx.resume();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    osc.frequency.value = 1;
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.01);
  } catch (_) {}
}

// ══════════════════════════════════════════════
//  WORD TOOLTIP
// ══════════════════════════════════════════════
function setupWordTooltip(el, label) {
  if (!el) return;
  const tooltip = document.getElementById('word-tooltip');
  const show = e => { tooltip.textContent = label; tooltip.classList.add('show'); pos(e); };
  const hide = () => tooltip.classList.remove('show');
  const pos  = e => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    tooltip.style.left = Math.min(x - 40, window.innerWidth - 180) + 'px';
    tooltip.style.top  = (y - 44) + 'px';
  };
  el.addEventListener('mouseenter', show);
  el.addEventListener('mousemove', pos);
  el.addEventListener('mouseleave', hide);
  el.addEventListener('touchstart', e => { show(e); e.stopPropagation(); }, { passive: true });
  el.addEventListener('touchend', () => setTimeout(hide, 700));
}

// ══════════════════════════════════════════════
//  ADD WORD
// ══════════════════════════════════════════════
function bindAdd() {
  document.getElementById('nav-add').addEventListener('click', () => {
    const lang = getLang();
    if (!lang) return;
    // Populate level select from active language
    document.getElementById('inp-level').innerHTML = lang.levels.map(l =>
      `<option value="${l}">${l} — ${lang.levelNames[l] || l}</option>`
    ).join('');
    // Populate category select — all 14 Phase-5 categories pre-listed
    document.getElementById('inp-cat').innerHTML = Object.keys(CAT_ICONS)
      .filter(k => k !== 'default')
      .map(c => `<option>${c}</option>`).join('');

    showScreen('add-view');
    setNavTitle('Add Word');
    document.getElementById('nav-back').style.display      = '';
    document.getElementById('nav-add').style.display       = 'none';
    document.getElementById('nav-settings').style.display  = 'none';
    document.getElementById('save-feedback').textContent   = '';
    document.getElementById('inp-target-label').textContent =
      `${lang.name} Word${lang.notes ? ' (' + lang.notes + ')' : ''}`;
  });

  document.getElementById('save-btn').addEventListener('click', () => {
    const lang      = getLang();
    const targetVal = document.getElementById('inp-de').value.trim();
    const nativeVal = document.getElementById('inp-en').value.trim();
    const pron      = document.getElementById('inp-pron').value.trim();
    const level     = document.getElementById('inp-level').value;
    const cat       = document.getElementById('inp-cat').value;
    const ex        = document.getElementById('inp-ex').value.trim();
    const exen      = document.getElementById('inp-exen').value.trim();
    const feedback  = document.getElementById('save-feedback');

    if (!targetVal || !nativeVal) {
      feedback.textContent = '⚠️ Word and translation are required.';
      return;
    }
    const word = {
      [lang.targetField]: targetVal,
      [lang.nativeField]: nativeVal,
      pronunciation: pron || '—',
      level, category: cat,
      example:   ex   || `${targetVal}.`,
      exampleEn: exen || `${nativeVal}.`,
      register:  'neutral',
      difficulty: 3,
      tags: [],
      registerPair: null,
    };
    try {
      const id = SRS.addCustomWord(word, lang.code);
      State.allWords.push({ ...word, id });
      ['inp-de','inp-en','inp-pron','inp-ex','inp-exen'].forEach(i =>
        document.getElementById(i).value = '');
      feedback.textContent = '✓ Word saved!';
      setTimeout(() => feedback.textContent = '', 2500);
    } catch (e) {
      feedback.textContent = '⚠️ Failed to save. Storage may be full.';
    }
  });
}

// ══════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════
function bindNav() {
  document.getElementById('nav-back').addEventListener('click', () => {
    const id = document.querySelector('.screen.active')?.id;
    if (!id) return;
    if      (id === 'lang-pick')  {}
    else if (id === 'home')       { if (LANGUAGE_REGISTRY.length > 1) showLanguagePicker(); }
    else if (id === 'level-view') goHome();
    else if (id === 'review')     {
      document.getElementById('nav-add').style.display      = '';
      document.getElementById('nav-settings').style.display = '';
      speechSynthesis?.cancel();
      State.currentLevel ? openLevel(State.currentLevel) : goHome();
    }
    else if (id === 'add-view' || id === 'done-view') {
      document.getElementById('nav-add').style.display      = '';
      document.getElementById('nav-settings').style.display = '';
      goHome();
    }
  });
  document.getElementById('done-home-btn').addEventListener('click', goHome);
}

function goHome() {
  speechSynthesis?.cancel();
  renderHome();
  showScreen('home');
  updateNavForHome();
}

function updateNavForHome() {
  const lang = getLang();
  setNavTitle(`${lang.flag} ${lang.name}`);
  document.getElementById('nav-back').style.display =
    LANGUAGE_REGISTRY.length > 1 ? '' : 'none';
  document.getElementById('nav-add').style.display      = '';
  document.getElementById('nav-settings').style.display = '';
}

function setNavTitle(text) {
  document.getElementById('nav-title').textContent    = text;
  document.getElementById('nav-title').style.display  = '';
  document.getElementById('nav-wordmark').style.display = 'none';
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showError(msg) {
  document.getElementById('loading-screen').classList.add('hidden');
  document.body.innerHTML = `<div style="padding:48px 24px;text-align:center;font-family:sans-serif">
    <div style="font-size:40px">⚠️</div>
    <div style="margin-top:16px;font-size:16px;line-height:1.6;color:#c0392b">${msg}</div>
    <button onclick="location.reload()" style="margin-top:24px;padding:12px 28px;background:#2d6a4f;color:#fff;border:none;border-radius:12px;font-size:15px;cursor:pointer">Retry</button>
  </div>`;
}

// ══════════════════════════════════════════════
//  STREAK
// ══════════════════════════════════════════════
function loadStreakData() {
  State.lastReviewDate = localStorage.getItem('lastReviewDate');
  State.streakCount    = parseInt(localStorage.getItem('streakCount') || '0', 10);
}
function updateStreakDisplay() {
  const banner = document.getElementById('streak-banner');
  if (State.streakCount > 0) {
    banner.classList.add('visible');
    document.getElementById('streak-count').textContent =
      `${State.streakCount} ${State.streakCount === 1 ? 'day' : 'days'} streak 🔥`;
  } else {
    banner.classList.remove('visible');
  }
}
function updateStreakOnSessionComplete() {
  const today     = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (State.lastReviewDate === today) return;
  State.streakCount = State.lastReviewDate === yesterday.toDateString()
    ? State.streakCount + 1 : 1;
  State.lastReviewDate = today;
  localStorage.setItem('lastReviewDate', today);
  localStorage.setItem('streakCount', State.streakCount.toString());
}

// ══════════════════════════════════════════════
//  START
// ══════════════════════════════════════════════
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    boot().catch(err => showError('App failed to start.<br>' + err.message));
    if ('serviceWorker' in navigator)
      navigator.serviceWorker.register('sw.js').catch(() => {});
  });
} else {
  boot().catch(err => showError('App failed to start.<br>' + err.message));
  if ('serviceWorker' in navigator)
    navigator.serviceWorker.register('sw.js').catch(() => {});
}
