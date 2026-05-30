# German Vocabulary - JSON Format

This directory contains German vocabulary organized by CEFR levels (A1, A2, B1, B2) in JSON format.

## File Structure

- `a1.json` - Beginner level (231 words)
- `a2.json` - Elementary level (322 words)
- `b1.json` - Intermediate level (308 words)
- `b2.json` - Upper-Intermediate level (139 words)

**Total: 1000 words**

## JSON Format

Each JSON file follows this structure:

```json
{
  "language": "german",
  "level": "A1",
  "words": [
    {
      "id": "de_a1_001",
      "target": "die Mutter",
      "native": "mother",
      "pronunciation": "dee MOO-ter",
      "category": "People & Family",
      "examples": [
        {
          "target": "Meine Mutter kocht gerne.",
          "native": "My mother likes to cook."
        }
      ]
    }
  ]
}
```

## Field Descriptions

- **id**: Unique identifier in format `de_{level}_{number}` (e.g., `de_a1_001`)
- **target**: The German word or phrase
- **native**: English translation
- **pronunciation**: Phonetic pronunciation guide
- **category**: Word category (e.g., "People & Family", "Food & Drink", "Travel")
- **examples**: Array of example sentences with translations

## Categories

Common categories include:
- People & Family
- Food & Drink
- Travel
- Work
- Body
- Nature
- Emotions
- Colors
- Places
- Numbers
- Time

## Adding New Words

### Method 1: Edit JSON Files Directly

1. Open the appropriate level file (e.g., `a1.json` for beginner words)
2. Add a new word object to the `words` array
3. Ensure the `id` is unique and follows the naming convention
4. Save the file

Example:
```json
{
  "id": "de_a1_232",
  "target": "das Buch",
  "native": "book",
  "pronunciation": "das bookh",
  "category": "Work",
  "examples": [
    {
      "target": "Das Buch ist interessant.",
      "native": "The book is interesting."
    }
  ]
}
```

### Method 2: Use the In-App Feature

The app includes a built-in "Add Word" feature that allows you to add custom words without editing JSON files. These are stored separately in browser localStorage.

## Validation Rules

When adding words, ensure:
- **Required fields**: `target` and `native` must not be empty
- **Length limits**:
  - Words: Maximum 200 characters
  - Examples: Maximum 500 characters
- **ID format**: Must be unique and follow `de_{level}_{number}` pattern
- **Level**: Must be one of: A1, A2, B1, B2
- **Category**: Should match existing categories for consistency

## Migration from Old Format

The old `words.js` format has been converted to JSON. If you need to convert again:

```bash
node scripts/convert-words-to-json.js
```

This script reads `words.js` and generates the JSON files automatically.

## Notes

- The old `words.js` file is kept for reference but is no longer used by the application
- Custom words added through the app are stored separately in localStorage
- Each word can have multiple examples, though currently only the first is displayed