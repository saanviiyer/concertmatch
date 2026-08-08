/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MUSIC_ADAPTER?: string;
  readonly VITE_EVENTS_ADAPTER?: string;
  readonly VITE_SPOTIFY_CLIENT_ID?: string;
  readonly VITE_SPOTIFY_REDIRECT_URI?: string;
  readonly VITE_YTMUSIC_CLIENT_ID?: string;
  readonly VITE_YTMUSIC_REDIRECT_URI?: string;
  readonly VITE_TICKETMASTER_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
