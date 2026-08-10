import React, { useState, useRef } from 'react';
import { Play, Square, Loader2, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';
import { StoryData } from '../types';

interface StoryViewProps {
  story: StoryData;
}

export function StoryView({ story }: StoryViewProps) {
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleReadAloud = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      // If we already have the audio generated, just play it
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setIsAudioLoading(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: story.openingParagraph }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const data = await response.json();
      if (data.audioBase64) {
        // AI Studio returned PCM or WAV?
        // Wait, the gemini-3.1-flash-tts-preview returns RAW PCM if we use the API directly without WAV header.
        // Let's check the gemini-api skill: 
        // "Return this base64 audio to the client for playback (sample rate 24000)"
        // It's raw PCM!
        // Wait, the browser's HTMLAudioElement can't play raw PCM directly via base64 data URI unless it's a WAV.
        // But wait! If I need to play it, I must use AudioContext.
        
        // Let's implement AudioContext playback for raw PCM.
        const binaryString = atob(data.audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // The PCM is 16-bit little-endian. We need to convert it to Float32.
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }

        const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
        audioBuffer.copyToChannel(float32Array, 0);

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        
        source.onended = () => {
          setIsPlaying(false);
        };

        source.start(0);
        setIsPlaying(true);

        // Store some state if we want to pause (AudioContext can be suspended)
        // For simplicity, we'll just let it play or recreate it if needed.
        // Actually, we could store the audioCtx to suspend/resume.
        (audioRef as any).current = {
          play: () => audioCtx.resume(),
          pause: () => audioCtx.suspend(),
          get currentTime() { return 0; }, // mock
          set currentTime(v) {} // mock
        };
      }
    } catch (error) {
      console.error(error);
      alert('Failed to read aloud.');
    } finally {
      setIsAudioLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-start mt-8"
    >
      <div className="w-full md:w-1/2 rounded-2xl overflow-hidden shadow-lg bg-stone-100 ring-1 ring-stone-200">
        <img 
          src={story.imageUrl} 
          alt="Scene" 
          className="w-full h-auto object-cover object-center aspect-4/3" 
        />
      </div>
      
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        <h2 className="text-3xl font-serif text-stone-800 leading-tight">
          The Story Begins...
        </h2>
        
        <div className="prose prose-stone">
          <p className="text-lg text-stone-700 leading-relaxed font-serif">
            {story.openingParagraph}
          </p>
        </div>

        <div>
          <button
            onClick={handleReadAloud}
            disabled={isAudioLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors font-medium text-sm disabled:opacity-50"
          >
            {isAudioLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
            {isAudioLoading ? 'Preparing voice...' : isPlaying ? 'Stop reading' : 'Read aloud'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
