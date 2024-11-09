'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function usePlayQueue() {
  const [queue, setQueue] = useLocalStorage('playQueue', []);

  // 使用内存中的对象来做快速查找，而不是 Map
  const isInQueue = useCallback((song) => {
    if (!song) return false;
    return queue.some(s => 
      s.name === song.name && 
      s.singer === song.singer && 
      s.platform === song.platform
    );
  }, [queue]);

  // 优化 toggleQueue 函数
  const toggleQueue = useCallback((song) => {
    if (!song) return;
    
    setQueue(prev => {
      const exists = prev.some(s => 
        s.name === song.name && 
        s.singer === song.singer && 
        s.platform === song.platform
      );

      if (exists) {
        return prev.filter(s => 
          !(s.name === song.name && 
            s.singer === song.singer && 
            s.platform === song.platform)
        );
      }
      return [...prev, { ...song }];
    });
  }, [setQueue]);

  // 优化 clearQueue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, [setQueue]);

  // 优化 getNextSong
  const getNextSong = useCallback((currentSong) => {
    if (!currentSong || queue.length === 0) return null;
    
    const currentIndex = queue.findIndex(song => 
      song.name === currentSong.name && 
      song.singer === currentSong.singer && 
      song.platform === currentSong.platform
    );
    
    if (currentIndex === -1) return queue[0];
    
    const nextSong = queue[(currentIndex + 1) % queue.length];
    
    if (nextSong.url && nextSong.platform !== 'qq') return nextSong;
    
    return {
      ...nextSong,
      searchTerm: nextSong.searchTerm,
      searchIndex: nextSong.searchIndex
    };
  }, [queue]);

  // 添加获取上一首歌的函数
  const getPreviousSong = useCallback((currentSong) => {
    if (!currentSong || queue.length === 0) return null;
    
    const currentIndex = queue.findIndex(song => 
      song.name === currentSong.name && 
      song.singer === currentSong.singer && 
      song.platform === currentSong.platform
    );
    
    if (currentIndex === -1) return queue[queue.length - 1];
    
    const previousIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    const previousSong = queue[previousIndex];
    
    if (previousSong.url && previousSong.platform !== 'qq') return previousSong;
    
    return {
      ...previousSong,
      searchTerm: previousSong.searchTerm,
      searchIndex: previousSong.searchIndex
    };
  }, [queue]);

  return {
    queue,
    isInQueue,
    toggleQueue,
    clearQueue,
    getNextSong,
    getPreviousSong
  };
} 