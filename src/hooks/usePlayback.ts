import { useCallback, useEffect, useState } from "react";
import type SpotifyAPI from "../api/spotify";
import type { SpotifyPlaybackState } from "../types";

interface UsePlaybackResult {
  playback: SpotifyPlaybackState | null;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePlayback(
  api: SpotifyAPI,
  intervalMs = 3000,
): UsePlaybackResult {
  const [playback, setPlayback] = useState<SpotifyPlaybackState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const state = await api.getPlaybackState();
      console.log(state);
      setPlayback(state);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [api]);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), intervalMs);
    return () => clearInterval(interval);
  }, [refresh, intervalMs]);

  return { playback, error, refresh };
}
