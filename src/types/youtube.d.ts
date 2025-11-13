declare namespace YT {
  export interface Player {
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getPlayerState(): number;
    destroy(): void;
  }

  export interface PlayerOptions {
    height?: string;
    width?: string;
    videoId?: string;
    playerVars?: {
      autoplay?: 0 | 1;
      controls?: 0 | 1;
      [key: string]: any;
    };
    events?: {
      onReady?: (event: any) => void;
      onStateChange?: (event: any) => void;
      [key: string]: any;
    };
  }

  export enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }
}

interface Window {
  YT: {
    Player: new (elementId: string, options: YT.PlayerOptions) => YT.Player;
    PlayerState: typeof YT.PlayerState;
  };
  onYouTubeIframeAPIReady?: () => void;
}
