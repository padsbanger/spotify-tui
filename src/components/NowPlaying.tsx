import { Box, Text } from "ink";
import React from "react";
import type { SpotifyPlaybackState } from "../types";
import ProgressBar from "./ProgressBar";

interface NowPlayingProps {
  playback: SpotifyPlaybackState | null;
  terminalWidth?: number;
}

export default function NowPlaying({
  playback,
  terminalWidth = 80,
}: NowPlayingProps) {
  if (!playback) {
    return (
      <Box borderStyle="round" borderColor="gray" paddingX={1}>
        <Text color="gray">
          ♪ No active playback — open Spotify on a device first
        </Text>
      </Box>
    );
  }

  const { item, is_playing, progress_ms, device } = playback;
  const artists = item?.artists.map((a) => a.name).join(", ");
  const volume = device?.volume_percent ?? 0;
  const volBars = Math.round(volume / 10);
  const barWidth = Math.max(20, terminalWidth - 22);

  console.log(item?.album.images[0].url);

  return (
    <Box
      borderStyle="round"
      borderColor="green"
      flexDirection="column"
      paddingX={1}
    >
      <Box>
        <Text color="green" bold>
          ♪{" "}
        </Text>
        <Text bold>{item.name}</Text>
        <Text color="gray"> — {artists}</Text>
        <Text> </Text>
        <Text color={is_playing ? "green" : "yellow"} bold>
          {is_playing ? "▶ PLAYING" : "⏸ PAUSED"}
        </Text>
      </Box>
      <ProgressBar
        current={progress_ms}
        total={item.duration_ms}
        width={barWidth}
      />
      <Box>
        <Text color="gray">Vol: </Text>
        <Text color="green">{"█".repeat(volBars)}</Text>
        <Text color="gray">{"░".repeat(10 - volBars)}</Text>
        <Text color="gray"> {volume}%</Text>
        {device && <Text color="cyan"> {device.name}</Text>}
      </Box>
    </Box>
  );
}
