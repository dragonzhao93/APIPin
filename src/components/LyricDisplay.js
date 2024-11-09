'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LyricDisplay({ lyrics = [], currentLyricIndex, onLyricClick, className = '' }) {
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-gray-500 p-4"
      >
        暂无歌词
      </motion.div>
    );
  }

  return (
    <motion.div 
      ref={lyricsContainerRef} 
      className={`h-full overflow-y-auto p-4 rounded-lg ${className}`}
      style={{ scrollbarWidth: 'thin' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {lyrics.map((lyric, index) => (
          <motion.div 
            key={index} 
            onClick={() => onLyricClick(lyric.time)}
            className={`
              p-2 
              cursor-pointer 
              rounded 
              text-center
              my-4
              ${index === currentLyricIndex ? 'text-white font-bold' : 'text-gray-600'}
            `}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: index === currentLyricIndex ? 1.05 : 1,
            }}
            whileHover={{ 
              scale: index === currentLyricIndex ? 1.05 : 1.02,
              backgroundColor: index === currentLyricIndex ? 'rgba(59, 130, 246, 0.9)' : 'rgba(243, 244, 246, 0.8)'
            }}
            transition={{
              duration: 0.2,
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
            style={{
              backgroundColor: index === currentLyricIndex ? 'rgba(59, 130, 246, 0.9)' : 'transparent'
            }}
          >
            {lyric.name}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
} 