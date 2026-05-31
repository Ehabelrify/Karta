// ── Karta — Flashcard App Core ──

const CAT_ICONS = {
  'People & Family': '👥', 'Food & Drink': '🍽️', 'Travel': '✈️',
  'Work': '💼', 'Body': '🫀', 'Nature': '🌿', 'Emotions': '💭',
  'Colors': '🎨', 'Places': '📍', 'Numbers': '🔢', 'Time': '🕐',
  'default': '📌',
};

// ── App State ──
const State = {
  activeLang: null,
  allWords: [],
  currentLevel: null,
  currentCategory: null,
  reviewQueue: [],
  reviewIndex: 0,
  sessionStats: { again: 0, good: 0, easy: 0 },
  cardRevealed: false,
  swipeShown: false,
  streakCount: 0,
  lastReviewDate: null,
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
  bindLangSheet();
  bindResetSheet();

  if (LANGUAGE_REGISTRY.length === 1) {
    await loadLanguage(LANGUAGE_REGISTRY[0]);
  } else {
    document.getElementById('loading-screen').classList.add('hidden');
    showLanguagePicker();
  }
}

// ── Activate a language ──
function activateLanguage(lang, loadedWords) {
  State.activeLang = lang;
  const custom = SRS.getCustomWords(lang.code);
  State.allWords = [...(loadedWords || []), ...custom];
  document.documentElement.dir = lang.dir || 'ltr';
  document.getElementById('loading-screen').classList.add('hidden');
  renderHome();
  showScreen('home');
  updateNavForHome();
}

// ── Language Picker (full screen, only when >1 language) ──
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
  document.getElementById('nav-title').style.display = 'none';
  document.getElementById('nav-back').style.display = 'none';
  document.getElementById('nav-lang').style.display = 'none';
}

// ── Language Bottom Sheet ──
function bindLangSheet() {
  const overlay = document.getElementById('lang-overlay');
  const sheet   = document.getElementById('lang-sheet');
  const list    = document.getElementById('lang-sheet-list');
  const navLang = document.getElementById('nav-lang');

  function openSheet() {
    // Populate list fresh every open
    list.innerHTML = '';
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
        closeSheet();
        if (State.activeLang?.code !== lang.code) {
          document.getElementById('loading-screen').classList.remove('hidden');
          document.getElementById('loading-text').textContent = `Loading ${lang.name}…`;
          await loadLanguage(lang);
        }
      });
      list.appendChild(opt);
    }
    overlay.classList.add('open');
    sheet.classList.add('open');
  }

  function closeSheet() {
    overlay.classList.remove('open');
    sheet.classList.remove('open');
  }

  // Only show globe button if >1 language registered
  if (LANGUAGE_REGISTRY.length > 1) {
    navLang.style.display = '';
    navLang.addEventListener('click', openSheet);
  }
  overlay.addEventListener('click', closeSheet);
}

// ── Reset Sheet ──
function bindResetSheet() {
  const overlay = document.getElementById('reset-overlay');
  const sheet   = document.getElementById('reset-sheet');
  const btn     = document.getElementById('nav-reset');

  function openResetSheet() {
    overlay.classList.add('open');
    sheet.classList.add('open');
  }
  function closeResetSheet() {
    overlay.classList.remove('open');
    sheet.classList.remove('open');
  }

  btn.addEventListener('click', openResetSheet);
  overlay.addEventListener('click', closeResetSheet);
  document.getElementById('reset-cancel-btn').addEventListener('click', closeResetSheet);

  document.getElementById('reset-progress-btn').addEventListener('click', () => {
    closeResetSheet();
    const lang = getLang();
    if (!lang) return;
    // Clear SRS data for active language only
    localStorage.removeItem(`srs_v2_${lang.code}`);
    localStorage.removeItem(`custom_v1_${lang.code}`);
    localStorage.removeItem('lastReviewDate');
    localStorage.removeItem('streakCount');
    State.streakCount = 0;
    State.lastReviewDate = null;
    // Reload words fresh
    loadLanguage(lang);
  });

  document.getElementById('reload-app-btn').addEventListener('click', () => {
    closeResetSheet();
    // Force a hard reload bypassing cache
    window.location.reload(true);
  });
}

// ── Load language JSON ──
async function loadLanguage(lang) {
  try {
    document.getElementById('loading-text').textContent = `Loading ${lang.name} words…`;
    document.getElementById('loading-screen').classList.remove('hidden');

    const levelData = await Promise.all(
      lang.dataFiles.map(file =>
        fetch(file + '?v=' + Date.now()).then(res => {
          if (!res.ok) throw new Error(`${file}: ${res.statusText}`);
          return res.json();
        })
      )
    );

    const allWords = [];
    levelData.forEach(data => {
      data.words.forEach(word => {
        allWords.push({
          id:            word.id,
          level:         data.level,
          category:      word.category,
          [lang.targetField]: word.target,
          [lang.nativeField]: word.native,
          pronunciation: word.pronunciation || '',
          example:       word.examples?.[0]?.target || '',
          exampleEn:     word.examples?.[0]?.native || '',
        });
      });
    });

    console.log(`[Karta] Loaded ${allWords.length} words for ${lang.name}`);
    activateLanguage(lang, allWords);
  } catch (err) {
    console.error(`[Karta] Load failed:`, err);
    showError(`Failed to load ${lang.name}.<br>Check your connection and try again.`);
  }
}

// ── Helpers ──
function filterWords(level, category) {
  return State.allWords
    .filter(w => (!level || w.level === level) && (!category || w.category === category))
    .map(w => w.id);
}
function wordById(id) { return State.allWords.find(w => w.id == id); }
function getLang()    { return State.activeLang; }
function levelBadgeClass(level) {
  return { A1:'a1', A2:'a2', B1:'b1', B2:'b2', N5:'a1', N4:'a2', N3:'b1', N2:'b2', N1:'c1' }[level] || 'a1';
}

// ── Home ──
function renderHome() {
  const lang   = getLang();
  const allIds = State.allWords.map(w => w.id);
  const stats  = SRS.getStats(allIds, lang.code);

  ['stat-card-seen','stat-card-mastered','stat-card-due'].forEach(id =>
    document.getElementById(id)?.classList.remove('skeleton')
  );

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

  // Review Due button
  const reviewDueBtn = document.getElementById('review-due-btn');
  if (stats.due > 0) {
    reviewDueBtn.classList.remove('hidden');
    document.getElementById('review-due-sub').textContent = `${stats.due} words waiting`;
    reviewDueBtn.onclick = () => startReview(allIds, null, null);
  } else {
    reviewDueBtn.classList.add('hidden');
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

// ── Level View ──
function openLevel(level) {
  State.currentLevel    = level;
  State.currentCategory = null;
  const lang  = getLang();
  const name  = lang.levelNames[level] || level;
  const ids   = filterWords(level, null);
  const s     = SRS.getStats(ids, lang.code);
  const queue = SRS.buildQueue(ids, lang.code, 40);

  showScreen('level-view');
  setNavTitle(`${level} — ${name}`);
  document.getElementById('nav-back').style.display = '';
  document.getElementById('review-level-sub').textContent =
    `${queue.length} cards · ${s.due} due · ${s.seen} seen`;
  document.getElementById('review-level-btn').onclick = () => startReview(ids, level, null);
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
    card.addEventListener('click', () => startReview(ids, level, cat));
    list.appendChild(card);
  }
}

// ── Review ──
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
  setNavTitle(category ? `${level} · ${category}` : level || 'Review All');
  document.getElementById('nav-back').style.display = '';
  document.getElementById('nav-add').style.display  = 'none';
  document.getElementById('nav-reset').style.display = 'none';

  renderCard();
}

function renderCard() {
  const lang = getLang();
  const { reviewQueue, reviewIndex } = State;
  const total = reviewQueue.length;

  // Progress
  const pct = total > 0 ? Math.round((reviewIndex / total) * 100) : 0;
  document.getElementById('review-progress-fill').style.width = pct + '%';
  document.getElementById('review-count').textContent = `${reviewIndex} / ${total}`;

  // BUG FIX: check done BEFORE touching the DOM
  if (reviewIndex >= total) { showDone(); return; }

  State.cardRevealed = false;
  const wordId = reviewQueue[reviewIndex];
  const word   = wordById(wordId);
  if (!word) { State.reviewIndex++; renderCard(); return; }

  const cardState = SRS.getCardState(wordId, lang.code);
  const isNew     = SRS.isNew(cardState);

  const targetText   = word[lang.targetField] || '';
  const nativeText   = word[lang.nativeField]  || '';
  const pronunciation  = word.pronunciation || '';
  const exampleTarget  = word.example   || '';
  const exampleNative  = word.exampleEn || '';

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

  // Swipe hint (shown once per session, auto-hides)
  if (!State.swipeShown) {
    const hint = document.createElement('div');
    hint.className = 'swipe-instruction visible';
    hint.id = 'swipe-instruction';
    hint.innerHTML = '← Again &nbsp;·&nbsp; swipe &nbsp;·&nbsp; Easy →';
    area.appendChild(hint);
    State.swipeShown = true;
    setTimeout(() => hint.classList.remove('visible'), 3000);
  }

  // Flashcard
  const flashcard = document.createElement('div');
  flashcard.className = 'flashcard';
  flashcard.id = 'flashcard';

  // Swipe overlays
  const hintL = document.createElement('div');
  hintL.className = 'swipe-hint swipe-hint-left';
  hintL.textContent = '↶ Again';
  flashcard.appendChild(hintL);

  const hintR = document.createElement('div');
  hintR.className = 'swipe-hint swipe-hint-right';
  hintR.textContent = 'Easy ↷';
  flashcard.appendChild(hintR);

  // Meta
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
  if (isNew) {
    const nTag = document.createElement('span');
    nTag.className = 'card-cat-tag new-tag';
    nTag.textContent = 'New';
    meta.appendChild(nTag);
  }
  flashcard.appendChild(meta);

  // Front
  const front = document.createElement('div');
  front.className = 'card-front';
  const wc = document.createElement('div');
  wc.className = 'german-word-container';
  const wordEl = document.createElement('div');
  wordEl.className = 'german-word';
  wordEl.id = 'target-word';
  wordEl.textContent = targetText;
  wc.appendChild(wordEl);

  const speakBtnEl = document.createElement('button');
  speakBtnEl.className = 'speak-btn';
  speakBtnEl.title = 'Pronounce';
  speakBtnEl.setAttribute('aria-label', 'Pronounce');
  speakBtnEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>`;
  speakBtnEl.addEventListener('click', e => {
    e.stopPropagation();
    hapticFeedback('light');
    pronounceWord(targetText, lang.code, speakBtnEl);
  });
  wc.appendChild(speakBtnEl);
  front.appendChild(wc);

  if (pronunciation) {
    const pd = document.createElement('div');
    pd.className = 'pronunciation';
    pd.textContent = pronunciation;
    front.appendChild(pd);
  }

  if (exampleTarget) {
    const exBox = document.createElement('div');
    exBox.className = 'example-box';
    const exDe = document.createElement('div');
    exDe.className = 'example-de';
    exDe.innerHTML = exHighlighted;
    exBox.appendChild(exDe);
    const exEn = document.createElement('div');
    exEn.className = 'example-en';
    exEn.id = 'ex-native';
    exEn.textContent = exampleNative;
    exBox.appendChild(exEn);
    front.appendChild(exBox);
  }
  flashcard.appendChild(front);

  // Back
  const back = document.createElement('div');
  back.className = 'card-back';
  back.id = 'card-back';
  const div = document.createElement('div'); div.className = 'divider'; back.appendChild(div);
  const th  = document.createElement('div'); th.className = 'translation-hint'; th.textContent = 'Translation'; back.appendChild(th);
  const tr  = document.createElement('div'); tr.className = 'translation'; tr.textContent = nativeText; back.appendChild(tr);
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
    el.addEventListener('click', e => { e.stopPropagation(); document.getElementById('ex-native')?.classList.toggle('visible'); });
    el.addEventListener('mouseenter', e => { e.stopPropagation(); document.getElementById('ex-native')?.classList.add('visible'); });
    el.addEventListener('mouseleave', () => { if (!State.cardRevealed) document.getElementById('ex-native')?.classList.remove('visible'); });
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
      flashcard.classList.toggle('swiping-right', dx > 30);
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

function getNextInterval(state, quality) {
  if (!state || state.reps === 0) return quality === 'good' ? 1 : 3;
  const i = state.interval || 1, e = state.ease || 2.5;
  return quality === 'good' ? Math.round(i * e) : Math.round(i * e * 1.3);
}

// ── Text-to-Speech ──
// BUG FIX: iOS loads voices asynchronously — must wait and pick by lang tag explicitly
function pronounceWord(text, langCode, btnEl) {
  if (!('speechSynthesis' in window)) return;

  const langMap = {
    german: 'de-DE', spanish: 'es-ES', french: 'fr-FR',
    arabic: 'ar-SA', japanese: 'ja-JP', italian: 'it-IT',
  };
  const targetLang = langMap[langCode] || 'de-DE';

  speechSynthesis.cancel();

  function speak() {
    const voices  = speechSynthesis.getVoices();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang  = targetLang;
    utterance.rate  = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Find an exact voice for the target language
    // Priority: exact locale match → language prefix match → fallback (browser chooses)
    const exactVoice  = voices.find(v => v.lang === targetLang);
    const prefixVoice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
    if (exactVoice)       utterance.voice = exactVoice;
    else if (prefixVoice) utterance.voice = prefixVoice;
    // If neither found, leave unset — browser will try its best

    if (btnEl) {
      btnEl.classList.add('speaking');
      utterance.onend = () => btnEl.classList.remove('speaking');
      utterance.onerror = () => btnEl.classList.remove('speaking');
    }

    speechSynthesis.speak(utterance);
  }

  // iOS loads voices lazily — if empty, wait for the event
  if (speechSynthesis.getVoices().length > 0) {
    speak();
  } else {
    speechSynthesis.onvoiceschanged = () => {
      speechSynthesis.onvoiceschanged = null;
      speak();
    };
  }
}

function revealCard() {
  if (State.cardRevealed) return;
  State.cardRevealed = true;
  hapticFeedback('light');
  document.getElementById('card-back').classList.add('revealed');
  document.getElementById('tap-hint').style.display      = 'none';
  document.getElementById('reveal-btn').style.display    = 'none';
  document.getElementById('answer-btns').style.display   = 'grid';
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
  document.getElementById('nav-add').style.display   = '';
  document.getElementById('nav-reset').style.display = '';
  document.getElementById('done-again').textContent  = State.sessionStats.again;
  document.getElementById('done-good').textContent   = State.sessionStats.good;
  document.getElementById('done-easy').textContent   = State.sessionStats.easy;
  const total = Object.values(State.sessionStats).reduce((a,b) => a+b, 0);
  document.getElementById('done-sub').textContent = `You reviewed ${total} cards. Keep it up!`;
}

// ── Haptic Feedback ──
// BUG FIX: navigator.vibrate is NOT supported on iOS Safari.
// Use AudioContext to produce a silent click that triggers the Taptic Engine
// via the audio session (works on iOS 15+).
// Falls back to navigator.vibrate on Android.
const _hapticCtx = { ctx: null };
function hapticFeedback(intensity = 'light') {
  // Android / non-iOS
  if (navigator.vibrate) {
    navigator.vibrate(intensity === 'medium' ? 12 : 6);
    return;
  }
  // iOS — use AudioContext silent oscillator burst
  try {
    if (!_hapticCtx.ctx) _hapticCtx.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _hapticCtx.ctx;
    if (ctx.state === 'suspended') ctx.resume();
    const osc    = ctx.createOscillator();
    const gain   = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);          // silent
    osc.frequency.value = 1;
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.01);
  } catch (_) { /* silently ignore if AudioContext unavailable */ }
}

// ── Word Tooltip ──
function setupWordTooltip(el, label) {
  if (!el) return;
  const tooltip = document.getElementById('word-tooltip');
  const show = e => { tooltip.textContent = label; tooltip.classList.add('show'); position(e); };
  const hide = () => tooltip.classList.remove('show');
  const position = e => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    tooltip.style.left = Math.min(x - 40, window.innerWidth - 180) + 'px';
    tooltip.style.top  = (y - 44) + 'px';
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
    document.getElementById('inp-level').innerHTML = lang.levels.map(l =>
      `<option value="${l}">${l} — ${lang.levelNames[l] || l}</option>`
    ).join('');
    showScreen('add-view');
    setNavTitle('Add Word');
    document.getElementById('nav-back').style.display  = '';
    document.getElementById('nav-add').style.display   = 'none';
    document.getElementById('nav-reset').style.display = 'none';
    document.getElementById('save-feedback').textContent = '';
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
      example: ex || `${targetVal}.`,
      exampleEn: exen || `${nativeVal}.`,
    };
    try {
      const id = SRS.addCustomWord(word, lang.code);
      State.allWords.push({ ...word, id });
      ['inp-de','inp-en','inp-pron','inp-ex','inp-exen'].forEach(i =>
        document.getElementById(i).value = ''
      );
      feedback.textContent = '✓ Word saved!';
      setTimeout(() => feedback.textContent = '', 2500);
    } catch (e) {
      feedback.textContent = '⚠️ Failed to save. Storage may be full.';
    }
  });
}

// ── Navigation ──
function bindNav() {
  document.getElementById('nav-back').addEventListener('click', () => {
    const id = document.querySelector('.screen.active')?.id;
    if (!id) return;
    if      (id === 'lang-pick')  { /* root */ }
    else if (id === 'home')       { if (LANGUAGE_REGISTRY.length > 1) showLanguagePicker(); }
    else if (id === 'level-view') goHome();
    else if (id === 'review')     {
      document.getElementById('nav-add').style.display   = '';
      document.getElementById('nav-reset').style.display = '';
      speechSynthesis?.cancel();
      State.currentLevel ? openLevel(State.currentLevel) : goHome();
    }
    else if (id === 'add-view' || id === 'done-view') {
      document.getElementById('nav-add').style.display   = '';
      document.getElementById('nav-reset').style.display = '';
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
  document.getElementById('nav-add').style.display   = '';
  document.getElementById('nav-reset').style.display = '';
  // Show globe icon only if >1 language
  document.getElementById('nav-lang').style.display =
    LANGUAGE_REGISTRY.length > 1 ? '' : 'none';
}

function setNavTitle(text) {
  document.getElementById('nav-title').textContent  = text;
  document.getElementById('nav-title').style.display = '';
  document.getElementById('nav-wordmark').style.display = 'none';
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showError(msg) {
  document.getElementById('loading-screen').classList.add('hidden');
  document.body.innerHTML = `<div style="padding:48px 24px;text-align:center;font-family:sans-serif;color:var(--text)">
    <div style="font-size:40px">⚠️</div>
    <div style="margin-top:16px;font-size:16px;line-height:1.6">${msg}</div>
    <button onclick="location.reload()" style="margin-top:24px;padding:12px 28px;background:#2d6a4f;color:#fff;border:none;border-radius:12px;font-size:15px;cursor:pointer">Retry</button>
  </div>`;
}

// ── Streak ──
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

// ── Start ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    boot();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  });
} else {
  boot();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
