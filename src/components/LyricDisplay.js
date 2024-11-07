'use client';

import { useRef, useEffect } from 'react';

export default function LyricDisplay({ 
  lyrics = [], 
  currentLyricIndex, 
  onLyricClick 
}) {
  const lyricsContainerRef = useRef(null);

  useEffect(() => {
    if (lyricsContainerRef.current && currentLyricIndex !== -1) {
      const lyricElement = lyricsContainerRef.current.children[currentLyricIndex];
      if (lyricElement) {
        lyricElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [currentLyricIndex]);

  if (lyrics.length === 0) {
    return (
      <div className="text-center text-gray-500 p-4">
        暂无歌词
      </div>
    );
  }

  return (
    <div 
      ref={lyricsContainerRef} 
      className="h-[calc(100vh-400px)] overflow-y-auto p-4 bg-gray-100 rounded-lg"
      style={{ scrollbarWidth: 'thin' }}
    >
      {lyrics.map((lyric, index) => (
        <div 
          key={index} 
          onClick={() => onLyricClick(lyric.time)}
          className={`
            p-2 
            cursor-pointer 
            rounded 
            transition-all 
            duration-300 
            text-center
            ${index === currentLyricIndex 
              ? 'bg-blue-200 text-blue-800 font-bold scale-105' 
              : 'hover:bg-gray-200 hover:scale-102'}
          `}
        >
          {lyric.name}
        </div>
      ))}
    </div>
  );
} 