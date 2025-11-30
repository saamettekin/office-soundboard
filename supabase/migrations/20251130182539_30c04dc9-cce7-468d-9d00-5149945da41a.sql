-- Add youtube_video_id column to queue_songs table
ALTER TABLE public.queue_songs 
ADD COLUMN youtube_video_id TEXT;

-- Add index for better performance
CREATE INDEX idx_queue_songs_youtube_video_id ON public.queue_songs(youtube_video_id);