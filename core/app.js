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
async function boot() {
  if (LANGUAGE_REGISTRY.length === 0) {
    showError('No languages configured. Check core/languages.js.');
    return;
  }
  if (LANGUAGE_REGISTRY.length === 1) {
    // Single language — skip picker, load and activate
    await loadLanguage(LANGUAGE_REGISTRY[0]);
  } else {
    showLanguagePicker();
  }
  bindNav();
  bindAdd();
}

// ── Activate a language ──
function activateLanguage(lang, loadedWords) {
  State.activeLang = lang;
  // loadedWords comes from JSON files
  const custom = SRS.getCustomWords(lang.code);
  State.allWords = [...(loadedWords || []), ...custom];
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

// Dynamically load a language's JSON data files
async function loadLanguage(lang) {
  try {
    // Load all JSON files for this language
    const promises = lang.dataFiles.map(file =>
      fetch(file).then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load ${file}: ${response.statusText}`);
        }
        return response.json();
      })
    );
    
    const levelData = await Promise.all(promises);
    
    // Merge all words from all levels
    const allWords = [];
    levelData.forEach(data => {
      data.words.forEach(word => {
        // Convert new format to internal format
        const convertedWord = {
          id: word.id,
          level: data.level,
          category: word.category,
          [lang.targetField]: word.target,
          [lang.nativeField]: word.native,
          pronunciation: word.pronunciation,
          example: word.examples && word.examples[0] ? word.examples[0].target : '',
          exampleEn: word.examples && word.examples[0] ? word.examples[0].native : ''
        };
        allWords.push(convertedWord);
      });
    });
    
    console.log(`[App] Loaded ${allWords.length} words for ${lang.name}`);
    activateLanguage(lang, allWords);
    
  } catch (error) {
    console.error(`[App] Failed to load ${lang.name} word list:`, error);
    showError(`Failed to load ${lang.name} word list. Please check your connection and try again.`);
  }
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
  
  // Create flashcard structure safely using DOM methods
  const flashcard = document.createElement('div');
  flashcard.className = 'flashcard';
  flashcard.id = 'flashcard';
  
  // Card meta
  const cardMeta = document.createElement('div');
  cardMeta.className = 'card-meta';
  
  const levelTag = document.createElement('span');
  levelTag.className = `card-level-tag tag-${levelBadgeClass(word.level)}`;
  levelTag.textContent = word.level;
  cardMeta.appendChild(levelTag);
  
  const catTag = document.createElement('span');
  catTag.className = 'card-cat-tag';
  catTag.textContent = word.category;
  cardMeta.appendChild(catTag);
  
  if (isNew) {
    const newTag = document.createElement('span');
    newTag.className = 'card-cat-tag new-tag';
    newTag.textContent = 'New';
    cardMeta.appendChild(newTag);
  }
  
  flashcard.appendChild(cardMeta);
  
  // Card front
  const cardFront = document.createElement('div');
  cardFront.className = 'card-front';
  
  const wordContainer = document.createElement('div');
  wordContainer.className = 'german-word-container';
  
  const germanWord = document.createElement('div');
  germanWord.className = 'german-word';
  germanWord.id = 'target-word';
  germanWord.textContent = targetText;
  wordContainer.appendChild(germanWord);
  
  const speakBtn = document.createElement('button');
  speakBtn.className = 'speak-btn';
  speakBtn.id = 'speak-btn';
  speakBtn.title = 'Pronounce';
  speakBtn.setAttribute('aria-label', 'Pronounce word');
  speakBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>`;
  wordContainer.appendChild(speakBtn);
  
  cardFront.appendChild(wordContainer);
  
  if (pronunciation) {
    const pronDiv = document.createElement('div');
    pronDiv.className = 'pronunciation';
    pronDiv.textContent = pronunciation;
    cardFront.appendChild(pronDiv);
  }
  
  if (exampleTarget) {
    const exampleBox = document.createElement('div');
    exampleBox.className = 'example-box';
    
    const exampleDe = document.createElement('div');
    exampleDe.className = 'example-de';
    exampleDe.innerHTML = exHighlighted; // This is safe as it's already sanitized by highlightExample
    exampleBox.appendChild(exampleDe);
    
    const exampleEn = document.createElement('div');
    exampleEn.className = 'example-en';
    exampleEn.id = 'ex-native';
    exampleEn.textContent = exampleNative;
    exampleBox.appendChild(exampleEn);
    
    cardFront.appendChild(exampleBox);
  }
  
  flashcard.appendChild(cardFront);
  
  // Card back
  const cardBack = document.createElement('div');
  cardBack.className = 'card-back';
  cardBack.id = 'card-back';
  
  const divider = document.createElement('div');
  divider.className = 'divider';
  cardBack.appendChild(divider);
  
  const translationHint = document.createElement('div');
  translationHint.className = 'translation-hint';
  translationHint.textContent = 'Translation';
  cardBack.appendChild(translationHint);
  
  const translation = document.createElement('div');
  translation.className = 'translation';
  translation.textContent = nativeText;
  cardBack.appendChild(translation);
  
  flashcard.appendChild(cardBack);
  
  // Clear and append
  area.innerHTML = '';
  area.appendChild(flashcard);

  // Tap hint
  const tapHint = document.createElement('div');
  tapHint.className = 'tap-hint';
  tapHint.id = 'tap-hint';
  tapHint.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
  Tap to reveal`;
  area.appendChild(tapHint);
  
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
  
  const againBtn = document.createElement('button');
  againBtn.className = 'answer-btn btn-again';
  againBtn.setAttribute('data-q', 'again');
  againBtn.innerHTML = 'Again <span class="btn-sub">10 min</span>';
  answerBtns.appendChild(againBtn);
  
  const goodBtn = document.createElement('button');
  goodBtn.className = 'answer-btn btn-good';
  goodBtn.setAttribute('data-q', 'good');
  goodBtn.innerHTML = `Good <span class="btn-sub">+${getNextInterval(cardState,'good')}d</span>`;
  answerBtns.appendChild(goodBtn);
  
  const easyBtn = document.createElement('button');
  easyBtn.className = 'answer-btn btn-easy';
  easyBtn.setAttribute('data-q', 'easy');
  easyBtn.innerHTML = `Easy <span class="btn-sub">+${getNextInterval(cardState,'easy')}d</span>`;
  answerBtns.appendChild(easyBtn);
  
  area.appendChild(answerBtns);

  document.getElementById('flashcard').addEventListener('click', revealCard);
  document.getElementById('reveal-btn').addEventListener('click', revealCard);

  // Speaker button for audio pronunciation
  const speakBtn = document.getElementById('speak-btn');
  if (speakBtn) {
    speakBtn.addEventListener('click', e => {
      e.stopPropagation();
      pronounceWord(targetText, lang.code);
    });
  }

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

// ── Web Speech API (Text-to-Speech) ──
function pronounceWord(word, langCode) {
  // Stop any previous speech
  speechSynthesis.cancel();

  // Map language codes to IETF language tags
  const langMap = {
    german:   'de-DE',
    spanish:  'es-ES',
    french:   'fr-FR',
    arabic:   'ar-SA',
    japanese: 'ja-JP',
  };

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = langMap[langCode] || 'en-US';
  utterance.rate = 0.9; // slightly slower for clarity
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  speechSynthesis.speak(utterance);
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
    
    const feedbackEl = document.getElementById('save-feedback');

    // Validation: Required fields
    if (!targetVal || !nativeVal) {
      feedbackEl.textContent = '⚠️ Both target and native language fields are required.';
      return;
    }
    
    // Validation: Length limits (reasonable limits to prevent abuse)
    const MAX_WORD_LENGTH = 200;
    const MAX_EXAMPLE_LENGTH = 500;
    
    if (targetVal.length > MAX_WORD_LENGTH) {
      feedbackEl.textContent = `⚠️ Target word too long (max ${MAX_WORD_LENGTH} characters).`;
      return;
    }
    
    if (nativeVal.length > MAX_WORD_LENGTH) {
      feedbackEl.textContent = `⚠️ Native word too long (max ${MAX_WORD_LENGTH} characters).`;
      return;
    }
    
    if (pron && pron.length > MAX_WORD_LENGTH) {
      feedbackEl.textContent = `⚠️ Pronunciation too long (max ${MAX_WORD_LENGTH} characters).`;
      return;
    }
    
    if (ex && ex.length > MAX_EXAMPLE_LENGTH) {
      feedbackEl.textContent = `⚠️ Example too long (max ${MAX_EXAMPLE_LENGTH} characters).`;
      return;
    }
    
    if (exen && exen.length > MAX_EXAMPLE_LENGTH) {
      feedbackEl.textContent = `⚠️ Example translation too long (max ${MAX_EXAMPLE_LENGTH} characters).`;
      return;
    }
    
    // Validation: Check for minimum length
    if (targetVal.length < 1 || nativeVal.length < 1) {
      feedbackEl.textContent = '⚠️ Words must be at least 1 character long.';
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

    try {
      const id = SRS.addCustomWord(word, lang.code);
      State.allWords.push({ ...word, id });

      ['inp-de','inp-en','inp-pron','inp-ex','inp-exen'].forEach(i => {
        document.getElementById(i).value = '';
      });
      feedbackEl.textContent = '✓ Word saved!';
      setTimeout(() => feedbackEl.textContent = '', 2500);
    } catch (error) {
      console.error('[App] Failed to save custom word:', error);
      feedbackEl.textContent = '⚠️ Failed to save word. Storage may be full.';
    }
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
