import { refreshAccessToken, saveTokens } from "../auth/auth";
import type {
  PlayOptions,
  SpotifyDevicesResult,
  SpotifyPagingObject,
  SpotifyPlaybackState,
  SpotifyPlaylist,
  SpotifyPlaylistTrackObject,
  SpotifyRecentlyPlayed,
  SpotifySearchResult,
  SpotifyTokens,
  SpotifyTrack,
} from "../types";

const BASE_URL = "https://api.spotify.com/v1";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface SpotifyErrorBody {
  error?: { message?: string };
}

export default class SpotifyAPI {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private tokens: SpotifyTokens | null = null;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  setTokens(tokens: SpotifyTokens): void {
    this.tokens = tokens;
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.tokens) throw new Error("Not authenticated");
    // Refresh 60 seconds before expiry
    if (Date.now() > this.tokens.expires_at - 60_000) {
      const refreshed = await refreshAccessToken(
        this.clientId,
        this.clientSecret,
        this.tokens.refresh_token,
      );
      this.tokens = { ...this.tokens, ...refreshed };
      saveTokens(this.tokens);
    }
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
  ): Promise<T | null> {
    await this.ensureValidToken();

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.tokens!.access_token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };

    const response = await fetch(`${BASE_URL}${path}`, options);

    if (response.status === 204 || response.status === 202) return null;

    if (!response.ok) {
      const err = (await response
        .json()
        .catch((): SpotifyErrorBody => ({}))) as SpotifyErrorBody;
      throw new Error(err.error?.message ?? `Spotify API ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  private isNoActiveDeviceError(err: unknown): boolean {
    if (!(err instanceof Error)) return false;
    return err.message.toLowerCase().includes("no active device found");
  }

  private async activatePlaybackDevice(): Promise<void> {
    const devices = (await this.getDevices())?.devices ?? [];

    const active = devices.find((d) => d.is_active && !d.is_restricted);
    if (active) return;

    const candidate = devices.find((d) => !d.is_restricted);
    if (!candidate) {
      throw new Error(
        "No available Spotify device. Open Spotify on a device and try again.",
      );
    }

    await this.transferPlayback(candidate.id, false);
  }

  private async withActiveDeviceRetry<T>(
    command: () => Promise<T>,
  ): Promise<T> {
    try {
      return await command();
    } catch (err) {
      if (!this.isNoActiveDeviceError(err)) throw err;
      await this.activatePlaybackDevice();
      return command();
    }
  }

  // ── Playback ──────────────────────────────────────────────────────────────

  getPlaybackState(): Promise<SpotifyPlaybackState | null> {
    return this.request<SpotifyPlaybackState>("GET", "/me/player");
  }

  play(options?: PlayOptions): Promise<null> {
    return this.withActiveDeviceRetry(() =>
      this.request<null>(
        "PUT",
        "/me/player/play",
        options && Object.keys(options).length ? options : undefined,
      ),
    );
  }

  pause(): Promise<null> {
    return this.withActiveDeviceRetry(() =>
      this.request<null>("PUT", "/me/player/pause"),
    );
  }

  next(): Promise<null> {
    return this.withActiveDeviceRetry(() =>
      this.request<null>("POST", "/me/player/next"),
    );
  }

  previous(): Promise<null> {
    return this.withActiveDeviceRetry(() =>
      this.request<null>("POST", "/me/player/previous"),
    );
  }

  setVolume(volumePercent: number): Promise<null> {
    return this.withActiveDeviceRetry(() =>
      this.request<null>(
        "PUT",
        `/me/player/volume?volume_percent=${volumePercent}`,
      ),
    );
  }

  seek(positionMs: number): Promise<null> {
    return this.withActiveDeviceRetry(() =>
      this.request<null>("PUT", `/me/player/seek?position_ms=${positionMs}`),
    );
  }

  getDevices(): Promise<SpotifyDevicesResult | null> {
    return this.request<SpotifyDevicesResult>("GET", "/me/player/devices");
  }

  transferPlayback(deviceId: string, play = false): Promise<null> {
    return this.request<null>("PUT", "/me/player", {
      device_ids: [deviceId],
      play,
    });
  }

  // ── Library ───────────────────────────────────────────────────────────────

  getPlaylists(
    limit = 50,
  ): Promise<SpotifyPagingObject<SpotifyPlaylist> | null> {
    return this.request<SpotifyPagingObject<SpotifyPlaylist>>(
      `GET`,
      `/me/playlists?limit=${limit}`,
    );
  }

  getPlaylistTracks(
    playlistId: string,
    limit = 50,
  ): Promise<SpotifyPagingObject<SpotifyPlaylistTrackObject> | null> {
    const fields =
      "items(track(id,name,uri,duration_ms,artists(name),album(name)))";
    return this.request<SpotifyPagingObject<SpotifyPlaylistTrackObject>>(
      "GET",
      `/playlists/${playlistId}/tracks?limit=${limit}&fields=${encodeURIComponent(fields)}`,
    );
  }

  getRecentlyPlayed(limit = 20): Promise<SpotifyRecentlyPlayed | null> {
    return this.request<SpotifyRecentlyPlayed>(
      "GET",
      `/me/player/recently-played?limit=${limit}`,
    );
  }

  getTopTracks(limit = 20): Promise<SpotifyPagingObject<SpotifyTrack> | null> {
    return this.request<SpotifyPagingObject<SpotifyTrack>>(
      "GET",
      `/me/top/tracks?limit=${limit}`,
    );
  }

  // ── Search ────────────────────────────────────────────────────────────────

  search(
    query: string,
    types: string[] = ["track"],
    limit = 30,
  ): Promise<SpotifySearchResult | null> {
    const params = new URLSearchParams({
      q: query,
      type: types.join(","),
      limit: String(limit),
    });
    return this.request<SpotifySearchResult>("GET", `/search?${params}`);
  }
}
