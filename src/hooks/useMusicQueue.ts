import { useEffect, useState } from "react";
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
  youtube_video_id: string | null;
}

export const useMusicQueue = () => {
  const [queue, setQueue] = useState<QueueSong[]>([]);
  const [currentSong, setCurrentSong] = useState<QueueSong | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchQueue = async () => {
    const { data, error } = await supabase
      .from("queue_songs")
      .select("*")
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

    // Realtime subscription
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
    // First, get user info synchronously from cache if possible
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

    // Insert immediately without waiting for YouTube
    const { data: insertedSong, error } = await supabase.from("queue_songs").insert({
      spotify_song_id: song.spotify_song_id,
      title: song.title,
      artist: song.artist,
      album_cover_url: song.album_cover_url,
      duration_ms: song.duration_ms,
      youtube_video_id: null, // Will be updated in background
      added_by_user_id: user.id,
      added_by_name: profile?.email?.split("@")[0] || "Unknown",
      position: maxPosition + 1,
      is_playing: queue.length === 0,
    }).select().single();

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

    // Fetch YouTube video ID in background (non-blocking)
    if (insertedSong) {
      supabase.functions.invoke('spotify/youtube', {
        body: { artist: song.artist, title: song.title }
      }).then(({ data: youtubeData, error: youtubeError }) => {
        if (!youtubeError && youtubeData?.youtube_video_id) {
          supabase.from("queue_songs")
            .update({ youtube_video_id: youtubeData.youtube_video_id })
            .eq("id", insertedSong.id)
            .then(() => console.log('YouTube ID updated for', song.title));
        }
      }).catch(err => console.error('Background YouTube fetch error:', err));
    }
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

    // Swap positions
    const draggedPosition = draggedSong.position;
    const targetPosition = targetSong.position;

    const { error: error1 } = await supabase
      .from("queue_songs")
      .update({ position: targetPosition })
      .eq("id", draggedId);

    const { error: error2 } = await supabase
      .from("queue_songs")
      .update({ position: draggedPosition })
      .eq("id", targetId);

    if (error1 || error2) {
      toast({
        title: "Hata",
        description: "Sıra değiştirilirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const playNextSong = async () => {
    if (!currentSong) return;

    // Çalan şarkıyı geçmişe ekle
    await supabase.from("song_history").insert({
      spotify_song_id: currentSong.spotify_song_id,
      title: currentSong.title,
      artist: currentSong.artist,
      album_cover_url: currentSong.album_cover_url,
      added_by_user_id: currentSong.added_by_user_id,
      added_by_name: currentSong.added_by_name,
    });

    // Çalan şarkıyı sil
    await supabase.from("queue_songs").delete().eq("id", currentSong.id);

    // Sonraki şarkıyı çalacak olarak işaretle
    const nextSong = queue.find(s => s.position > currentSong.position);
    if (nextSong) {
      await supabase
        .from("queue_songs")
        .update({ is_playing: true })
        .eq("id", nextSong.id);
    }
  };

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
