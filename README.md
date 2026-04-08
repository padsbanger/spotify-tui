# spotify-tui

A terminal UI for Spotify built with Ink + React.

## Features

- Browse your playlists and open tracks
- Search tracks and play instantly
- View current playback and progress
- Control playback (play/pause, next/previous, volume)

## Requirements

- Node.js 18+
- A Spotify Premium account (required by Spotify playback APIs)
- Spotify Developer app credentials

## Setup

1. Install dependencies:
   - `npm install`
2. Create your environment file:
   - Copy `.env.example` to `.env`
3. Fill in `.env` values:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REDIRECT_URI` (default: `http://localhost:8888/callback`)

## Run

- Development mode: `npm run dev`
- Start once: `npm start`
- Type-check: `npm run typecheck`
- Build: `npm run build`

On first run, your browser opens for Spotify OAuth login.
Tokens are saved to `.tokens.json` in the project root.

## Keybindings

- `Tab`: switch between Library/Search
- `Space`: play/pause
- `←` / `→`: previous/next
- `+` / `-`: volume up/down
- `↑` / `↓`: navigate lists
- `Enter`: open/select/play
- `q` or `Ctrl+C`: quit

Search-specific:

- `i` or `/`: focus search input
- `Esc`: leave search input

Library-specific:

- `Esc` or `b`: go back from tracks to playlists
