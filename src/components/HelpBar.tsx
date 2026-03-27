import { Box, Text } from "ink";
import React from "react";

type Shortcut = [string, string];

const SHORTCUTS: Shortcut[] = [
  ["Space", "Play/Pause"],
  ["←/→", "Prev/Next"],
  ["+/-", "Volume"],
  ["↑/↓", "Navigate"],
  ["Enter", "Select"],
  ["q", "Quit"],
];

export default function HelpBar() {
  return (
    <Box paddingX={1}>
      {SHORTCUTS.map(([key, desc]) => (
        <Box key={key} marginRight={2}>
          <Text backgroundColor="gray" color="black">
            {" "}
            {key}{" "}
          </Text>
          <Text color="gray" dimColor>
            {" "}
            {desc}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
