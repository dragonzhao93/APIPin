'use client';

import { useRef, useEffect } from 'react';

export default function LyricDisplay({ 
  lyrics = [], 
  currentLyricIndex, 
  onLyricClick,
  className = '' 
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
      className={`h-full overflow-y-auto p-4 rounded-lg ${className}`}
      style={{ 
        scrollbarWidth: 'thin',
        scrollBehavior: 'smooth'
      }}
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
            my-4
            ${index === currentLyricIndex 
              ? 'bg-blue-500/90 text-white font-bold scale-105 shadow-sm' 
              : 'text-gray-600 hover:bg-gray-100/80'}
          `}
        >
          {lyric.name}
        </div>
      ))}
    </div>
  );
} 