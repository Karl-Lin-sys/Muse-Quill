export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface StoryData {
  imageUrl: string;
  imageBase64: string; // just the base64 string without data uris
  mimeType: string;
  openingParagraph: string;
}
