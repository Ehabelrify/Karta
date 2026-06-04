# Graph Report - .  (2026-06-04)

## Corpus Check
- 8 files · ~102,081 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 102 nodes · 184 edges · 14 communities (9 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_App Core & Navigation|App Core & Navigation]]
- [[_COMMUNITY_CEFR Levels & Vocabulary|CEFR Levels & Vocabulary]]
- [[_COMMUNITY_Browse & SRS Status UI|Browse & SRS Status UI]]
- [[_COMMUNITY_Review Session & SRS Engine|Review Session & SRS Engine]]
- [[_COMMUNITY_Event Binding & Settings|Event Binding & Settings]]
- [[_COMMUNITY_PWA Manifest|PWA Manifest]]
- [[_COMMUNITY_A1 Word Data|A1 Word Data]]
- [[_COMMUNITY_A2 Word Data|A2 Word Data]]
- [[_COMMUNITY_B1 Word Data|B1 Word Data]]
- [[_COMMUNITY_B2 Word Data|B2 Word Data]]
- [[_COMMUNITY_Service Worker|Service Worker]]
- [[_COMMUNITY_Custom Word API|Custom Word API]]
- [[_COMMUNITY_SW Cache Activation|SW Cache Activation]]
- [[_COMMUNITY_Community 13|Community 13]]

## God Nodes (most connected - your core abstractions)
1. `renderCard()` - 15 edges
2. `getLang()` - 13 edges
3. `boot()` - 11 edges
4. `renderHome()` - 10 edges
5. `openLevel()` - 10 edges
6. `startReview()` - 9 edges
7. `activateLanguage()` - 8 edges
8. `renderCategories()` - 8 edges
9. `showScreen()` - 7 edges
10. `loadLanguage()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `German Vocabulary Dataset` --references--> `LANGUAGE_REGISTRY`  [EXTRACTED]
  languages/german/README.md → core/languages.js
- `Karta README` --references--> `LANGUAGE_REGISTRY`  [EXTRACTED]
  README.md → core/languages.js
- `German Vocabulary Dataset` --references--> `localStorage-based Persistence`  [EXTRACTED]
  languages/german/README.md → core/srs.js
- `PWA Manifest` --references--> `Karta 192px Icon - green rounded rect with DE text`  [EXTRACTED]
  manifest.json → assets/icons/icon-192.svg
- `Karta README` --references--> `SM-2 Style Spaced Repetition Algorithm`  [EXTRACTED]
  README.md → core/srs.js

## Import Cycles
- None detected.

## Communities (14 total, 5 thin omitted)

### Community 0 - "App Core & Navigation"
Cohesion: 0.17
Nodes (19): bindAdd(), bindBrowse(), bindLangSheet(), bindNav(), bindSettingsSheet(), boot(), _browse, _hapticCtx (+11 more)

### Community 1 - "CEFR Levels & Vocabulary"
Cohesion: 0.14
Nodes (15): buildBrowseItem(), getNextInterval(), getSrsStatus(), hapticFeedback(), renderCard(), revealCard(), saveBookmarks(), setupWordTooltip() (+7 more)

### Community 2 - "Browse & SRS Status UI"
Cohesion: 0.29
Nodes (14): CAT_ICONS, filterWords(), getLang(), openBrowse(), openLevel(), renderBrowseFilters(), renderBrowseList(), renderCategories() (+6 more)

### Community 3 - "Review Session & SRS Engine"
Cohesion: 0.20
Nodes (9): handleAnswer(), loadBookmarks(), State, SRS.answer, SRS, German Vocabulary Dataset, localStorage-based Persistence, Karta README (+1 more)

### Community 4 - "Event Binding & Settings"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 5 - "PWA Manifest"
Cohesion: 0.25
Nodes (9): activateLanguage(), goHome(), levelBadgeClass(), loadPreferredVoice(), renderHome(), showScreen(), updateStreakDisplay(), SRS.getCustomWords (+1 more)

### Community 7 - "A2 Word Data"
Cohesion: 0.50
Nodes (3): language, level, words

### Community 8 - "B1 Word Data"
Cohesion: 0.50
Nodes (3): language, level, words

### Community 9 - "B2 Word Data"
Cohesion: 0.50
Nodes (3): language, level, words

## Knowledge Gaps
- **31 isolated node(s):** `_browse`, `_hapticCtx`, `level`, `words`, `language` (+26 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `LANGUAGE_REGISTRY` connect `App Core & Navigation` to `Review Session & SRS Engine`, `A1 Word Data`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `renderCard()` connect `CEFR Levels & Vocabulary` to `App Core & Navigation`, `Browse & SRS Status UI`, `Review Session & SRS Engine`, `PWA Manifest`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `_browse`, `_hapticCtx`, `level` to the rest of the system?**
  _31 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CEFR Levels & Vocabulary` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._