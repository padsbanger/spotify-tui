import { randomBytes } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { createServer, IncomingMessage, ServerResponse } from "http";
import open from "open";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import type { SpotifyTokens } from "../types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = resolve(__dirname, "..", "..", ".tokens.json");

const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-library-read",
  "user-top-read",
  "user-read-recently-played",
  "playlist-read-private",
  "playlist-read-collaborative",
  "streaming",
].join(" ");

export function loadTokens(): SpotifyTokens | null {
  if (!existsSync(TOKENS_PATH)) return null;
  try {
    return JSON.parse(readFileSync(TOKENS_PATH, "utf8")) as SpotifyTokens;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: SpotifyTokens): void {
  writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<Partial<SpotifyTokens>> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Token refresh failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

export async function authenticate(
  clientId: string,
  clientSecret: string,
): Promise<SpotifyTokens> {
  const redirectUri =
    process.env["SPOTIFY_REDIRECT_URI"] ?? "http://localhost:8888/callback";
  const state = randomBytes(16).toString("hex");

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", SCOPES);

  return new Promise<SpotifyTokens>((resolvePromise, rejectPromise) => {
    const server = createServer(
      async (req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url ?? "/", "http://localhost:8888");

        if (url.pathname !== "/callback") {
          res.writeHead(404);
          res.end();
          return;
        }

        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            "<html><body><h1>Authentication failed</h1><p>You can close this tab.</p></body></html>",
          );
          server.close();
          rejectPromise(new Error(`Spotify auth denied: ${error}`));
          return;
        }

        if (returnedState !== state) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            "<html><body><h1>State mismatch — possible CSRF</h1></body></html>",
          );
          server.close();
          rejectPromise(new Error("OAuth state mismatch"));
          return;
        }

        try {
          const tokenResponse = await fetch(
            "https://accounts.spotify.com/api/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
              },
              body: new URLSearchParams({
                grant_type: "authorization_code",
                code: code!,
                redirect_uri: redirectUri,
              }),
            },
          );

          if (!tokenResponse.ok) {
            throw new Error(`Token exchange failed: ${tokenResponse.status}`);
          }

          const tokenData = (await tokenResponse.json()) as {
            access_token: string;
            refresh_token: string;
            expires_in: number;
          };

          const tokens: SpotifyTokens = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: Date.now() + tokenData.expires_in * 1000,
          };

          saveTokens(tokens);

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            "<html><body><h1>Authentication successful!</h1><p>You can close this tab and return to the terminal.</p></body></html>",
          );
          server.close();
          resolvePromise(tokens);
        } catch (err) {
          server.close();
          rejectPromise(err);
        }
      },
    );

    server.listen(8888, () => {
      console.log("\nOpening Spotify authorization in your browser...");
      console.log("If the browser doesn't open automatically, visit:");
      console.log(authUrl.toString());
      open(authUrl.toString()).catch(() => {});
    });

    server.on("error", rejectPromise);
  });
}
