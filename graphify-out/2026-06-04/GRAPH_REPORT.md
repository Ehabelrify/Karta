# Graph Report - .  (2026-06-04)

## Corpus Check
- 14 files · ~51,277 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 134 nodes · 264 edges · 13 communities (10 shown, 3 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.85)
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

## God Nodes (most connected - your core abstractions)
1. `CEFR A1 Beginner Level` - 16 edges
2. `CEFR B2 Upper-Intermediate Level` - 16 edges
3. `renderCard()` - 15 edges
4. `CEFR A2 Elementary Level` - 15 edges
5. `CEFR B1 Intermediate Level` - 15 edges
6. `getLang()` - 13 edges
7. `boot()` - 11 edges
8. `renderHome()` - 10 edges
9. `openLevel()` - 10 edges
10. `startReview()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `German Vocabulary Dataset` --references--> `LANGUAGE_REGISTRY`  [EXTRACTED]
  languages/german/README.md → core/languages.js
- `Karta README` --references--> `LANGUAGE_REGISTRY`  [EXTRACTED]
  README.md → core/languages.js
- `German Vocabulary Dataset` --references--> `localStorage-based Persistence`  [EXTRACTED]
  languages/german/README.md → core/srs.js
- `PWA Manifest` --references--> `Karta 192px Icon - green rounded rect with DE text`  [EXTRACTED]
  manifest.json → assets/icons/icon-192.svg
- `Karta README` --references--> `Offline-First PWA Pattern`  [EXTRACTED]
  README.md → sw.js

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

## Communities (13 total, 3 thin omitted)

### Community 0 - "App Core & Navigation"
Cohesion: 0.15
Nodes (30): activateLanguage(), _browse, CAT_ICONS, filterWords(), getLang(), goHome(), _hapticCtx, levelBadgeClass() (+22 more)

### Community 1 - "CEFR Levels & Vocabulary"
Cohesion: 0.22
Nodes (26): Body Category, CEFR A1 Beginner Level, CEFR A2 Elementary Level, CEFR B1 Intermediate Level, CEFR B2 Upper-Intermediate Level, Colors Category, Core Survival Vocabulary Theme, Emotions Category (+18 more)

### Community 2 - "Browse & SRS Status UI"
Cohesion: 0.15
Nodes (17): buildBrowseItem(), getSrsStatus, getNextInterval(), getSrsStatus(), hapticFeedback(), pronounceWord(), renderCard(), revealCard() (+9 more)

### Community 3 - "Review Session & SRS Engine"
Cohesion: 0.13
Nodes (14): handleAnswer(), loadBookmarks(), State, SRS.answer, SRS, German Vocabulary Dataset, Karta 192px Icon - green rounded rect with DE text, localStorage-based Persistence (+6 more)

### Community 4 - "Event Binding & Settings"
Cohesion: 0.21
Nodes (12): bindAdd(), bindBrowse(), bindLangSheet(), bindNav(), bindSettingsSheet(), boot(), loadLanguage(), loadStreakData() (+4 more)

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
- **39 isolated node(s):** `_browse`, `_hapticCtx`, `language`, `level`, `words` (+34 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `LANGUAGE_REGISTRY` connect `Event Binding & Settings` to `Review Session & SRS Engine`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `Karta README` connect `Review Session & SRS Engine` to `Event Binding & Settings`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `CEFR A1 Beginner Level` (e.g. with `CEFR A2 Elementary Level` and `Core Survival Vocabulary Theme`) actually correct?**
  _`CEFR A1 Beginner Level` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `CEFR B2 Upper-Intermediate Level` (e.g. with `CEFR B1 Intermediate Level` and `Professional and Academic Vocabulary Theme`) actually correct?**
  _`CEFR B2 Upper-Intermediate Level` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `CEFR A2 Elementary Level` (e.g. with `CEFR A1 Beginner Level` and `CEFR B1 Intermediate Level`) actually correct?**
  _`CEFR A2 Elementary Level` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `CEFR B1 Intermediate Level` (e.g. with `CEFR A2 Elementary Level` and `CEFR B2 Upper-Intermediate Level`) actually correct?**
  _`CEFR B1 Intermediate Level` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `_browse`, `_hapticCtx`, `language` to the rest of the system?**
  _39 weakly-connected nodes found - possible documentation gaps or missing edges._