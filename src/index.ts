#!/usr/bin/env node
import dotenv from "dotenv";
import { render } from "ink";
import { dirname, resolve } from "path";
import React from "react";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env") });

import SpotifyAPI from "./api/spotify.js";
import App from "./App.js";
import { authenticate, loadTokens } from "./auth/auth.js";

async function main(): Promise<void> {
  const clientId = process.env["SPOTIFY_CLIENT_ID"];
  const clientSecret = process.env["SPOTIFY_CLIENT_SECRET"];

  if (!clientId || !clientSecret) {
    console.error("");
    console.error("  Missing Spotify credentials.");
    console.error(
      "  Copy .env.example to .env and fill in your Client ID and Secret.",
    );
    console.error(
      "  You can create an app at https://developer.spotify.com/dashboard",
    );
    console.error("");
    process.exit(1);
  }

  let tokens = loadTokens();

  if (!tokens) {
    console.log("\n  No saved tokens — starting OAuth flow...\n");
    tokens = await authenticate(clientId, clientSecret);
    console.log("\n  Authentication successful! Launching TUI...\n");
  }

  const api = new SpotifyAPI(clientId, clientSecret);
  api.setTokens(tokens);

  render(React.createElement(App, { api }));
}

main().catch((err) => {
  console.error("\nFatal error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
