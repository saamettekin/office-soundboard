import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HistorySong {
  id: string;
  spotify_song_id: string;
  title: string;
  artist: string;
  album_cover_url: string | null;
  played_at: string;
  added_by_user_id: string;
  added_by_name: string;
}

export const useSongHistory = () => {
  const [history, setHistory] = useState<HistorySong[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("song_history")
      .select("*")
      .order("played_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setHistory(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();

    const channel = supabase
      .channel("history-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "song_history",
        },
        () => fetchHistory()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getMostAddedUser = () => {
    if (history.length === 0) return null;
    
    const userCounts: Record<string, number> = {};
    history.forEach((song) => {
      userCounts[song.added_by_name] = (userCounts[song.added_by_name] || 0) + 1;
    });

    const topUser = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0];
    return { name: topUser[0], count: topUser[1] };
  };

  const getMostPlayedSong = () => {
    if (history.length === 0) return null;

    const songCounts: Record<string, { song: HistorySong; count: number }> = {};
    
    history.forEach((song) => {
      if (!songCounts[song.spotify_song_id]) {
        songCounts[song.spotify_song_id] = { song, count: 0 };
      }
      songCounts[song.spotify_song_id].count++;
    });

    const topSong = Object.values(songCounts).sort((a, b) => b.count - a.count)[0];
    return topSong;
  };

  return {
    history,
    loading,
    getMostAddedUser,
    getMostPlayedSong,
  };
};
