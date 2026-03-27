// ── Auth ──────────────────────────────────────────────────────────────────────

export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// ── Entities ──────────────────────────────────────────────────────────────────

export interface SpotifyArtist {
  id: string;
  name: string;
  uri?: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  uri?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
}

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  is_restricted: boolean;
  volume_percent: number;
}

export interface SpotifyContext {
  uri: string;
  type: string;
}

export interface SpotifyPlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack | null;
  device: SpotifyDevice | null;
  context: SpotifyContext | null;
}

export interface SpotifyPlaylistTracks {
  total: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  uri: string;
  tracks: SpotifyPlaylistTracks;
}

// ── Paging ────────────────────────────────────────────────────────────────────

export interface SpotifyPagingObject<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

// ── Compound responses ────────────────────────────────────────────────────────

export interface SpotifyPlaylistTrackObject {
  track: SpotifyTrack | null;
  added_at: string;
}

export interface SpotifySearchResult {
  tracks?: SpotifyPagingObject<SpotifyTrack>;
}

export interface SpotifyDevicesResult {
  devices: SpotifyDevice[];
}

export interface SpotifyRecentlyPlayedItem {
  track: SpotifyTrack;
  played_at: string;
}

export interface SpotifyRecentlyPlayed {
  items: SpotifyRecentlyPlayedItem[];
}

// ── Playback options ──────────────────────────────────────────────────────────

export type PlayOptions = {
  context_uri?: string;
  uris?: string[];
  offset?: { uri: string } | { position: number };
  position_ms?: number;
};
