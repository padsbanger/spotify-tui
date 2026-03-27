import { Box, Text, useInput } from "ink";
import React, { useEffect, useState } from "react";
import type SpotifyAPI from "../api/spotify";
import type {
  SpotifyPlaybackState,
  SpotifyPlaylist,
  SpotifyTrack,
} from "../types";
import TrackList from "./TrackList";

interface LibraryProps {
  api: SpotifyAPI;
  playback: SpotifyPlaybackState | null;
  onRefresh?: () => void;
}

type LibraryView = "playlists" | "tracks";

export default function Library({ api, playback, onRefresh }: LibraryProps) {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selPlaylist, setSelPlaylist] = useState(0);
  const [tracks, setTracks] = useState<SpotifyTrack[] | null>(null);
  const [selTrack, setSelTrack] = useState(0);
  const [view, setView] = useState<LibraryView>("playlists");
  const [loading, setLoading] = useState(true);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPlaylists()
      .then((data) => {
        setPlaylists(data?.items ?? []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, []);

  const openPlaylist = async (playlist: SpotifyPlaylist) => {
    setTracksLoading(true);
    setError(null);
    try {
      const data = await api.getPlaylistTracks(playlist.id);
      const loaded = (data?.items ?? [])
        .map((i) => i.track)
        .filter((t): t is SpotifyTrack => t !== null);
      setTracks(loaded);
      setSelTrack(0);
      setView("tracks");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setTracksLoading(false);
    }
  };

  const playTrack = async () => {
    const playlist = playlists[selPlaylist];
    const track = tracks?.[selTrack];
    if (!track || !playlist) return;
    try {
      await api.play({ context_uri: playlist.uri, offset: { uri: track.uri } });
      setTimeout(() => onRefresh?.(), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useInput((input, key) => {
    if (view === "playlists") {
      if (key.upArrow) setSelPlaylist((i) => Math.max(0, i - 1));
      if (key.downArrow)
        setSelPlaylist((i) => Math.min(playlists.length - 1, i + 1));
      if (key.return && !tracksLoading)
        void openPlaylist(playlists[selPlaylist]!);
    } else {
      if (key.upArrow) setSelTrack((i) => Math.max(0, i - 1));
      if (key.downArrow)
        setSelTrack((i) => Math.min((tracks?.length ?? 1) - 1, i + 1));
      if (key.return) void playTrack();
      if (key.escape || input === "b") {
        setView("playlists");
        setTracks(null);
      }
    }
  });

  if (loading) return <Text color="gray"> Loading playlists...</Text>;

  if (error) return <Text color="red"> Error: {error}</Text>;

  if (view === "tracks") {
    const playlist = playlists[selPlaylist];
    return (
      <Box flexDirection="column">
        <Box paddingX={1} marginBottom={1}>
          <Text color="green" bold>
            ♫ {playlist?.name}
          </Text>
          <Text color="gray" dimColor>
            {" "}
            Esc/b: back ↑↓: navigate Enter: play
          </Text>
        </Box>
        {tracksLoading ? (
          <Text color="gray"> Loading tracks...</Text>
        ) : (
          <TrackList
            tracks={tracks ?? []}
            selectedIndex={selTrack}
            playingTrackId={playback?.item?.id}
            maxHeight={16}
          />
        )}
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box paddingX={1} marginBottom={1}>
        <Text color="green" bold>
          Your Playlists
        </Text>
        <Text color="gray" dimColor>
          {" "}
          ↑↓: navigate Enter: open
        </Text>
      </Box>
      {playlists.map((pl, i) => (
        <Box key={pl.id} paddingX={1}>
          <Text
            color={i === selPlaylist ? "black" : "white"}
            backgroundColor={i === selPlaylist ? "green" : undefined}
          >
            {" "}
            {pl.name.slice(0, 40).padEnd(41)}
            <Text
              color={i === selPlaylist ? "black" : "gray"}
              dimColor={i !== selPlaylist}
            >
              {String(pl.tracks.total).padStart(4)} tracks
            </Text>{" "}
          </Text>
        </Box>
      ))}
      {playlists.length === 0 && <Text color="gray"> No playlists found.</Text>}
    </Box>
  );
}
