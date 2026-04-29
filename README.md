# Fauz's Birthday Reels

A small password-gated web app for the Marrakech '26 trip. Each girl uploads 3 to 8 clips and photos, hits Generate, and gets a cinematic vintage reel. Every render is different (template + grade + transitions + font + clip order randomized).

## How it works

1. Browser uploads media to a public Supabase Storage bucket.
2. Browser builds a Creatomate "source" JSON (one of 6 cinematic vintage looks).
3. Netlify function calls the Creatomate API with the secret key.
4. Browser polls until render is ready, then displays and downloads the MP4.

The reels intentionally render silent so anyone can add a trending Instagram audio inside the Reels editor before posting.

## Setup

### 1. Supabase
- Create a free project at https://supabase.com.
- Storage > Create bucket named `uploads`. Toggle **Public**.
- Project Settings > API: copy the **Project URL** and **anon public** key.
- Open `js/config.js` and paste both values.

### 2. Creatomate
- Sign up at https://creatomate.com. Free tier is fine.
- Project Settings > API: copy your **API key**. (Goes in Netlify env vars later, not in code.)

### 3. Local push to GitHub
```bash
cd "~/Claude Projects/fauz-bday-reels"
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/Flospire-creator/fauz-bday-reels.git
git push -u origin main
```

### 4. Netlify
- Add new site > Import an existing project > GitHub > pick `fauz-bday-reels`.
- Build command: leave empty. Publish directory: `.`. Functions directory: `netlify/functions`.
- Site settings > Environment variables > add `CREATOMATE_API_KEY` with your Creatomate key.
- Deploy.

## Files

- `index.html` UI shell.
- `css/style.css` cinematic vintage theme.
- `js/config.js` public config (Supabase URL/anon key, password, trip name).
- `js/template-builder.js` builds the randomized Creatomate source JSON.
- `js/app.js` auth gate, uploads, render trigger, polling.
- `netlify/functions/render.js` server-side proxy that hides the Creatomate secret.
- `netlify/functions/render-status.js` polls render status.
- `netlify.toml` Netlify config and security headers.

## Customizing

- Trip title/place: `js/config.js` (`TRIP_TITLE`, `TRIP_PLACE`).
- Password: `js/config.js` (`PASSWORD`).
- Names: edit the chip list in `index.html` if needed.
- Templates and grades: `js/template-builder.js`.
