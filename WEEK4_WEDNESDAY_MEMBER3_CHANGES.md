# Week 4 Wednesday - Member 3 Changes

## Task: UI consistency — fonts, colors, spacing, responsive design on all pages

### Frontend Updates
- **`Feed.tsx`**: Updated the post card's styling classes for better UI consistency. Changed `bg-slate-950/70` to `bg-slate-950/60`, and added `hover:scale-[1.01]` and `shadow-lg` to match other cards.
- **`Events.tsx`**: Modified the hover scale transition for event cards from `hover:scale-[1.02]` to `hover:scale-[1.01]` to ensure consistent animation across the application.
- **`Clubs.tsx`**: Added `shadow-lg` and updated the conditional styling of border shadow on selection (`shadow-indigo-500/10`) to match the consistency guidelines.

### Verification and Checks
- **Frontend**: Successfully verified the changes by running `npm run build` to ensure there are no compilation or type errors in the CI/CD pipeline.
- **Backend**: Executed code formatters and linters (`black` and `ruff`) via `python -m` to enforce coding style and avoid backend failures. All checks passed successfully.

These changes have been committed to the `feature/week4-wednesday-member3` branch and are ready to be merged into `develop`.
