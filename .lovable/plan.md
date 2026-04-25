## Lens Tab — a thoughtful new-tab companion

A web app (later wrappable as a Chrome extension) that opens like a new-tab dashboard. Each visit greets the user with a curated color palette as the backdrop and a single thought-provoking question drawn from a "lens" — inspired by Jesse Schell's Deck of Lenses but extensible. An AI agent personalizes questions over time based on the user's stated goals and past reflections.

### Core experience (new-tab view)

- Full-bleed gradient background built from a Color Hunt–style 4-color palette.
- One lens card centered: lens name, the question, a short prompt to reflect.
- Inline answer field — type a thought, save, or skip to the next lens.
- Palette swatches pinned bottom: click any swatch to copy hex; "Save palette" heart; "New palette" shuffle.
- Subtle top bar: date/time, goals shortcut, history, settings.
- "Next lens" button regenerates question + palette together.

### Lens system

- **Starter pack** seeded on first load (~30 lenses): a curated mix from the Deck of Lenses (Lens of Surprise, Fun, Curiosity, Essential Experience, etc.) plus general creative-thinking lenses so it's useful beyond game design.
- **User-defined lenses**: create custom lenses with a name, theme, and example questions. Edit, delete, toggle on/off.
- Each lens can include multiple seed questions; the agent rephrases or generates new ones in context.

### The agent (context that grows)

- **Goals**: user lists 1–5 active goals (e.g. "ship my indie game", "improve as a writer"). Editable anytime.
- **Memory layers**:
  - Local-first: anonymous users get full functionality, data in browser storage.
  - Optional account (Lovable Cloud auth): syncs goals, lenses, answers, saved palettes across devices.
  - Server-side history per account informs each new question.
- Every "new tab" call sends: active goals + recent reflections (last ~10) + selected lens pool → agent returns a tailored question and a 4-color palette that matches its tone (calm, energetic, melancholy, etc.).
- Weekly "patterns" view: agent surfaces themes it notices in your reflections.

### Palette behavior

- Agent generates palette to match question mood, OR user can lock "shuffle from saved/curated only".
- Saved palettes library: grid view, copy hex, copy CSS, export.
- A small built-in seed library of ~50 curated palettes for offline/anonymous fallback.

### Pages

- `/` — new-tab view (the main experience).
- `/goals` — manage goals.
- `/lenses` — browse, toggle, and create lenses.
- `/history` — past questions + your answers, searchable; pattern insights.
- `/palettes` — saved + curated palette library.
- `/auth` — sign in / sign up (optional).

### Extension path (phase 2, after web app works)

- Package the `/` route as a Chrome MV3 extension that overrides `chrome_url_overrides.newtab`.
- Anonymous mode uses local storage; signed-in users sync via the same backend.
- Provide a downloadable `.zip` from the web app's settings page with install instructions.

### Technical notes

- TanStack Start routes per page above; `/` is the new-tab dashboard.
- Lovable Cloud (Supabase) for auth + tables: `goals`, `lenses`, `reflections`, `saved_palettes`, plus a seeded `starter_lenses` and `starter_palettes`. RLS scoped to `user_id`.
- Anonymous mode mirrors the same shapes in `localStorage`; on sign-in, offer to migrate local data to the account.
- Lovable AI Gateway (default `google/gemini-3-flash-preview`) via a server function. Structured output (tool-calling) returns `{ lensId, question, palette: [hex,hex,hex,hex], mood }`.
- Answer storage is plain text; we never send other users' data to the model — only the current user's goals + their own recent reflections.
- Color palette generation: agent proposes hexes; we validate format and contrast before applying as background.

### Out of scope for v1

- Team/shared lenses, social sharing of reflections, mobile app, advanced analytics dashboards. Easy to add later.