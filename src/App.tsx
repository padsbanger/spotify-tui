import { Box, useApp, useInput, useStdout } from "ink";
import React, { useState } from "react";
import type SpotifyAPI from "./api/spotify";
import Header from "./components/Header";
import HelpBar from "./components/HelpBar";
import Library from "./components/Library";
import NowPlaying from "./components/NowPlaying";
import Search from "./components/Search";
import { usePlayback } from "./hooks/usePlayback";

type Tab = "library" | "search";
const TABS: Tab[] = ["library", "search"];

interface AppProps {
  api: SpotifyAPI;
}

export default function App({ api }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns ?? 80;

  const [activeTab, setActiveTab] = useState<Tab>("library");
  const [isTyping, setIsTyping] = useState(false);
  const { playback, refresh } = usePlayback(api, 3000);

  useInput((input, key) => {
    // Suppress global shortcuts while user is typing in search box
    if (isTyping && !key.ctrl && !key.meta) return;

    // Quit
    if ((key.ctrl && input === "c") || (!isTyping && input === "q")) {
      exit();
      return;
    }

    // Switch tab
    if (key.tab) {
      setActiveTab((cur) => {
        const idx = TABS.indexOf(cur);
        return TABS[(idx + 1) % TABS.length]!;
      });
      return;
    }

    // Play / Pause
    if (input === " ") {
      void (async () => {
        try {
          playback?.is_playing ? await api.pause() : await api.play();
          setTimeout(() => void refresh(), 500);
        } catch {
          /* ignore */
        }
      })();
      return;
    }

    // Next / Previous
    if (key.rightArrow) {
      void api
        .next()
        .then(() => setTimeout(() => void refresh(), 600))
        .catch(() => {});
      return;
    }
    if (key.leftArrow) {
      void api
        .previous()
        .then(() => setTimeout(() => void refresh(), 600))
        .catch(() => {});
      return;
    }

    // Volume
    if (input === "+" || input === "=") {
      const vol = Math.min(100, (playback?.device?.volume_percent ?? 50) + 10);
      void api
        .setVolume(vol)
        .then(() => setTimeout(() => void refresh(), 300))
        .catch(() => {});
      return;
    }
    if (input === "-") {
      const vol = Math.max(0, (playback?.device?.volume_percent ?? 50) - 10);
      void api
        .setVolume(vol)
        .then(() => setTimeout(() => void refresh(), 300))
        .catch(() => {});
      return;
    }
  });

  return (
    <Box flexDirection="column">
      <Header activeTab={activeTab} />

      <Box flexDirection="column" minHeight={20} paddingX={1} paddingTop={1}>
        {activeTab === "library" && (
          <Library api={api} playback={playback} onRefresh={refresh} />
        )}
        {activeTab === "search" && (
          <Search
            api={api}
            playback={playback}
            onRefresh={refresh}
            onTypingChange={setIsTyping}
          />
        )}
      </Box>

      <NowPlaying playback={playback} terminalWidth={terminalWidth} />
      <HelpBar />
    </Box>
  );
}
