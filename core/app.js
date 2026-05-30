// ── Flashcard App — Language-Agnostic Core ──
// Language data comes from LANGUAGE_REGISTRY (core/languages.js)
// Word data comes from the active language's words.js
// Adding a new language requires zero changes to this file.

const CAT_ICONS = {
  'People & Family': '👥',
  'Food & Drink':    '🍽️',
  'Travel':          '✈️',
  'Work':            '💼',
  'Body':            '🫀',
  'Nature':          '🌿',
  'Emotions':        '💭',
  'Colors':          '🎨',
  'Places':          '📍',
  'Numbers':         '🔢',
  'Time':            '🕐',
  // Fallback for custom categories in future languages
  'default':         '📌',
};

// ── App State ──
const State = {
  activeLang: null,       // language config object from registry
  allWords: [],           // merged built-in + custom words
  currentLevel: null,
  currentCategory: null,
  reviewQueue: [],
  reviewIndex: 0,
  sessionStats: { again: 0, good: 0, easy: 0 },
  cardRevealed: false,
};

// ── Boot ──
function boot() {
  if (LANGUAGE_REGISTRY.length === 0) {
    showError('No languages configured. Check core/languages.js.');
    return;
  }
  if (LANGUAGE_REGISTRY.length === 1) {
    // Single language — skip picker, go straight to home
    activateLanguage(LANGUAGE_REGISTRY[0]);
  } else {
    showLanguagePicker();
  }
  bindNav();
  bindAdd();
}

// ── Activate a language ──
function activateLanguage(lang) {
  State.activeLang = lang;
  // WORDS is the global from the loaded words.js
  const custom = SRS.getCustomWords(lang.code);
  State.allWords = [...WORDS, ...custom];
  document.documentElement.dir = lang.dir || 'ltr';
  renderHome();
  showScreen('home');
  updateNavForHome();
}

// ── Language Picker (shown when >1 language available) ──
function showLanguagePicker() {
  const screen = document.getElementById('lang-pick');
  screen.innerHTML = '';

  const title = document.createElement('div');
  title.className = 'home-header';
  title.innerHTML = '<h1>Flashcards</h1><p>Choose a language to study</p>';
  screen.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'level-grid';

  for (const lang of LANGUAGE_REGISTRY) {
    const card = document.createElement('div');
    card.className = 'level-card';
    card.innerHTML = `
      <div class="level-badge" style="font-size:24px;background:var(--surface2)">${lang.flag}</div>
      <div class="level-info">
        <div class="level-name">${lang.name}</div>
        <div class="level-sub">${lang.nativeName} · ${lang.wordCount} words · ${lang.levelSystem}</div>
      </div>
      <div class="level-arrow">›</div>
    `;
    card.addEventListener('click', () => loadLanguage(lang));
    grid.appendChild(card);
  }
  screen.appendChild(grid);
  showScreen('lang-pick');
  document.getElementById('nav-title').textContent = '📚 Flashcards';
  document.getElementById('nav-back').style.display = 'none';
}

// Dynamically load a language's word file
function loadLanguage(lang) {
  // Remove previously loaded language script if any
  const old = document.getElementById('lang-script');
  if (old) old.remove();

  const script = document.createElement('script');
  script.id = 'lang-script';
  script.src = lang.script;
  script.onload = () => activateLanguage(lang);
  script.onerror = () => showError(`Failed to load ${lang.name} word list.`);
  document.body.appendChild(script);
}

// ── Helpers ──
function filterWords(level, category) {
  return State.allWords
    .filter(w => (!level || w.level === level) && (!category || w.category === category))
    .map(w => w.id);
}

function wordById(id) {
  return State.allWords.find(w => w.id == id);
}

function getLang() { return State.activeLang; }

function levelBadgeClass(level) {
  // Map level codes to CSS classes generically
  const map = { A1:'a1', A2:'a2', B1:'b1', B2:'b2', N5:'a1', N4:'a2', N3:'b1', N2:'b2', N1:'c1' };
  return map[level] || 'a1';
}

// ── Home ──
function renderHome() {
  const lang = getLang();
  const allIds = State.allWords.map(w => w.id);
  const stats = SRS.getStats(allIds, lang.code);

  document.getElementById('nav-title').textContent = `${lang.flag} ${lang.name}`;
  document.getElementById('stat-total').textContent = stats.seen;
  document.getElementById('stat-mastered').textContent = stats.mastered;
  document.getElementById('stat-due').textContent = stats.due;

  // Subtitle
  const subtitle = document.getElementById('home-subtitle');
  subtitle.textContent = `${State.allWords.length} words · ${lang.levelSystem} · Smart review`;

  const grid = document.getElementById('level-grid');
  grid.innerHTML = '';

  for (const lvl of lang.levels) {
    const ids = filterWords(lvl, null);
    if (ids.length === 0) continue;
    const s = SRS.getStats(ids, lang.code);
    const pct = ids.length ? Math.round((s.mastered / ids.length) * 100) : 0;
    const name = lang.levelNames[lvl] || lvl;

    const card = document.createElement('div');
    card.className = 'level-card';
    card.innerHTML = `
      <div class="level-badge badge-${levelBadgeClass(lvl)}">${lvl}</div>
      <div class="level-info">
        <div class="level-name">${lvl} — ${name}</div>
        <div class="level-sub">${ids.length} words · ${s.mastered} mastered</div>
        <div class="level-progress">
          <div class="level-progress-fill" style="width:${pct}%"></div>
        </div>
      </div>
      ${s.due > 0 ? `<div class="due-badge">${s.due} due</div>` : ''}
      <div class="level-arrow">›</div>
    `;
    card.addEventListener('click', () => openLevel(lvl));
    grid.appendChild(card);
  }
}

// ── Level View ──
function openLevel(level) {
  State.currentLevel = level;
  State.currentCategory = null;
  const lang = getLang();
  const name = lang.levelNames[level] || level;

  showScreen('level-view');
  document.getElementById('nav-title').textContent = `${level} — ${name}`;
  document.getElementById('nav-back').style.display = '';

  const levelIds = filterWords(level, null);
  const s = SRS.getStats(levelIds, lang.code);
  const queue = SRS.buildQueue(levelIds, lang.code, 40);

  const btn = document.getElementById('review-level-btn');
  document.getElementById('review-level-sub').textContent =
    `${queue.length} cards · ${s.due} due · ${s.seen} seen`;
  btn.onclick = () => startReview(levelIds, level, null);

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
    const ids = filterWords(level, cat);
    const s = SRS.getStats(ids, lang.code);
    const icon = CAT_ICONS[cat] || CAT_ICONS['default'];

    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
      <div class="cat-icon">${icon}</div>
      <div class="cat-info">
        <div class="cat-name">${cat}</div>
        <div class="cat-sub">${ids.length} words · ${s.mastered} mastered</div>
      </div>
      ${s.due > 0 ? `<div class="cat-due">${s.due} due</div>` : ''}
      <div class="cat-arrow">›</div>
    `;
    card.addEventListener('click', () => startReview(ids, level, cat));
    list.appendChild(card);
  }
}

// ── Review ──
function startReview(wordIds, level, category) {
  const lang = getLang();
  const queue = SRS.buildQueue(wordIds, lang.code, 40);
  if (queue.length === 0) { alert('No words to review right now!'); return; }

  State.currentLevel = level;
  State.currentCategory = category;
  State.reviewQueue = queue;
  State.reviewIndex = 0;
  State.sessionStats = { again: 0, good: 0, easy: 0 };
  State.cardRevealed = false;

  showScreen('review');
  document.getElementById('nav-title').textContent = category
    ? `${level} · ${category}` : level;
  document.getElementById('nav-back').style.display = '';
  document.getElementById('nav-add').style.display = 'none';

  renderCard();
}

function renderCard() {
  const lang = getLang();
  const { reviewQueue, reviewIndex } = State;
  const total = reviewQueue.length;

  document.getElementById('review-progress-fill').style.width =
    (total > 0 ? Math.round((reviewIndex / total) * 100) : 0) + '%';
  document.getElementById('review-count').textContent = `${reviewIndex} / ${total}`;

  if (reviewIndex >= total) { showDone(); return; }

  State.cardRevealed = false;
  const wordId = reviewQueue[reviewIndex];
  const word = wordById(wordId);
  if (!word) { State.reviewIndex++; renderCard(); return; }

  const cardState = SRS.getCardState(wordId, lang.code);
  const isNew = SRS.isNew(cardState);

  // The word in the target language
  const targetText  = word[lang.targetField] || word.de || '';
  const nativeText  = word[lang.nativeField] || word.en || '';
  const pronunciation = word.pronunciation || '';
  const exampleTarget = word.example || '';
  const exampleNative = word.exampleEn || '';

  // Highlight the root word in the example sentence
  function highlightExample(sentence, fullWord) {
    const clean = fullWord.replace(/^[\w]+\s+/i, '').trim(); // strip article
    if (!clean || !sentence) return sentence || '';
    const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return sentence.replace(
      new RegExp(`(${escaped})`, 'gi'),
      '<span class="highlight-word">$1</span>'
    );
  }

  const exHighlighted = highlightExample(exampleTarget, targetText);

  const area = document.getElementById('card-area');
  area.innerHTML = `
    <div class="flashcard" id="flashcard">
      <div class="card-meta">
        <span class="card-level-tag tag-${levelBadgeClass(word.level)}">${word.level}</span>
        <span class="card-cat-tag">${word.category}</span>
        ${isNew ? '<span class="card-cat-tag new-tag">New</span>' : ''}
      </div>

      <div class="card-front">
        <div class="german-word" id="target-word">${targetText}</div>
        ${pronunciation ? `<div class="pronunciation">${pronunciation}</div>` : ''}
        ${exampleTarget ? `
        <div class="example-box">
          <div class="example-de">${exHighlighted}</div>
          <div class="example-en" id="ex-native">${exampleNative}</div>
        </div>` : ''}
      </div>

      <div class="card-back" id="card-back">
        <div class="divider"></div>
        <div class="translation-hint">Translation</div>
        <div class="translation">${nativeText}</div>
      </div>

      <div class="tap-hint" id="tap-hint">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        Tap to reveal
      </div>
    </div>

    <button class="reveal-btn" id="reveal-btn">Show Answer</button>

    <div class="answer-btns" id="answer-btns" style="display:none">
      <button class="answer-btn btn-again" data-q="again">
        Again <span class="btn-sub">10 min</span>
      </button>
      <button class="answer-btn btn-good" data-q="good">
        Good <span class="btn-sub">+${getNextInterval(cardState,'good')}d</span>
      </button>
      <button class="answer-btn btn-easy" data-q="easy">
        Easy <span class="btn-sub">+${getNextInterval(cardState,'easy')}d</span>
      </button>
    </div>
  `;

  document.getElementById('flashcard').addEventListener('click', revealCard);
  document.getElementById('reveal-btn').addEventListener('click', revealCard);

  // Word tooltip (tap/hover shows translation)
  setupWordTooltip(document.getElementById('target-word'), nativeText);

  // Example sentence highlight toggles native translation
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

  area.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      handleAnswer(btn.dataset.q);
    });
  });
}

function getNextInterval(state, quality) {
  if (!state || state.reps === 0) return quality === 'good' ? 1 : 3;
  const interval = state.interval || 1;
  const ease = state.ease || 2.5;
  return quality === 'good'
    ? Math.round(interval * ease)
    : Math.round(interval * ease * 1.3);
}

function revealCard() {
  if (State.cardRevealed) return;
  State.cardRevealed = true;
  document.getElementById('card-back').classList.add('revealed');
  document.getElementById('tap-hint').style.display = 'none';
  document.getElementById('reveal-btn').style.display = 'none';
  document.getElementById('answer-btns').style.display = 'grid';
  document.getElementById('ex-native')?.classList.add('visible');
}

function handleAnswer(quality) {
  const lang = getLang();
  const wordId = State.reviewQueue[State.reviewIndex];
  SRS.answer(wordId, quality, lang.code);
  State.sessionStats[quality]++;

  if (quality === 'again') {
    const rest = State.reviewQueue.slice(State.reviewIndex + 1);
    if (!rest.includes(wordId)) State.reviewQueue.push(wordId);
  }

  State.reviewIndex++;
  renderCard();
}

function showDone() {
  showScreen('done-view');
  document.getElementById('nav-title').textContent = 'Session Done';
  document.getElementById('nav-add').style.display = '';
  document.getElementById('done-again').textContent = State.sessionStats.again;
  document.getElementById('done-good').textContent = State.sessionStats.good;
  document.getElementById('done-easy').textContent = State.sessionStats.easy;
  const total = Object.values(State.sessionStats).reduce((a,b) => a+b, 0);
  document.getElementById('done-sub').textContent = `You reviewed ${total} cards. Keep it up!`;
}

// ── Word Tooltip ──
function setupWordTooltip(el, label) {
  if (!el) return;
  const tooltip = document.getElementById('word-tooltip');

  const show = e => {
    tooltip.textContent = label;
    tooltip.classList.add('show');
    position(e);
  };
  const hide = () => tooltip.classList.remove('show');
  const position = e => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    tooltip.style.left = Math.min(x - 40, window.innerWidth - 180) + 'px';
    tooltip.style.top = (y - 44) + 'px';
  };

  el.addEventListener('mouseenter', show);
  el.addEventListener('mousemove', position);
  el.addEventListener('mouseleave', hide);
  el.addEventListener('touchstart', e => { show(e); e.stopPropagation(); }, { passive: true });
  el.addEventListener('touchend', () => setTimeout(hide, 700));
}

// ── Add Word ──
function bindAdd() {
  document.getElementById('nav-add').addEventListener('click', () => {
    const lang = getLang();
    if (!lang) return;

    // Populate level options from active language
    const lvlSel = document.getElementById('inp-level');
    lvlSel.innerHTML = lang.levels.map(l =>
      `<option value="${l}">${l} — ${lang.levelNames[l] || l}</option>`
    ).join('');

    showScreen('add-view');
    document.getElementById('nav-title').textContent = 'Add Word';
    document.getElementById('nav-back').style.display = '';
    document.getElementById('nav-add').style.display = 'none';
    document.getElementById('save-feedback').textContent = '';
    document.getElementById('inp-target-label').textContent =
      `${lang.name} Word ${lang.notes ? '(' + lang.notes + ')' : ''}`;
  });

  document.getElementById('save-btn').addEventListener('click', () => {
    const lang = getLang();
    const targetVal = document.getElementById('inp-de').value.trim();
    const nativeVal = document.getElementById('inp-en').value.trim();
    const pron  = document.getElementById('inp-pron').value.trim();
    const level = document.getElementById('inp-level').value;
    const cat   = document.getElementById('inp-cat').value;
    const ex    = document.getElementById('inp-ex').value.trim();
    const exen  = document.getElementById('inp-exen').value.trim();

    if (!targetVal || !nativeVal) {
      document.getElementById('save-feedback').textContent = '⚠️ Both fields are required.';
      return;
    }

    const word = {
      [lang.targetField]: targetVal,
      [lang.nativeField]: nativeVal,
      pronunciation: pron || '—',
      level, category: cat,
      example: ex || `${targetVal}.`,
      exampleEn: exen || `${nativeVal}.`,
    };

    const id = SRS.addCustomWord(word, lang.code);
    State.allWords.push({ ...word, id });

    ['inp-de','inp-en','inp-pron','inp-ex','inp-exen'].forEach(i => {
      document.getElementById(i).value = '';
    });
    document.getElementById('save-feedback').textContent = '✓ Word saved!';
    setTimeout(() => document.getElementById('save-feedback').textContent = '', 2500);
  });
}

// ── Navigation ──
function bindNav() {
  document.getElementById('nav-back').addEventListener('click', () => {
    const id = document.querySelector('.screen.active')?.id;
    if (!id) return;

    if (id === 'lang-pick') { /* already at root */ }
    else if (id === 'home') {
      if (LANGUAGE_REGISTRY.length > 1) showLanguagePicker();
    }
    else if (id === 'level-view') goHome();
    else if (id === 'review') {
      document.getElementById('nav-add').style.display = '';
      State.currentLevel ? openLevel(State.currentLevel) : goHome();
    }
    else if (id === 'add-view' || id === 'done-view') {
      document.getElementById('nav-add').style.display = '';
      goHome();
    }
  });

  document.getElementById('done-home-btn').addEventListener('click', goHome);
}

function goHome() {
  renderHome();
  showScreen('home');
  updateNavForHome();
}

function updateNavForHome() {
  const lang = getLang();
  document.getElementById('nav-title').textContent = `${lang.flag} ${lang.name}`;
  document.getElementById('nav-back').style.display =
    LANGUAGE_REGISTRY.length > 1 ? '' : 'none';
  document.getElementById('nav-add').style.display = '';
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showError(msg) {
  document.body.innerHTML = `<div style="padding:40px;text-align:center;color:#c0392b;font-family:sans-serif">
    <div style="font-size:32px">⚠️</div><div style="margin-top:12px">${msg}</div>
  </div>`;
}

// ── Start ──
boot();
