import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    // Get authorization header (case-insensitive)
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(JSON.stringify({ error: 'Unauthorized - No auth header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized - Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!user) {
      console.error('No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized - No user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Authenticated user:', user.id);

    const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
    const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');
    const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/spotify-auth/callback`;

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      throw new Error('Spotify credentials not configured');
    }

    // GET /authorize - Start OAuth flow
    if (path === 'authorize' && req.method === 'GET') {
      const scopes = [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-read-playback-state',
        'user-modify-playback-state'
      ].join(' ');

      const authUrl = `https://accounts.spotify.com/authorize?` +
        `client_id=${SPOTIFY_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=${user.id}`;

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /callback - OAuth callback
    if (path === 'callback' && req.method === 'GET') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!code || state !== user.id) {
        throw new Error('Invalid callback parameters');
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for tokens');
      }

      const tokens = await tokenResponse.json();

      // Store tokens in user profile
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          spotify_access_token: tokens.access_token,
          spotify_refresh_token: tokens.refresh_token,
          spotify_token_expires_at: expiresAt.toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error storing tokens:', updateError);
        throw updateError;
      }

      // Redirect back to app
      const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || '';
      return Response.redirect(`${appUrl}/soundboard-work?spotify=connected`, 302);
    }

    // POST /refresh - Refresh access token
    if (path === 'refresh' && req.method === 'POST') {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('spotify_refresh_token')
        .eq('user_id', user.id)
        .single();

      if (!profile?.spotify_refresh_token) {
        throw new Error('No refresh token found');
      }

      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: profile.spotify_refresh_token
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokens = await tokenResponse.json();
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          spotify_access_token: tokens.access_token,
          spotify_token_expires_at: expiresAt.toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ access_token: tokens.access_token }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /token - Get current token (refresh if needed)
    if (path === 'token' && req.method === 'GET') {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('spotify_access_token, spotify_refresh_token, spotify_token_expires_at')
        .eq('user_id', user.id)
        .single();

      if (!profile?.spotify_access_token) {
        return new Response(JSON.stringify({ error: 'Not connected to Spotify' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if token is expired or will expire in next 5 minutes
      const expiresAt = new Date(profile.spotify_token_expires_at);
      const now = new Date();
      const fiveMinutes = 5 * 60 * 1000;

      if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
        // Token expired or expiring soon, refresh it
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: profile.spotify_refresh_token
          })
        });

        if (tokenResponse.ok) {
          const tokens = await tokenResponse.json();
          const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

          await supabaseClient
            .from('profiles')
            .update({
              spotify_access_token: tokens.access_token,
              spotify_token_expires_at: newExpiresAt.toISOString()
            })
            .eq('user_id', user.id);

          return new Response(JSON.stringify({ 
            access_token: tokens.access_token,
            is_connected: true 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify({ 
        access_token: profile.spotify_access_token,
        is_connected: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Spotify auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});