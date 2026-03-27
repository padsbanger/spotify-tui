import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import React, { useCallback, useEffect, useState } from "react";
import type SpotifyAPI from "../api/spotify";
import type { SpotifyPlaybackState, SpotifyTrack } from "../types";
import TrackList from "./TrackList";

interface SearchProps {
  api: SpotifyAPI;
  playback: SpotifyPlaybackState | null;
  onRefresh?: () => void;
  onTypingChange?: (typing: boolean) => void;
}

export default function Search({
  api,
  playback,
  onRefresh,
  onTypingChange,
}: SearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[] | null>(null);
  const [selIndex, setSelIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const [inputActive, setInputActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notify parent when typing mode changes so global shortcuts are suppressed
  useEffect(() => {
    onTypingChange?.(inputActive);
    return () => onTypingChange?.(false);
  }, [inputActive]);

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) return;
      setSearching(true);
      setError(null);
      try {
        const data = await api.search(q, ["track"]);
        const tracks = data?.tracks?.items ?? [];
        setResults(tracks);
        setSelIndex(0);
        setInputActive(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSearching(false);
      }
    },
    [api],
  );

  const playSelected = useCallback(async () => {
    const track = results?.[selIndex];
    if (!track) return;
    try {
      await api.play({ uris: [track.uri] });
      setTimeout(() => onRefresh?.(), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [results, selIndex, api, onRefresh]);

  useInput((input, key) => {
    if (inputActive) {
      if (key.escape) setInputActive(false);
      return; // TextInput handles everything else
    }

    if (input === "i" || input === "/") {
      setInputActive(true);
      return;
    }

    if (results) {
      if (key.upArrow) setSelIndex((i) => Math.max(0, i - 1));
      if (key.downArrow)
        setSelIndex((i) => Math.min(results.length - 1, i + 1));
      if (key.return) void playSelected();
    }
  });

  const currentTrackId = playback?.item?.id;

  return (
    <Box flexDirection="column">
      <Box paddingX={1} marginBottom={1}>
        <Text color="green" bold>
          ⌕{" "}
        </Text>
        {inputActive ? (
          <TextInput
            value={query}
            onChange={setQuery}
            onSubmit={(q) => void runSearch(q)}
            placeholder="Search for songs, artists, albums…"
            focus
          />
        ) : (
          <Box>
            <Text color={query ? "white" : "gray"}>{query || "No query"}</Text>
            <Text color="gray" dimColor>
              {" "}
              i/: edit ↑↓: navigate Enter: play
            </Text>
          </Box>
        )}
      </Box>

      {error && (
        <Box paddingX={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}
      {searching && (
        <Box paddingX={1}>
          <Text color="gray">Searching…</Text>
        </Box>
      )}

      {results && !searching && (
        <Box flexDirection="column">
          <Box paddingX={1}>
            <Text color="green" bold>
              Results
            </Text>
            <Text color="gray" dimColor>
              {" "}
              {results.length} tracks found
            </Text>
          </Box>
          <TrackList
            tracks={results}
            selectedIndex={selIndex}
            playingTrackId={currentTrackId}
            maxHeight={16}
          />
        </Box>
      )}

      {!results && !searching && !inputActive && (
        <Box paddingX={1}>
          <Text color="gray">Press i or / to start searching.</Text>
        </Box>
      )}
    </Box>
  );
}
