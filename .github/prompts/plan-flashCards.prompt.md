# Plan: Fix SRS Foundation, Queue Logic & Docs

**TL;DR:** Your review queue is mixing in brand-new words when you want only already-seen words. We'll restructure the queue builder, audit counter calculations, document Web Speech API in README, improve the add-word form, create plan.md, and verify button functionality—all before diving into implementation details.

---

## Steps

### Phase 1: Core SRS Logic Fix (foundation)

**1. Modify `buildQueue()` in core/srs.js — remove new words from the mix**
   - Current: due cards + new words (30%) + fallback not-due
   - New: due cards + reviewed-but-not-due cards only (no brand-new words)
   - Rationale: You want a mix of already-seen words, not new ones
   - This ensures "smart review" matches your intent

**2. Add counter validation helper in core/srs.js**
   - Debug function to verify `seen`, `mastered`, `due` are calculated consistently
   - Log mismatches between displayed counters and actual SRS data
   - Helps diagnose the "feels disconnected" issue

**3. Update review queue description in README.md**
   - Change from "~70% due/overdue, ~30% new" to "~70% due/overdue, ~30% reviewed-but-waiting"

---

### Phase 2: Documentation & Config

**4. Add Web Speech API section to README.md**
   - Include the 10-line code snippet for speechSynthesis.speak(), German lang setup, quality notes
   - Make it adjustable later for any language, but start with German for now
   - Reference it as an optional enhancement for future implementation
   - Emphasize: Free, offline, built-in to browser, works on Safari iOS and Chrome

**5. Improve "Add Word" form layout in index.html**
   - Restructure form fields for clarity:
     - Target language word (with label note for language-specific hints)
     - Native translation
     - Pronunciation
     - Level / Category selectors
     - Example sentences
   - Add better visual hierarchy and field grouping
   - Make form feel less cramped with improved spacing

---

### Phase 3: Admin & Testing

**6. Create plan.md in root**
   - Document this entire plan for future reference
   - Include rationale for queue logic changes
   - Document "smart review" redesign intent

**7. Add `plan.md` to .gitignore**
   - Prevent plan docs from being committed

**8. Test buttons end-to-end after changes**
   - Verify Show Answer → Again/Good/Easy flow works
   - Verify Add Word save feedback
   - Verify back navigation
   - Verify all counters update post-review

---

## Relevant Files

- `core/srs.js` — `buildQueue()` function, queue mixing logic
- `core/app.js` — `renderCard()`, `handleAnswer()`, button event handlers
- `README.md` — Features section, feature descriptions
- `index.html` — Add Word form HTML, form styling
- `.gitignore` — Add plan.md
- `plan.md` — *to create*

---

## Verification Checklist

1. Run the app locally; select a level with 50+ words
2. Mark a few words as "Again" to create due cards
3. Start smart review — verify you see ONLY already-reviewed words (no "New" tag)
4. Check home counters after session — verify `seen`, `mastered`, `due` update correctly
5. Add a custom word — form should feel intuitive, save should work, word should appear in next review
6. Verify buttons don't visually appear broken or unresponsive
7. Verify navigation back from review to home works smoothly

---

## Design Decisions

- ✅ **Mastered definition stays**: `reps >= 3 && interval >= 7` (your approval)
- ✅ **Queue excludes brand-new words**: Smart review will only mix due + reviewed-waiting words
- ✅ **Web Speech API documented but not implemented**: Noted as optional future enhancement
- ⚠️ **Button issues unclear**: Will test during verification; likely working but needs validation

---

## Further Considerations

**1. New word inclusion philosophy**
   - Should users have an option to toggle "include new words in review"?
   - *Recommendation*: Not yet; stick with your preference for now, add as config option later if needed.

**2. Counter reset on language switch**
   - When switching languages, should stats carry over or reset?
   - *Recommendation*: Currently language-namespaced (smart design); keep as-is but verify it's working correctly.

**3. Add word form: categories**
   - Current form requires users to type category name. Should we add a dropdown of predefined categories?
   - *Recommendation*: Start with freeform to allow custom categories; add dropdown later for UX polish.

**4. Debug mode**
   - Consider adding a debug console for viewing raw SRS data per language (future enhancement)
   - Useful for troubleshooting counter/state issues

---

## Implementation Order

1. ✏️ **Fix buildQueue()** in srs.js (core logic)
2. ✏️ **Add validation helper** in srs.js
3. ✏️ **Update README** (features section + Web Speech API docs)
4. ✏️ **Improve Add Word form** in index.html (UX polish)
5. ✏️ **Create plan.md** in root
6. ✏️ **Update .gitignore** (add plan.md)
7. ✅ **Test end-to-end** (verify all changes work together)

---

## Success Criteria

- ✓ Smart review only shows already-seen words (no "New" tags in queue)
- ✓ Home screen counters (`seen`, `mastered`, `due`) are accurate and update after review
- ✓ Web Speech API documented in README with code example
- ✓ Add Word form is clearly laid out and intuitive
- ✓ plan.md created and .gitignore updated
- ✓ All buttons responsive and functional
- ✓ Navigation flows smoothly between screens
