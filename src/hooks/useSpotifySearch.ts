import { useState } from "react";

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string;
  album_cover: string;
  duration_ms: number;
}

// Mock Spotify verisi
const MOCK_TRACKS: SpotifyTrack[] = [
  {
    id: "1",
    name: "Blinding Lights",
    artists: "The Weeknd",
    album_cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    duration_ms: 200040,
  },
  {
    id: "2",
    name: "Shape of You",
    artists: "Ed Sheeran",
    album_cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    duration_ms: 233713,
  },
  {
    id: "3",
    name: "Starboy",
    artists: "The Weeknd, Daft Punk",
    album_cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
    duration_ms: 230453,
  },
  {
    id: "4",
    name: "Someone Like You",
    artists: "Adele",
    album_cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
    duration_ms: 285120,
  },
  {
    id: "5",
    name: "Levitating",
    artists: "Dua Lipa",
    album_cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop",
    duration_ms: 203064,
  },
  {
    id: "6",
    name: "Bad Guy",
    artists: "Billie Eilish",
    album_cover: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&h=300&fit=crop",
    duration_ms: 194088,
  },
  {
    id: "7",
    name: "Circles",
    artists: "Post Malone",
    album_cover: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300&h=300&fit=crop",
    duration_ms: 215280,
  },
  {
    id: "8",
    name: "Watermelon Sugar",
    artists: "Harry Styles",
    album_cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    duration_ms: 174000,
  },
];

export const useSpotifySearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);

  const search = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    
    // Mock arama - gerçek zamanlı filtreleme
    setTimeout(() => {
      const filtered = MOCK_TRACKS.filter(
        (track) =>
          track.name.toLowerCase().includes(query.toLowerCase()) ||
          track.artists.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setSearching(false);
    }, 300);
  };

  return {
    searchQuery,
    results,
    searching,
    search,
  };
};
