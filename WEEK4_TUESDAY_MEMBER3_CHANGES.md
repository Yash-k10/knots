# Week 4 - Tuesday Task (Member 3)

## Task Description
"Bug fixing sprint — each member fixes bugs in their own modules"

## Fixes Applied
- **Bug Identified:** The `Events` frontend page (`frontend/src/pages/Events.tsx`) was not integrated with the backend API and was rendering hardcoded `MOCK_EVENTS`.
- **Created Events API Service:** Created `frontend/src/services/events.ts` to implement `eventsService` functions: `getEvents`, `getCategories`, and `rsvpToEvent`.
- **Integrated API with Frontend:** Rewrote `frontend/src/pages/Events.tsx` to fetch events dynamically using `useEffect`. Implemented dynamic filtering for categories and search keywords. Handled loading states using a spinner icon. Replaced mock categories styling with dynamic styling.
- **Verification:** Ran `npm run build` in the `frontend/` directory to ensure no TypeScript compilation or format errors. The build passed successfully.
- **Version Control Strategy:** Created a feature branch `feature/week4-tuesday-member3` from `develop`, committed the code, and merged it back into `develop` cleanly. No changes were made to the `main` branch.
