# Infinity Nikki Tracker

A fan-made collection tracker for **Infinity Nikki** — see your Eureka sets and variants at a glance, track your progress, and know exactly what you're still missing.

🔗 **[infinity-nikki-tracker.vercel.app](https://infinity-nikki-tracker.vercel.app/)**

![Eureka page in light mode showing a grid of outfit set cards with style chip, set name, and quality stars, alongside a category progress sidebar](public/screenshot-light.png)

![Eureka page in dark mode showing the same layout with dark theme applied](public/screenshot-dark.png)

---

## Why This Exists

Infinity Nikki has a built-in collection view, but it doesn't give you a clear picture of your overall progress — how complete each set is, which variants you're missing, or where you stand without clicking around. This tracker solves that.

It lives outside the game, so you can check your collection status any time, even when you're not playing.

---

## Features

- **Browse all Eureka sets** — see every set and its individual pieces in one place, organized by style and rarity
- **Track what you have** — mark pieces as obtained and watch your progress update in real time
- **See what's missing** — a dedicated view filters down to only the pieces you haven't collected yet, so nothing slips through the cracks
- **Progress by trial** — see how far along you are in each in-game trial
- **Filter and sort** — narrow things down by category, color, rarity, or completion status
- **Use it as a guest or sign in** — browse freely without an account, or sign in to save and track your own personal collection
- **Looks great in any theme** — switch between light, dark, or system theme from the footer

---

## Getting Started

No installation needed — just open the tracker in your browser:

**[infinity-nikki-tracker.vercel.app](https://infinity-nikki-tracker.vercel.app/)**

To save your collection progress, create a free account or sign in. Guests can browse all sets and variants without signing in, but progress won't be saved.

---

## Project Status

✅ **Live** — the tracker is up and running.

This project is actively maintained. Planned additions include:

- [ ] Search — quickly find sets and variants by name
- [ ] Outfits (Glow-up) — tracking support for Glow-up outfit variants
- [ ] Outfits (Evolution) — tracking support for Evolution outfit variants

---

## Support

If you enjoy using the tracker and want to support its continued development, a coffee would be greatly appreciated!

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/mailauki)

---

## For Developers

### Tech Stack

- **[Next.js 16](https://nextjs.org)** — App Router, Server Components, Server Actions
- **[Supabase](https://supabase.com)** — Postgres database, Auth, Realtime subscriptions, Storage
- **[MUI (Material UI)](https://mui.com)** — Component library with CSS variables and built-in dark mode
- **[Tailwind CSS](https://tailwindcss.com)** — Utility classes for layout
- Deployed on **[Vercel](https://vercel.com)**

### Prerequisites

- Node.js 18+
- Yarn
- A [Supabase](https://supabase.com) project

### Getting Started

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/mailauki/infinity-nikki-tracker.git
   cd infinity-nikki-tracker
   yarn install
   ```

2. Create `.env.local` with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-or-publishable-key
   ```

   Both values can be found in your [Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true).

3. Start the development server:

   ```bash
   yarn dev
   ```

   The app will be running at [localhost:3000](http://localhost:3000).

### Scripts

| Command         | Description                    |
| --------------- | ------------------------------ |
| `yarn dev`      | Start the development server   |
| `yarn build`    | Build for production           |
| `yarn start`    | Start the production server    |
| `yarn lint`     | Run ESLint                     |
| `yarn lint:fix` | Run ESLint with auto-fix       |
| `yarn format`   | Format all files with Prettier |

### Contributing

Contributions are welcome! If you've spotted a missing set, a bug, or have a feature idea:

1. [Open an issue](https://github.com/mailauki/infinity-nikki-tracker/issues) to discuss the change
2. Fork the repo and create a branch for your changes
3. Submit a pull request with a clear description of what you've done

For small fixes, feel free to open a PR directly.

---

## Disclaimer

This is a fan-made project and is not affiliated with, endorsed by, or officially connected to Papergames or the Infinity Nikki development team. All game content, names, and assets are the property of their respective owners.
