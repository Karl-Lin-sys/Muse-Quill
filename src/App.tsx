/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Feather } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageUpload } from './components/ImageUpload';
import { StoryView } from './components/StoryView';
import { ChatInterface } from './components/ChatInterface';
import { StoryData } from './types';

export default function App() {
  const [story, setStory] = useState<StoryData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageSelected = async (imageUrl: string, base64: string, mimeType: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      setStory({
        imageUrl,
        imageBase64: base64,
        mimeType,
        openingParagraph: data.text,
      });
    } catch (error) {
      console.error(error);
      alert('Failed to analyze the image and generate a story.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetStory = () => {
    setStory(null);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-amber-200">
      <header className="px-6 py-8 border-b border-stone-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-800 text-white rounded-lg">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-medium leading-none">Muse & Quill</h1>
              <p className="text-sm text-stone-500 mt-1">AI-assisted creative writing</p>
            </div>
          </div>
          {story && (
            <button
              onClick={resetStory}
              className="text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
            >
              Start New Story
            </button>
          )}
        </div>
      </header>

      <main className="px-6 py-12 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {!story ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center min-h-[50vh]"
            >
              <div className="text-center mb-12 max-w-xl">
                <h2 className="text-4xl font-serif font-medium text-stone-800 mb-4">
                  Visual prompts to literary worlds
                </h2>
                <p className="text-lg text-stone-500">
                  Upload an inspiring image, and let the AI ghostwrite the first paragraph of your next great story.
                </p>
              </div>
              <ImageUpload onImageSelected={handleImageSelected} isLoading={isAnalyzing} />
            </motion.div>
          ) : (
            <motion.div
              key="story"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="pb-24"
            >
              <StoryView story={story} />
              <ChatInterface story={story} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
