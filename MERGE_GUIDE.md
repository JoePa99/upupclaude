# Merge Conflict Guidance for Pin Highlighting

When resolving merge conflicts related to the pin-selection highlight, please use the following rules so builds stay green and the runtime highlight continues to work:

1. **Global CSS (`app/globals.css`)**
   - If you see a conflict introducing `::highlight(...)` selectors, **remove** those blocks. Turbopack does not support the CSS Highlight pseudo-element and will fail the build.
   - Keep the comment that explains the runtime highlight; do not add back highlight styling in CSS.

2. **Selection Hook (`hooks/useTextSelection.ts`)**
   - Prefer the version that restores the saved range in JavaScript only; do not add `CSS.highlights`, `::highlight`, or injected styles.
   - Ensure `savedRangeRef` is used to reapply the selection on `selectionchange` and `mouseup`.

3. **Sanitizer (`scripts/stripHighlightPseudo.js`)**
   - Keep this script intact and in the `prebuild` step. It strips any accidental `::highlight` blocks before the build. If conflicts appear here, retain the logic that removes entire highlight blocks.

4. **After resolving conflicts**
   - Run `npm run build` locally to confirm Turbopack can parse `app/globals.css` and that TypeScript files are syntactically valid.

Following these rules will prevent the recurring deployment failures while keeping the pin highlight functioning at runtime.
