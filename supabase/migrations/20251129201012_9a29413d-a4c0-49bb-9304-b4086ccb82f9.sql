-- Ortak müzik sırası tablosu
CREATE TABLE public.queue_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spotify_song_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album_cover_url TEXT,
  duration_ms INTEGER NOT NULL,
  added_by_user_id UUID NOT NULL,
  added_by_name TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  position INTEGER NOT NULL,
  is_playing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Emoji tepkileri tablosu
CREATE TABLE public.song_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID NOT NULL REFERENCES public.queue_songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Şarkı geçmişi tablosu
CREATE TABLE public.song_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spotify_song_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album_cover_url TEXT,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  added_by_user_id UUID NOT NULL,
  added_by_name TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.queue_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for queue_songs (herkes görür, herkes ekler)
CREATE POLICY "Anyone can view queue songs" 
ON public.queue_songs 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can add songs" 
ON public.queue_songs 
FOR INSERT 
WITH CHECK (auth.uid() = added_by_user_id);

CREATE POLICY "Users can delete their own songs" 
ON public.queue_songs 
FOR DELETE 
USING (auth.uid() = added_by_user_id);

CREATE POLICY "System can update playing status" 
ON public.queue_songs 
FOR UPDATE 
USING (true);

-- RLS Policies for song_reactions
CREATE POLICY "Anyone can view reactions" 
ON public.song_reactions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can add reactions" 
ON public.song_reactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" 
ON public.song_reactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for song_history
CREATE POLICY "Anyone can view history" 
ON public.song_history 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert history" 
ON public.song_history 
FOR INSERT 
WITH CHECK (true);

-- Realtime için ayarlar
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_songs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.song_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.song_history;

-- Index'ler
CREATE INDEX idx_queue_songs_position ON public.queue_songs(position);
CREATE INDEX idx_queue_songs_is_playing ON public.queue_songs(is_playing);
CREATE INDEX idx_song_reactions_song_id ON public.song_reactions(song_id);
CREATE INDEX idx_song_history_played_at ON public.song_history(played_at DESC);