# How to Upload These Template Files to GitHub

These files need to be added to your existing `thedressedit` GitHub repository.
They will REPLACE some existing files and ADD new ones.

## Files to upload:

### REPLACE these existing files:
- `src/pages/index.astro` (replaces the "Coming Soon" page with a real homepage)

### ADD these new files:
- `src/styles/global.css`
- `src/layouts/BaseLayout.astro`
- `src/components/ProductGrid.astro`
- `src/components/StylistTip.astro`
- `src/components/EndourceCTA.astro`
- `src/pages/articles/[slug].astro`

## How to upload:

1. Go to github.com/troy-endource/thedressedit
2. Navigate to each folder and use "Add file" > "Create new file"
3. Type the path (e.g., `styles/global.css` when you're in `src/`)
4. Paste the file contents
5. Commit each file

OR (easier): 
1. Delete the entire repository
2. Create a fresh one with the same name
3. Upload ALL files from this zip at once

Netlify will automatically rebuild after each commit.
