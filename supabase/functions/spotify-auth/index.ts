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

    const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
    const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/spotify-auth/callback`;

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      throw new Error('Spotify credentials not configured');
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseClient = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // GET /callback - OAuth callback (no auth required - comes from Spotify redirect)
    if (path === 'callback' && req.method === 'GET') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state'); // This is the user_id
      const error = url.searchParams.get('error');

      // HTML template for popup response
      const createPopupResponse = (success: boolean, message: string) => {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Spotify Bağlantısı</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #1DB954 0%, #191414 100%);
                  color: white;
                }
                .container {
                  text-align: center;
                  padding: 40px;
                  background: rgba(0,0,0,0.5);
                  border-radius: 16px;
                  backdrop-filter: blur(10px);
                }
                .icon { font-size: 64px; margin-bottom: 16px; }
                h1 { margin: 0 0 8px 0; font-size: 24px; }
                p { margin: 0; opacity: 0.8; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="icon">${success ? '✓' : '✗'}</div>
                <h1>${success ? 'Bağlantı Başarılı!' : 'Bağlantı Hatası'}</h1>
                <p>${message}</p>
                <p style="margin-top: 16px; font-size: 14px;">Bu pencere otomatik kapanacak...</p>
              </div>
              <script>
                window.opener?.postMessage({ type: 'SPOTIFY_AUTH_CALLBACK', success: ${success} }, '*');
                setTimeout(() => window.close(), 2000);
              </script>
            </body>
          </html>
        `;
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' },
        });
      };

      if (error) {
        console.error('Spotify OAuth error:', error);
        return createPopupResponse(false, 'Spotify yetkilendirme reddedildi.');
      }

      if (!code || !state) {
        console.error('Missing code or state in callback');
        return createPopupResponse(false, 'Eksik parametreler.');
      }

      console.log('Processing callback for user:', state);

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
        const errorText = await tokenResponse.text();
        console.error('Failed to exchange code for tokens:', errorText);
        return createPopupResponse(false, 'Token alınamadı.');
      }

      const tokens = await tokenResponse.json();
      console.log('Got tokens from Spotify');

      // Store tokens in user profile using state (user_id)
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          spotify_access_token: tokens.access_token,
          spotify_refresh_token: tokens.refresh_token,
          spotify_token_expires_at: expiresAt.toISOString()
        })
        .eq('user_id', state);

      if (updateError) {
        console.error('Error storing tokens:', updateError);
        return createPopupResponse(false, 'Token kaydedilemedi.');
      }

      console.log('Tokens stored successfully for user:', state);
      
      // Return success HTML that closes popup and notifies parent
      return createPopupResponse(true, 'Spotify hesabınız bağlandı!');
    }

    // All other endpoints require authentication
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(JSON.stringify({ error: 'Unauthorized - No auth header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // GET or POST /authorize - Start OAuth flow
    if (path === 'authorize' && (req.method === 'GET' || req.method === 'POST')) {
      const scopes = [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing'
      ].join(' ');

      const authUrl = `https://accounts.spotify.com/authorize?` +
        `client_id=${SPOTIFY_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=${user.id}`;

      console.log('Generated auth URL for user:', user.id);

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    // GET or POST /token - Get current token (refresh if needed)
    if (path === 'token' && (req.method === 'GET' || req.method === 'POST')) {
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