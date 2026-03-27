import { Box, Text } from "ink";
import React from "react";
import type { SpotifyTrack } from "../types";

interface TrackListProps {
  tracks?: SpotifyTrack[];
  selectedIndex?: number;
  playingTrackId?: string;
  maxHeight?: number;
}

function formatMs(ms: number | undefined): string {
  const s = Math.floor((ms ?? 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function TrackList({
  tracks = [],
  selectedIndex = 0,
  playingTrackId,
  maxHeight = 15,
}: TrackListProps) {
  if (tracks.length === 0) {
    return <Text color="gray"> No tracks to display.</Text>;
  }

  const half = Math.floor(maxHeight / 2);
  const start = Math.max(
    0,
    Math.min(selectedIndex - half, tracks.length - maxHeight),
  );
  const end = Math.min(tracks.length, start + maxHeight);

  return (
    <Box flexDirection="column">
      <Box paddingX={1}>
        <Text color="gray" bold>
          {"  #  "}
          {"Title".padEnd(34)}
          {"Artist".padEnd(24)}
          {"Time"}
        </Text>
      </Box>

      {tracks.slice(start, end).map((track, i) => {
        const idx = start + i;
        const isSelected = idx === selectedIndex;
        const isPlaying = track.id === playingTrackId;
        const name = (track.name ?? "Unknown").slice(0, 33).padEnd(34);
        const artist = (track.artists[0]?.name ?? "").slice(0, 23).padEnd(24);
        const dur = formatMs(track.duration_ms);
        const num = String(idx + 1).padStart(3);

        return (
          <Box key={track.id ?? idx} paddingX={1}>
            <Text
              color={isSelected ? "black" : isPlaying ? "green" : "white"}
              backgroundColor={isSelected ? "green" : undefined}
              bold={isPlaying && !isSelected}
            >
              {isPlaying ? " ♪ " : ` ${num} `}
              {name}
              {artist}
              {dur}
            </Text>
          </Box>
        );
      })}

      {tracks.length > maxHeight && (
        <Text color="gray" dimColor>
          {"  "}Showing {start + 1}–{end} of {tracks.length}
        </Text>
      )}
    </Box>
  );
}
