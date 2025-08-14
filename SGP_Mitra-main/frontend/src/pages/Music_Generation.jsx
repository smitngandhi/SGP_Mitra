import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar"
import "../MusicAnimations.css"; // We'll create this file for custom animations
import vinyl from "../assets/vinyl.png"
// import vinylrecord from "../assets/vinyl-record.png"

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
    <>      
    <Navbar/>
    <div className="bg-[#faf8ff] text-white p-5 overflow-hidden relative">    
        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto" style={{height: '79vh'}}>
          {/* Left Section - Emotion Based */}
          <div className="group w-full lg:w-1/2 bg-[#d7c6e6] backdrop-blur-md rounded-2xl p-6 transform transition-all duration-500 hover:scale-102 hover:bg-[#7a3fa9]">
          <h2 className="text-2xl p-6 font-bold mb-6 text-center text-[#1e1e3f] transition-colors duration-500 group-hover:text-white">
            Emotion-Based Recommendations
            </h2>
            
            <div className="flex justify-center mb-6">
              <button
                onClick={fetchRecommendedTracks}
                disabled={loading}
                // className="bg-[#7a3fa9] text-white px-6 py-3 rounded-full text-lg font-semibold group-hover:bg-[#d7c6e6] group-hover:text-black transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 shadow-xl relative overflow-hidden transition-all duration-300 hover:w-4/5"
                className="bg-[#7a3fa9] text-white px-6 py-3 rounded-full text-lg font-semibold group-hover:bg-[#d7c6e6] group-hover:text-black transform hover:-translate-y-1 shadow-xl relative overflow-hidden w-4/5 hover:w-full transition-all duration-300 ease-in-out"              >
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
            <div className="mt-4 pr-2 tracklist-scroll overflow-y-auto" style={{ maxHeight: '330px' }}>
            {tracks.length > 0 ? (
                tracks.slice(0, 10).map((track, index) => (
                  <div 
                    key={index} 
                    className="backdrop-blur-md text-white p-4 rounded-lg shadow-lg mb-4 track-card bg-[#7a3fa9] group-hover:bg-[#d7c6e6]"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <h3 className="text-xl font-bold transition-all duration-500 text-[#d7c6e6] group-hover:text-black">🎵 {track.track}</h3>
                    <p className="transition-all duration-500 text-[#d7c6e6] group-hover:text-black"><strong>Artist:</strong> {track.artist}</p>
                    <p className="transition-all duration-500 text-[#d7c6e6] group-hover:text-black"><strong>Genre:</strong> {track.genre}</p>
                    
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
                <div className="text-center text-gray-300 py-7">
                  <div className="text-5xl mb-4 animate-bounce">
                    <img className="mx-auto block animate-spin" src={vinyl}style={{height:'90px'}}/>
                  </div>
                  <p className="group-hover:text-white transition-colors duration-500 py-5">Click the button above to detect your emotion and get personalized music recommendations</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Section - Text to Music */}
          <div className="group w-full lg:w-1/2 bg-[#d7c6e6] backdrop-blur-md rounded-2xl p-6 transform transition-all duration-500 hover:scale-102 hover:bg-[#7a3fa9]">
            <h2 className="text-2xl font-bold p-6 mb-6 text-center text-[#1e1e3f] transition-colors duration-500 group-hover:text-white">
              Text-to-Music Generation
            </h2>
            
            <div className="relative mb-6">
            <textarea
            className="w-full p-4 bg-white/10 border border-purple-300/50 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 backdrop-blur-sm group-hover:text-white group-hover:placeholder-white"
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
                className="bg-[#7a3fa9] text-white px-6 py-3 rounded-full text-lg font-semibold group-hover:bg-[#d7c6e6] group-hover:text-black transform hover:-translate-y-1 shadow-xl relative overflow-hidden w-4/5 hover:w-full transition-all duration-300 ease-in-out"
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
                <div className="bg-[#7a3fa9]/40 group-hover:bg-[#d7c6e6]/40 p-4 rounded-xl">
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
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-gray-300">
                <p className="transition-all duration-500 group-hover:text-white" style={{paddingTop:'15px'}}>Enter a description above and generate your custom music</p>
              </div>
            )}
          </div>
        </div>
    </div>
    </>
  );
};

export default Music_Generation;