import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SongReaction {
  id: string;
  song_id: string;
  user_id: string;
  user_name: string;
  emoji: string;
  created_at: string;
}

const AVAILABLE_EMOJIS = ["🔥", "❤️", "😎", "🎵", "👏"];

export const useSongReactions = (songId: string) => {
  const [reactions, setReactions] = useState<SongReaction[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);

  const fetchReactions = async () => {
    const { data } = await supabase
      .from("song_reactions")
      .select("*")
      .eq("song_id", songId);

    if (data) {
      setReactions(data);
      
      const { data: { user } } = await supabase.auth.getUser();
      const myReaction = data.find(r => r.user_id === user?.id);
      setUserReaction(myReaction?.emoji || null);
    }
  };

  useEffect(() => {
    fetchReactions();

    const channel = supabase
      .channel(`reactions-${songId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "song_reactions",
          filter: `song_id=eq.${songId}`,
        },
        () => fetchReactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [songId]);

  const addReaction = async (emoji: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", user?.id)
      .single();

    if (!user) return;

    // Önceki tepkiyi sil
    if (userReaction) {
      await supabase
        .from("song_reactions")
        .delete()
        .eq("song_id", songId)
        .eq("user_id", user.id);
    }

    // Yeni tepki ekle (aynı emoji ise silmekle kalır)
    if (emoji !== userReaction) {
      await supabase.from("song_reactions").insert({
        song_id: songId,
        user_id: user.id,
        user_name: profile?.email?.split("@")[0] || "Unknown",
        emoji,
      });
    }
  };

  const getReactionCounts = () => {
    const counts: Record<string, number> = {};
    reactions.forEach((r) => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    });
    return counts;
  };

  return {
    reactions,
    userReaction,
    availableEmojis: AVAILABLE_EMOJIS,
    addReaction,
    getReactionCounts,
  };
};
