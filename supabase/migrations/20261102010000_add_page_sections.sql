-- About/Help page copy, editable from /admin/content instead of a code change.
-- One row per section; `body` is Markdown rendered by components/markdown-body.tsx.
-- `layout = 'cards'` renders each `### Heading` block of the body as a card.
-- Sections are seeded here and only edited (never added/removed) from the admin:
-- the pages anchor built-in blocks (the add-to-home-screen accordion, the admin
-- access alert) to known slugs.

create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page text not null check (page in ('about', 'help')),
  slug text not null,
  "order" integer not null,
  title text not null,
  body text not null default '',
  layout text not null default 'prose' check (layout in ('prose', 'cards')),
  updated_at timestamptz not null default now(),
  unique (page, slug)
);

alter table public.page_sections enable row level security;

create policy page_sections_read on public.page_sections
  for select using (true);

-- Edit-only from the admin, so admins get UPDATE and nothing else.
create policy page_sections_admin_update on public.page_sections
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.page_sections (page, slug, "order", title, layout, body) values
('about', 'what-is-this', 1, 'What is this?', 'prose', $md$A fan-made collection tracker for [Infinity Nikki](https://infinitynikki.infoldgames.com/) — see your outfits, Eureka sets, makeup, and Momo's cloaks at a glance, track your progress, and know exactly what you're still missing.$md$),

('about', 'about-me', 2, 'About me', 'prose', $md$I'm Julie Evans, a UX-focused developer. This tracker is a side project built with Next.js, Supabase, and MUI — born out of playing the game and wanting a clearer view of my own collection.

- GitHub: [github.com/mailauki](https://github.com/mailauki)
- Instagram: [instagram.com/julieuxdev](https://www.instagram.com/julieuxdev)
- [Behind the build — Medium article](https://medium.com/@julieuxdev/i-built-a-collection-tracker-for-infinity-nikki-because-the-game-wouldnt-tell-me-what-i-was-missing-95ffcf3b2109)
- Contact: [julie.ux.dev@gmail.com](mailto:julie.ux.dev@gmail.com)$md$),

('about', 'features', 3, 'Features & Pages', 'cards', $md$Browse freely without an account, or sign in to save and track your own personal collection. Filtering, sorting, and views are available either way — obtained and missing filters unlock once you're signed in.

### Eureka

Browse every Eureka set and its individual pieces in one place, mark pieces as obtained, and watch your progress update in real time.

- Group by set or view pieces individually, and filter to a single Eureka set
- Switch to a by-color view, or filter by a specific color
- Filter by category and rarity, and sort newest or oldest first
- When signed in, filter to only obtained or only missing pieces — plus a dedicated Missing view that lists everything you haven’t collected yet
- Trials view — see how far along you are in each in-game trial

### Outfits

Track full outfit sets along with their evolutions and glow-ups, and mark what you own.

- Group by set or view pieces individually, and filter to a single outfit set
- Filter by evolution stage, or hide evolutions and glow-ups to focus on base sets
- Filter by one or more outfit categories and by rarity
- Adjust the display density and sort order, and when signed in filter to only obtained or only missing items

### Seasons

Explore outfits by season — grouped by location, with each season’s categories and set counts at a glance.

- Sort seasons newest or oldest first
- Open any season to see its outfit sets grouped by category

### Makeup

Track makeup sets and their individual pieces.

- Group by set or view pieces individually
- Filter by makeup category, season, and season category
- When signed in, filter to only obtained or only missing pieces

### Momo's Cloaks

Track Momo's cloaks and see which ones you're still missing.

- Filter by location, and sort by name or newest first
- Toggle alternate artwork where a cloak has a second image
- See the outfit each cloak is associated with on its detail page

### Custom Looks

Build and save your own outfit combinations from Eureka and outfit pieces.

- Mix and match pieces into a saved look, with thumbnail previews
- Save a few looks for free, or upgrade to premium for unlimited looks

### Profile

Your collection at a glance once you’re signed in.

- See completed Outfit Sets, Evolutions, Glow-ups, and Eureka Sets at a glance
- Switch between Outfit, Eureka, Makeup, and Momo’s Cloak stats — each with completion charts and your most recent updates
- Share your collection with a public profile at /u/your-username

### Settings

Personalize the app and manage your account.

- Appearance — choose a system, light, or dark mode, set a default sort order, and pick a color theme (additional themes with premium)
- Profile — update your display name, username, and avatar
- Account — change your email or password, request admin access, or delete your account

### Feedback

Report a problem or suggest something new, right from the app.

- Report an issue — bug reports and missing content, with up to 3 screenshots
- Request a feature — new features and improvements
- Report from any page and the set or piece you were looking at comes along automatically$md$),

('about', 'links-resources', 4, 'Links & Resources', 'prose', $md$This project is open source. Contributions are welcome — whether it's fixing a bug, improving the UI, or adding new data.

- [GitHub Repository](https://github.com/mailauki/infinity-nikki-tracker) — the full source for this tracker, open to pull requests
- [Open an issue](https://github.com/mailauki/infinity-nikki-tracker/issues) for bugs or feature requests

### Helpful resources

- [Infinity Nikki Official Website](https://infinitynikki.infoldgames.com/) — patch notes, event schedules, and official announcements
- [Infinity Nikki Wiki](https://infinitynikki.fandom.com/) — community-maintained reference for outfits, items, and quests
- [Miraland Collection](https://www.miralandcollection.com/) — browsable catalog of outfits and their pieces
- [Infinity Nikki Resonance Tracker](https://gongeo.us) — browsable catalog of outfits and their pieces
- [Infinity Nikki Library](https://infinitynikkilibrary.com/) — searchable database of in-game items and sets$md$),

('about', 'roadmap', 5, 'Roadmap', 'prose', $md$Planned features and improvements:

- Search — quickly find sets and pieces by name
- Outfit Pieces — tracking support for pieces not part of any outfit sets
- Favorites — save your favorite sets and pieces
- Friends — follow friends to compare collection progress
- Sharing — shareable links to your looks and collection$md$),

('help', 'how-to-use', 1, 'How to use', 'prose', $md$No account needed — browse freely as a guest. Sign in to save and track your own collection; progress won't be saved without an account.

1. Track full outfit sets, evolutions, and glow-ups from the [Outfits](/outfits) page, and explore them by season on the [Seasons](/seasons) page.
2. Browse every Eureka set and its pieces from the [Eureka](/eureka) page. Click an item to mark it as obtained — from the grid or a set's detail page.
3. Use the [Trials](/eureka/trials) view to see your Eureka progress grouped by in-game trial.
4. Open the filter menu to narrow things down by category, color, rarity, evolution, or completion status — and to switch grouping, density, and sort order.
5. To see only what you're still missing, set completion status to **Missing** in the filter menu (available once you're signed in).
6. Build and save your own outfit combinations from the [Custom Looks](/looks) page.
7. View your collection stats and recent updates on the [Profile](/profile) page.
8. Personalize the app and manage your account from the [Settings](/settings) page — theme mode, default sort, color theme, profile details, and account options.$md$),

('help', 'admin-access', 2, 'Admin access', 'prose', $md$As an admin, you can manage the data that powers this tracker. Use the [Admin Panel](/admin) to add and edit database items, and track counts and recent activity.$md$);
