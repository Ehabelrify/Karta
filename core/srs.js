// ── SRS Engine — Language-Namespaced ──
// All storage keys are prefixed with the language code,
// so progress for German, Spanish, etc. never mix.

const SRS = (() => {
  function storageKey(langCode)  { return `srs_v2_${langCode}`; }
  function customKey(langCode)   { return `custom_v1_${langCode}`; }

  function load(langCode) {
    try { return JSON.parse(localStorage.getItem(storageKey(langCode)) || '{}'); }
    catch { return {}; }
  }
  function save(data, langCode) {
    localStorage.setItem(storageKey(langCode), JSON.stringify(data));
  }
  function loadCustom(langCode) {
    try { return JSON.parse(localStorage.getItem(customKey(langCode)) || '[]'); }
    catch { return []; }
  }
  function saveCustom(words, langCode) {
    localStorage.setItem(customKey(langCode), JSON.stringify(words));
  }

  function defaultCard() {
    return { interval: 0, ease: 2.5, reps: 0, due: 0, lastReview: null, totalReviews: 0 };
  }

  function today() {
    const d = new Date(); d.setHours(0,0,0,0); return d.getTime();
  }

  function isDue(card) {
    if (!card) return false;
    if (card.due === 0) return true;
    return card.due <= Date.now();
  }
  function isNew(card) { return !card || card.due === 0; }

  function answer(wordId, quality, langCode) {
    const data = load(langCode);
    if (!data[wordId]) data[wordId] = defaultCard();
    const c = data[wordId];
    c.totalReviews++;
    c.lastReview = Date.now();
    const MS_DAY = 86400000;

    if (quality === 'again') {
      c.reps = 0;
      c.ease = Math.max(1.3, c.ease - 0.2);
      c.interval = 0;
      c.due = Date.now() + 10 * 60 * 1000;
    } else if (quality === 'good') {
      if (c.reps === 0)      c.interval = 1;
      else if (c.reps === 1) c.interval = 3;
      else                   c.interval = Math.round(c.interval * c.ease);
      c.reps++;
      c.ease = Math.max(1.3, c.ease + 0.1);
      c.due = today() + c.interval * MS_DAY;
    } else if (quality === 'easy') {
      if (c.reps === 0)      c.interval = 3;
      else if (c.reps === 1) c.interval = 7;
      else                   c.interval = Math.round(c.interval * c.ease * 1.3);
      c.reps++;
      c.ease = Math.min(3.0, c.ease + 0.15);
      c.due = today() + c.interval * MS_DAY;
    }

    save(data, langCode);
    return c;
  }

  function buildQueue(wordIds, langCode, maxCards = 40) {
    const data = load(langCode);
    const due = [], newW = [], notDue = [];

    for (const id of wordIds) {
      const c = data[id];
      if (isNew(c))       newW.push(id);
      else if (isDue(c))  due.push(id);
      else                notDue.push(id);
    }

    const shuffle = arr => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    shuffle(newW);
    shuffle(notDue);
    due.sort((a, b) => (data[a]?.due || 0) - (data[b]?.due || 0));

    const total    = Math.min(maxCards, due.length + newW.length + Math.min(5, notDue.length));
    const newCount = Math.max(1, Math.round(total * 0.3));
    const dueCount = total - newCount;

    const queue = [...due.slice(0, dueCount), ...newW.slice(0, newCount)];

    if (queue.length < Math.min(10, wordIds.length)) {
      queue.push(...notDue.slice(0, Math.min(10, wordIds.length) - queue.length));
    }

    return shuffle(queue);
  }

  function getStats(wordIds, langCode) {
    const data = load(langCode);
    let seen = 0, mastered = 0, due = 0;
    for (const id of wordIds) {
      const c = data[id];
      if (!isNew(c)) seen++;
      if (c && c.reps >= 3 && c.interval >= 7) mastered++;
      if (isDue(c)) due++;
    }
    return { seen, mastered, due, total: wordIds.length };
  }

  function getCardState(wordId, langCode) {
    const data = load(langCode);
    return data[wordId] || defaultCard();
  }

  function addCustomWord(word, langCode) {
    const customs = loadCustom(langCode);
    const id = `c_${langCode}_${Date.now()}`;
    customs.push({ ...word, id });
    saveCustom(customs, langCode);
    return id;
  }

  function getCustomWords(langCode) { return loadCustom(langCode); }

  return { load, answer, buildQueue, getStats, getCardState, addCustomWord, getCustomWords, isNew, isDue };
})();
