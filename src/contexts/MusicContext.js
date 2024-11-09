'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useFavoriteSync } from '@/hooks/useFavoriteSync';
import { usePlayQueue } from '@/hooks/usePlayQueue';

const MusicContext = createContext(null);

export function MusicProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [view, setView] = useState('search');
  const [selectedQuality, setSelectedQuality] = useState(5); // 默认标准音质
  const [playHistory, setPlayHistory] = useLocalStorage('playHistory', []);
  const { favorites, isFavorite, toggleFavorite } = useFavoriteSync();
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { queue: playQueue, isInQueue, toggleQueue, clearQueue, getNextSong, getPreviousSong } = usePlayQueue();

  // 添加到播放历史
  const addToHistory = (song) => {
    setPlayHistory(prev => {
      const filtered = prev.filter(s => 
        !(s.name === song.name && s.singer === song.singer && s.platform === song.platform)
      );
      
      // 构建完整的请求URL
      const requestUrl = `/api/sby?platform=${song.platform}&term=${encodeURIComponent(song.searchTerm || searchTerm)}&index=${song.searchIndex}${selectedQuality ? `&quality=${selectedQuality}` : ''}`;
      
      const simplifiedSong = {
        id: song.id,
        name: song.name,
        singer: song.singer,
        cover: song.cover,
        url: song.url,
        lyrics: song.lyrics || [],
        platform: song.platform,
        requestUrl // 替换原来的endpoint对象
      };
      
      return [simplifiedSong, ...filtered].slice(0, 50);
    });
  };

  // 从播放历史中删除
  const removeFromHistory = (song) => {
    setPlayHistory(prev => 
      prev.filter(s => 
        !(s.name === song.name && s.singer === song.singer && s.platform === song.platform)
      )
    );
  };

  // 搜索功能
  const onSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    try {
      const [wyResult, qqResult] = await Promise.all([
        fetch(`/api/sby?platform=wy&term=${encodeURIComponent(searchTerm)}`).then(r => r.json()),
        fetch(`/api/sby?platform=qq&term=${encodeURIComponent(searchTerm)}`).then(r => r.json())
      ]);

      const combinedSongs = [];
      
      if (wyResult.success && wyResult.data.code === 200) {
        combinedSongs.push(...wyResult.data.data.map((song, index) => ({
          ...song,
          platform: 'wy',
          name: song.name || song.song,
          singer: song.singer || song.author,
          searchIndex: index
        })));
      }

      if (qqResult.success && qqResult.data.code === 200) {
        const qqSongs = Array.isArray(qqResult.data.data) ? qqResult.data.data : [qqResult.data.data];
        combinedSongs.push(...qqSongs.map((song, index) => ({
          ...song,
          platform: 'qq',
          name: song.song,
          singer: song.singer,
          searchIndex: index
        })));
      }

      setSongs(interleaveResults(combinedSongs));
    } catch (error) {
      message.error('搜索失败');
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  // 播放歌曲
  const onPlaySong = async (song, index, quality, isRetry = false) => {
    // 如果正在加载中且不是重试，则跳过
    if (isLoading && !isRetry) return;
    
    const maxRetries = 3;
    let retryCount = 0;
    let lastError = null;

    const tryPlay = async () => {
      try {
        const requestUrl = song.requestUrl || `/api/sby?platform=${song.platform}&term=${encodeURIComponent(song.searchTerm || searchTerm)}&index=${song.searchIndex || index}${quality ? `&quality=${quality}` : ''}`;
        
        const { success, data } = await fetch(requestUrl).then(r => r.json());

        if (success && data.code === 200) {
          const updatedSong = {
            ...song,
            id: data.data?.id || song.id,
            url: song.platform === 'qq' ? data.data.url : data.mp3,
            cover: song.platform === 'qq' ? data.data.cover : data.img,
            lyrics: song.platform === 'qq' ? [] : (data.lyric || []),
            searchTerm: song.searchTerm || searchTerm,
            searchIndex: song.searchIndex || index,
            details: song.platform === 'qq' ? data.data : null,
            requestUrl: requestUrl
          };

          if (!updatedSong.url) {
            throw new Error('Invalid audio URL');
          }

          // 更新历史记录和播放列表中的数据
          updateSongData(updatedSong);
          
          setCurrentSong(updatedSong);
          setIsPlaying(true);
          addToHistory(updatedSong);
          return true;
        } else {
          throw new Error(data.msg || '获取歌曲详情失败');
        }
      } catch (error) {
        lastError = error;
        return false;
      }
    };

    setIsLoading(true);
    try {
      while (retryCount < maxRetries) {
        const success = await tryPlay();
        if (success) return;
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      throw lastError || new Error('播放失败');
    } catch (error) {
      console.error('播放失败:', error);
      message.error(error.message || '播放失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 更新所有相关列表中的歌曲数据
  const updateSongData = (updatedSong) => {
    // 更新播放历史
    setPlayHistory(prev => prev.map(song => 
      isSameSong(song, updatedSong) ? { ...updatedSong } : song
    ));

    // 更新播放队列
    if (playQueue.some(song => isSameSong(song, updatedSong))) {
      toggleQueue(updatedSong);
      toggleQueue(updatedSong);
    }

    // 更新搜索结果
    setSongs(prev => prev.map(song => 
      isSameSong(song, updatedSong) ? { ...updatedSong } : song
    ));
  };

  // 判断是否为同一首歌
  const isSameSong = (song1, song2) => {
    return song1.name === song2.name && 
           song1.singer === song2.singer && 
           song1.platform === song2.platform;
  };

  // 修改音质选择处理函数
  const handleQualityChange = (quality) => {
    setSelectedQuality(quality);
  };

  // 监听歌曲播放结束,自动播放下一首
  useEffect(() => {
    if (!isPlaying && currentSong && !isLoading) {
      const nextSong = getNextSong(currentSong);
      if (nextSong) {
        if (nextSong.url) {
          setCurrentSong(nextSong);
          setIsPlaying(true);
        } else {
          onPlaySong(nextSong, nextSong.searchIndex, selectedQuality);
        }
      }
    }
  }, [isPlaying, currentSong, isLoading]);

  const playPreviousSong = () => {
    if (!currentSong) return;
    const previousSong = getPreviousSong(currentSong);
    if (previousSong) {
      if (previousSong.url) {
        setCurrentSong(previousSong);
        setIsPlaying(true);
      } else {
        onPlaySong(previousSong, previousSong.searchIndex, selectedQuality);
      }
    }
  };

  const playNextSong = () => {
    if (!currentSong) return;
    const nextSong = getNextSong(currentSong);
    if (nextSong) {
      if (nextSong.url) {
        setCurrentSong(nextSong);
        setIsPlaying(true);
      } else {
        onPlaySong(nextSong, nextSong.searchIndex, selectedQuality);
      }
    }
  };

  const value = {
    searchTerm,
    setSearchTerm,
    songs,
    setSongs,
    currentSong,
    setCurrentSong,
    isPlaying,
    setIsPlaying,
    view,
    setView,
    selectedQuality,
    setSelectedQuality: handleQualityChange,
    onSearch,
    onPlaySong,
    playHistory,
    favorites,
    isFavorite,
    removeFromHistory,
    toggleFavorite,
    isSearching,
    isLoading,
    playQueue,
    isInQueue,
    toggleQueue,
    clearQueue,
    playPreviousSong,
    playNextSong,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}

// 辅助函数
function interleaveResults(songs) {
  const interleavedSongs = [];
  const maxLength = Math.max(
    songs.filter(s => s.platform === 'wy').length,
    songs.filter(s => s.platform === 'qq').length
  );

  for (let i = 0; i < maxLength; i++) {
    const wySong = songs.find((s, index) => 
      s.platform === 'wy' && 
      songs.filter(x => x.platform === 'wy').indexOf(s) === i
    );
    const qqSong = songs.find((s, index) => 
      s.platform === 'qq' && 
      songs.filter(x => x.platform === 'qq').indexOf(s) === i
    );
    
    if (wySong) interleavedSongs.push(wySong);
    if (qqSong) interleavedSongs.push(qqSong);
  }
  return interleavedSongs;
}

function extractQQDetails(data) {
  return {
    pay: data.pay,
    time: data.time,
    bpm: data.bpm,
    quality: data.quality,
    interval: data.interval,
    size: data.size,
    kbps: data.kbps
  };
}

function formatSongData(data, platform, originalSong) {
  return platform === 'qq' 
    ? {
        name: data.data.song,
        singer: data.data.singer,
        url: data.data.url,
        cover: data.data.cover,
        lyrics: [],
        platform,
        details: originalSong?.details,
        requestUrl: originalSong?.requestUrl
      }
    : {
        name: data.name,
        singer: data.author,
        url: data.mp3,
        cover: data.img,
        lyrics: data.lyric || [],
        platform,
        details: originalSong?.details,
        requestUrl: originalSong?.requestUrl
      };
}

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}; 