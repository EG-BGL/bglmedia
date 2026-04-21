
## Remove Featured Fixture Below Ticker

Remove the featured fixture card that appears directly under the scores ticker on the homepage.

### Change
- **`src/pages/Index.tsx`**: Locate the featured/next fixture card rendered immediately after the ticker section and remove that block (and any now-unused imports/variables it relied on).

### Notes
- Ticker stays intact.
- Other homepage sections (headlines, coach/player highlights, ladder snapshot, etc.) remain unchanged.
