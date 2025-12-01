import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Get Spotify access token
    if (path === 'token') {
      const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
      const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
        },
        body: 'grant_type=client_credentials',
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('Spotify token error:', tokenData);
        throw new Error('Failed to get Spotify token');
      }

      return new Response(
        JSON.stringify({ access_token: tokenData.access_token }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for tracks
    if (path === 'search') {
      const { query, token } = await req.json();

      if (!query || !token) {
        return new Response(
          JSON.stringify({ error: 'Query and token are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const searchData = await searchResponse.json();

      if (!searchResponse.ok) {
        console.error('Spotify search error:', searchData);
        throw new Error('Failed to search Spotify');
      }

      const tracks = searchData.tracks.items.map((track: any) => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map((a: any) => a.name).join(', '),
        album_cover: track.album.images[0]?.url || '',
        duration_ms: track.duration_ms,
      }));

      return new Response(
        JSON.stringify({ tracks }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search YouTube for a song
    if (path === 'youtube') {
      const { artist, title } = await req.json();
      
      if (!artist || !title) {
        return new Response(
          JSON.stringify({ error: 'Artist and title are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const searchQuery = `${artist} - ${title}`;
      
      try {
        // Use Invidious API (no API key needed)
        const invidiousResponse = await fetch(
          `https://invidious.jing.rocks/api/v1/search?q=${encodeURIComponent(searchQuery)}&type=video`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        
        if (!invidiousResponse.ok) {
          throw new Error('Invidious API failed');
        }
        
        const results = await invidiousResponse.json();
        
        if (results && results.length > 0) {
          return new Response(
            JSON.stringify({ youtube_video_id: results[0].videoId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        throw new Error('No YouTube video found');
      } catch (error) {
        console.error('YouTube search error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to find YouTube video' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in spotify function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
