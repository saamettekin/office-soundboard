import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface QueueSong {
  id: string;
  spotify_song_id: string;
  title: string;
  artist: string;
  album_cover_url: string | null;
  duration_ms: number;
  added_by_user_id: string;
  added_by_name: string;
  added_at: string;
  position: number;
  is_playing: boolean;
}

export const useMusicQueue = () => {
  const [queue, setQueue] = useState<QueueSong[]>([]);
  const [currentSong, setCurrentSong] = useState<QueueSong | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isPlayingNextRef = useRef(false);

  const fetchQueue = async () => {
    const { data, error } = await supabase
      .from("queue_songs")
      .select("id, spotify_song_id, title, artist, album_cover_url, duration_ms, added_by_user_id, added_by_name, added_at, position, is_playing")
      .order("position", { ascending: true });

    if (error) {
      console.error("Error fetching queue:", error);
      return;
    }

    setQueue(data || []);
    const playing = data?.find(song => song.is_playing);
    setCurrentSong(playing || null);
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();

    const channel = supabase
      .channel("queue-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_songs",
        },
        (payload) => {
          console.log("Queue change:", payload);
          fetchQueue();
          
          if (payload.eventType === "INSERT") {
            toast({
              title: "Yeni şarkı eklendi! 🎵",
              description: `${payload.new.added_by_name} sıraya şarkı ekledi`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addToQueue = async (song: {
    spotify_song_id: string;
    title: string;
    artist: string;
    album_cover_url: string | null;
    duration_ms: number;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", user.id)
      .single();

    const maxPosition = queue.length > 0 
      ? Math.max(...queue.map(s => s.position))
      : 0;

    const { error } = await supabase.from("queue_songs").insert({
      spotify_song_id: song.spotify_song_id,
      title: song.title,
      artist: song.artist,
      album_cover_url: song.album_cover_url,
      duration_ms: song.duration_ms,
      added_by_user_id: user.id,
      added_by_name: profile?.email?.split("@")[0] || "Unknown",
      position: maxPosition + 1,
      is_playing: queue.length === 0,
    });

    if (error) {
      toast({
        title: "Hata",
        description: "Şarkı eklenirken bir hata oluştu",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Şarkı eklendi! 🎵",
      description: `${song.title} sıraya eklendi`,
    });
  };

  const removeFromQueue = async (songId: string) => {
    const { error } = await supabase
      .from("queue_songs")
      .delete()
      .eq("id", songId);

    if (error) {
      toast({
        title: "Hata",
        description: "Şarkı silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const reorderQueue = async (draggedId: string, targetId: string) => {
    const draggedSong = queue.find(s => s.id === draggedId);
    const targetSong = queue.find(s => s.id === targetId);
    
    if (!draggedSong || !targetSong) return;

    const draggedPosition = draggedSong.position;
    const targetPosition = targetSong.position;

    await Promise.all([
      supabase.from("queue_songs").update({ position: targetPosition }).eq("id", draggedId),
      supabase.from("queue_songs").update({ position: draggedPosition }).eq("id", targetId)
    ]);
  };

  const playNextSong = useCallback(async () => {
    // Prevent concurrent calls
    if (isPlayingNextRef.current) {
      console.log('playNextSong already in progress, skipping');
      return;
    }
    
    isPlayingNextRef.current = true;
    
    try {
      // Fetch fresh data from database
      const { data: freshQueue, error } = await supabase
        .from("queue_songs")
        .select("*")
        .order("position", { ascending: true });
      
      if (error) {
        console.error("Error fetching queue:", error);
        return;
      }
      
      const playingSong = freshQueue?.find(s => s.is_playing);
      
      if (!playingSong) {
        console.log('No playing song found');
        return;
      }
      
      console.log('playNextSong: Current song:', playingSong.title);
      
      // Add to history
      await supabase.from("song_history").insert({
        spotify_song_id: playingSong.spotify_song_id,
        title: playingSong.title,
        artist: playingSong.artist,
        album_cover_url: playingSong.album_cover_url,
        added_by_user_id: playingSong.added_by_user_id,
        added_by_name: playingSong.added_by_name,
      });

      // Delete current song
      await supabase.from("queue_songs").delete().eq("id", playingSong.id);

      // Find and mark next song
      const nextSong = freshQueue?.find(s => s.position > playingSong.position);
      if (nextSong) {
        console.log('playNextSong: Next song:', nextSong.title);
        await supabase
          .from("queue_songs")
          .update({ is_playing: true })
          .eq("id", nextSong.id);
      } else {
        console.log('playNextSong: No more songs in queue');
      }
    } finally {
      isPlayingNextRef.current = false;
    }
  }, []);

  const startFirstSong = async () => {
    if (currentSong || queue.length === 0) return;
    
    const firstSong = queue.reduce((min, song) => 
      song.position < min.position ? song : min, queue[0]
    );
    
    await supabase
      .from("queue_songs")
      .update({ is_playing: true })
      .eq("id", firstSong.id);
  };

  return {
    queue,
    currentSong,
    loading,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    playNextSong,
    startFirstSong,
  };
};
