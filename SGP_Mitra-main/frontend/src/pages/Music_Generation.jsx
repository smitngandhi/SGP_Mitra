import React, { useState, useEffect } from "react";
import "../MusicAnimations.css"; // We'll create this file for custom animations

const Music_Generation = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [musicPrompt, setMusicPrompt] = useState("");
  const [generatedMusic, setGeneratedMusic] = useState(null);
  const [musicLoading, setMusicLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Add animation effect when component mounts
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Function to fetch recommended tracks from the backend
  const fetchRecommendedTracks = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/api/v1/detect_emotion");
      const data = await response.json();
      console.log("Data Response:", data);
      setTracks(data.recommendations);
    } catch (error) {
      console.error("Error fetching recommended tracks:", error);
    }
    setLoading(false);
  };

  // Function to generate Spotify embed URL
  const getSpotifyEmbedUrl = (spotifyId) => {
    return `https://open.spotify.com/embed/track/${spotifyId}`;
  };

  // Function to generate music from text prompt
  const generateMusic = async () => {
    setMusicLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/api/v1/generate_music", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: musicPrompt }),
      });
      const data = await response.json();
      setGeneratedMusic(data.audio_url);
    } catch (error) {
      console.error("Error generating music:", error);
    }
    setMusicLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 text-white p-6 overflow-hidden relative">
      {/* Background music notes animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i} 
            className={`floating-note note-${i % 4 + 1}`} 
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 20}s`
            }}
          />
        ))}
      </div>
      
      <div className={`transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className="text-4xl font-bold mb-8 text-center animate-pulse">
          🎵 Melodic AI <span className="text-yellow-300">Music Generator</span> 🎵
        </h1>
        
        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
          {/* Left Section - Emotion Based */}
          <div className="w-full lg:w-1/2 bg-black/30 backdrop-blur-md rounded-2xl p-6 shadow-2xl transform transition-all duration-500 hover:scale-102 hover:shadow-glow">
            <h2 className="text-2xl font-bold mb-6 text-center text-gradient-gold">
              Emotion-Based Recommendations
            </h2>
            
            <div className="flex justify-center mb-6">
              <button
                onClick={fetchRecommendedTracks}
                disabled={loading}
                className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-6 py-3 rounded-full text-lg font-semibold hover:from-yellow-300 hover:to-amber-400 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 shadow-xl relative overflow-hidden btn-pulse"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block mr-2">⏳</span> 
                    Detecting Emotion...
                  </>
                ) : (
                  <>
                    <span className="inline-block animate-bounce mr-2">🔍</span> 
                    Detect Emotion & Get Songs
                  </>
                )}
              </button>
            </div>
            
            {/* Tracks container with scroll */}
            <div className="mt-4 overflow-y-auto max-h-96 pr-2 tracklist-scroll">
              {tracks.length > 0 ? (
                tracks.slice(0, 10).map((track, index) => (
                  <div 
                    key={index} 
                    className="bg-white/10 backdrop-blur-md text-white p-4 rounded-lg shadow-lg mb-4 track-card"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <h3 className="text-xl font-semibold">🎵 {track.track}</h3>
                    <p><strong>Artist:</strong> {track.artist}</p>
                    <p><strong>Genre:</strong> {track.genre}</p>
                    
                    {/* Spotify Embed Player */}
                    <div className="mt-3">
                      <iframe
                        src={getSpotifyEmbedUrl(track.spotify_id)}
                        width="100%"
                        height="80"
                        frameBorder="0"
                        allow="encrypted-media"
                        className="rounded-lg"
                        title={track.track}
                      ></iframe>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-300 py-10">
                  <div className="text-5xl mb-4 animate-bounce">🎧</div>
                  <p>Click the button above to detect your emotion and get personalized music recommendations</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Section - Text to Music */}
          <div className="w-full lg:w-1/2 bg-black/30 backdrop-blur-md rounded-2xl p-6 shadow-2xl transform transition-all duration-500 hover:scale-102 hover:shadow-glow">
            <h2 className="text-2xl font-bold mb-6 text-center text-gradient-blue">
              Text-to-Music Generation
            </h2>
            
            <div className="relative mb-6">
              <textarea
                className="w-full p-4 bg-white/10 border border-purple-300/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 backdrop-blur-sm placeholder-purple-200/70"
                rows="4"
                placeholder="Describe your perfect song (e.g., 'A relaxing piano melody with gentle rain sounds')"
                value={musicPrompt}
                onChange={(e) => setMusicPrompt(e.target.value)}
              ></textarea>
              
              <div className="absolute bottom-3 right-3 text-gray-400 text-sm">
                {musicPrompt.length} characters
              </div>
            </div>
            
            <div className="flex justify-center mb-8">
              <button
                onClick={generateMusic}
                disabled={musicLoading || !musicPrompt.trim()}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-full text-lg font-semibold hover:from-purple-400 hover:to-blue-400 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 shadow-xl relative overflow-hidden btn-ripple"
              >
                {musicLoading ? (
                  <>
                    <span className="inline-block mr-2 animate-ping">🎼</span> 
                    Creating Your Music...
                  </>
                ) : (
                  <>
                    <span className="inline-block mr-2 animate-wiggle">🎹</span> 
                    Generate Music
                  </>
                )}
              </button>
            </div>
            
            {/* Generated Music Player */}
            {generatedMusic ? (
              <div className="mt-6 music-player-container animate-fadeIn">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <span className="animate-pulse mr-2">🎵</span> 
                  Your Generated Masterpiece:
                </h3>
                <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-4 rounded-xl backdrop-blur-md">
                  <div className="audio-visualizer mb-3"></div>
                  <audio 
                    controls 
                    className="w-full custom-audio-player"
                    onPlay={() => document.querySelector('.audio-visualizer').classList.add('active')}
                    onPause={() => document.querySelector('.audio-visualizer').classList.remove('active')}
                  >
                    <source src={generatedMusic} type="audio/mp3" />
                    Your browser does not support the audio element.
                  </audio>
                  <div className="flex justify-between text-sm mt-2 text-purple-200">
                    <span>AI Generated</span>
                    <span>Based on your prompt</span>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <button className="text-purple-300 hover:text-white text-sm underline transition">
                    Download MP3
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-gray-300">
                <div className="text-5xl mb-4 animate-float">🎹</div>
                <p>Enter a description above and generate your custom music</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Music_Generation;