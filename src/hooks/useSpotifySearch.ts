import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string;
  album_cover: string;
  duration_ms: number;
}

export const useSpotifySearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get Spotify access token on mount
  useEffect(() => {
    getAccessToken();
  }, []);

  const getAccessToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify/token');
      
      if (error) throw error;
      
      setAccessToken(data.access_token);
    } catch (err) {
      console.error('Error getting Spotify token:', err);
      setError('Spotify bağlantısı kurulamadı');
    }
  };

  const search = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (!accessToken) {
      setError('Spotify token bekleniyor...');
      return;
    }

    setSearching(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('spotify/search', {
        body: { query, token: accessToken },
      });

      if (error) throw error;

      setResults(data.tracks || []);
    } catch (err) {
      console.error('Error searching Spotify:', err);
      setError('Arama yapılırken bir hata oluştu');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return {
    searchQuery,
    results,
    searching,
    search,
    error,
  };
};
