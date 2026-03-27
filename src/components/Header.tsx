import { Box, Text } from "ink";
import React from "react";

type TabId = "library" | "search";

interface Tab {
  id: TabId;
  label: string;
}

interface HeaderProps {
  activeTab: TabId;
}

const TABS: Tab[] = [
  { id: "library", label: "♫ Library" },
  { id: "search", label: "⌕ Search" },
];

export default function Header({ activeTab }: HeaderProps) {
  return (
    <Box borderStyle="round" borderColor="green" paddingX={1}>
      <Text color="green" bold>
        SPOTIFY TUI{" "}
      </Text>
      {TABS.map(({ id, label }) =>
        activeTab === id ? (
          <Box key={id} marginRight={1}>
            <Text backgroundColor="green" color="black" bold>
              {" "}
              {label}{" "}
            </Text>
          </Box>
        ) : (
          <Box key={id} marginRight={1}>
            <Text color="gray"> {label} </Text>
          </Box>
        ),
      )}
      <Text color="gray" dimColor>
        {" "}
        Tab: switch tabs
      </Text>
    </Box>
  );
}
