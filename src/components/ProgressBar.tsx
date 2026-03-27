import { Box, Text } from "ink";
import React from "react";

interface ProgressBarProps {
  current?: number;
  total?: number;
  width?: number;
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function ProgressBar({
  current = 0,
  total = 0,
  width = 30,
}: ProgressBarProps) {
  const filled = total > 0 ? Math.round((current / total) * width) : 0;
  const empty = width - filled;
  return (
    <Box>
      <Text color="gray">{formatMs(current)} </Text>
      <Text color="green">{"█".repeat(Math.max(0, filled))}</Text>
      <Text color="gray">{"░".repeat(Math.max(0, empty))}</Text>
      <Text color="gray"> {formatMs(total)}</Text>
    </Box>
  );
}
