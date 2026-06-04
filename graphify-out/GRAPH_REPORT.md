# Graph Report - Karta  (2026-06-04)

## Corpus Check
- 11 files · ~102,081 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 103 nodes · 184 edges · 13 communities (9 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c7fc270d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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

## Hyperedges (group relationships)
- **Review Session Loop** — core_app_startreview, core_app_rendercard, core_app_handleanswer, core_srs_answer [EXTRACTED 0.95]
- **App Boot and Language Initialization** — core_app_boot, core_app_loadlanguage, core_app_activatelanguage, core_languages_language_registry [EXTRACTED 0.95]
- **Offline PWA Infrastructure** — sw_installhandler, sw_fetchhandler, manifest_pwa, offline_first_pwa [EXTRACTED 0.95]
- **All 9 Categories Present at A1 Level** — concept_cefr_a1, concept_people_family, concept_food_drink, concept_numbers, concept_time, concept_colors, concept_body, concept_nature, concept_places, concept_work, concept_emotions, concept_travel [EXTRACTED 1.00]
- **All 9 Categories Present at A2 Level** — concept_cefr_a2, concept_people_family, concept_food_drink, concept_numbers, concept_time, concept_colors, concept_body, concept_nature, concept_places, concept_work, concept_emotions, concept_travel [EXTRACTED 1.00]
- **All 9 Categories Present at B1 Level** — concept_cefr_b1, concept_people_family, concept_food_drink, concept_numbers, concept_time, concept_colors, concept_body, concept_nature, concept_places, concept_work, concept_emotions, concept_travel [EXTRACTED 1.00]
- **All 9 Categories Present at B2 Level** — concept_cefr_b2, concept_people_family, concept_food_drink, concept_numbers, concept_time, concept_colors, concept_body, concept_nature, concept_places, concept_work, concept_emotions, concept_travel [EXTRACTED 1.00]
- **CEFR Level Progression A1 through B2** — concept_cefr_a1, concept_cefr_a2, concept_cefr_b1, concept_cefr_b2 [INFERRED 0.95]
- **Daily Life Vocabulary Cluster** — concept_food_drink, concept_places, concept_work, concept_time, concept_people_family [INFERRED 0.85]
- **Advanced Thematic Cluster at B1/B2** — concept_professional_vocab, concept_societal_vocab, concept_register_formal, concept_cefr_b1, concept_cefr_b2 [INFERRED 0.85]

## Communities (13 total, 4 thin omitted)

### Community 0 - "App Core & Navigation"
Cohesion: 0.19
Nodes (21): CAT_ICONS, filterWords(), getLang(), goHome(), levelBadgeClass(), openBrowse(), openLevel(), renderBrowseFilters() (+13 more)

### Community 2 - "Browse & SRS Status UI"
Cohesion: 0.15
Nodes (15): buildBrowseItem(), getNextInterval(), getSrsStatus(), pronounceWord(), renderCard(), saveBookmarks(), setupWordTooltip(), showDone() (+7 more)

### Community 3 - "Review Session & SRS Engine"
Cohesion: 0.14
Nodes (13): activateLanguage(), handleAnswer(), loadBookmarks(), loadPreferredVoice(), State, LANGUAGE_REGISTRY, SRS.answer, SRS.getCustomWords (+5 more)

### Community 4 - "Event Binding & Settings"
Cohesion: 0.18
Nodes (17): bindAdd(), bindBrowse(), bindLangSheet(), bindNav(), bindSettingsSheet(), boot(), _browse, _hapticCtx (+9 more)

### Community 5 - "PWA Manifest"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 6 - "A1 Word Data"
Cohesion: 0.50
Nodes (3): language, level, words

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
- **32 isolated node(s):** `_browse`, `_hapticCtx`, `language`, `level`, `words` (+27 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderCard()` connect `Browse & SRS Status UI` to `App Core & Navigation`, `Review Session & SRS Engine`, `Event Binding & Settings`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `LANGUAGE_REGISTRY` connect `Review Session & SRS Engine` to `Event Binding & Settings`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `_browse`, `_hapticCtx`, `language` to the rest of the system?**
  _32 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Review Session & SRS Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._