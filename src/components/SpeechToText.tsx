'use client';

import { useRef } from 'react';

interface Props {
  onResult: (text: string) => void;
}

export default function SpeechToText({ onResult }: Props) {
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <button
      onClick={startListening}
      className="ml-2 bg-gray-200 text-gray-800 px-3 py-2 rounded hover:bg-gray-300 transition"
    >
      🎙️ Speak
    </button>
  );
}
