import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ImageUploadProps {
  onImageSelected: (imageUrl: string, base64: string, mimeType: string) => void;
  isLoading: boolean;
}

export function ImageUpload({ onImageSelected, isLoading }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Extract base64 and mime type
      const match = result.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        onImageSelected(result, match[2], match[1]);
      }
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative w-full max-w-2xl mx-auto rounded-2xl border-2 border-dashed p-12 transition-colors flex flex-col items-center justify-center text-center ${
        isDragging ? 'border-amber-500 bg-amber-50/50' : 'border-stone-300 bg-stone-50'
      } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />
      
      {isLoading ? (
        <div className="flex flex-col items-center gap-4 text-amber-700">
          <Loader2 className="w-12 h-12 animate-spin" />
          <h3 className="text-xl font-medium font-serif">Analyzing your world...</h3>
          <p className="text-stone-500 text-sm">The AI is observing the scene and writing the opening paragraph.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white rounded-full shadow-sm">
            <UploadCloud className="w-10 h-10 text-stone-400" />
          </div>
          <div>
            <h3 className="text-xl font-medium font-serif text-stone-800">Upload a scene to begin</h3>
            <p className="text-stone-500 text-sm mt-2 max-w-sm mx-auto">
              Drag and drop an image, or click to browse. We'll analyze the mood and ghostwrite the start of your story.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
