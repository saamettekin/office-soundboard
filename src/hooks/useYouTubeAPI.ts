import { useEffect, useState } from "react";

export const useYouTubeAPI = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if API is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      setIsReady(true);
      return;
    }

    // Load YouTube IFrame API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Set up callback
    (window as any).onYouTubeIframeAPIReady = () => {
      setIsReady(true);
    };

    return () => {
      // Cleanup
      delete (window as any).onYouTubeIframeAPIReady;
    };
  }, []);

  return isReady;
};
