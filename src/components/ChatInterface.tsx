import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, StoryData } from '../types';

interface ChatInterfaceProps {
  story: StoryData;
}

export function ChatInterface({ story }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', parts: [{ text: input.trim() }] };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build the chat history for the API.
      // We'll also provide the system instruction in the API call.
      const history = [...messages, userMsg];

      // We should include the story context as the first user message if this is the start
      const chatPayload = [
        {
          role: 'user',
          parts: [{ text: `Here is the opening of our story based on a scene I provided:\n\n"${story.openingParagraph}"\n\nLet's continue writing it together or discuss it.` }]
        },
        ...history
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: chatPayload,
          systemInstruction: 'You are a creative co-author. The user provides ideas, and you help expand the story, adding rich descriptions, dialogue, and advancing the plot based on their prompts. Keep your responses engaging, literary, and in tone with the story.'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate chat response');
      }

      const data = await response.json();
      const modelMsg: ChatMessage = { role: 'model', parts: [{ text: data.text }] };
      
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      alert('Failed to get response.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-16 bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden flex flex-col h-[600px]">
      <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center gap-3">
        <div className="p-2 bg-amber-100 text-amber-900 rounded-lg">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-medium text-stone-800">Co-Author Chat</h3>
          <p className="text-xs text-stone-500">Continue the story or brainstorm ideas</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-4">
            <MessageSquare className="w-12 h-12 opacity-50" />
            <p className="text-sm font-medium">Say something to continue the story...</p>
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              <div className={`px-5 py-3.5 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-stone-800 text-stone-50 rounded-br-sm' 
                  : 'bg-white border border-stone-200 text-stone-700 rounded-bl-sm shadow-sm font-serif'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.parts[0].text}</p>
              </div>
              <span className="text-[10px] text-stone-400 mt-1.5 px-1 font-medium tracking-wide uppercase">
                {msg.role === 'user' ? 'You' : 'Co-Author'}
              </span>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col max-w-[80%] mr-auto items-start"
            >
              <div className="px-5 py-4 rounded-2xl bg-white border border-stone-200 rounded-bl-sm shadow-sm flex items-center gap-2 text-stone-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Writing...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-4 bg-white border-t border-stone-100">
        <form onSubmit={handleSend} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What happens next?"
            className="w-full bg-stone-100 border-none rounded-2xl pl-5 pr-14 py-4 focus:ring-2 focus:ring-stone-200 focus:outline-none resize-none"
            rows={1}
            style={{ minHeight: '56px', maxHeight: '150px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-stone-800 text-white rounded-xl hover:bg-stone-700 disabled:opacity-50 disabled:hover:bg-stone-800 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
