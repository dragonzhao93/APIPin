'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useFavoriteSync } from '@/hooks/useFavoriteSync';
import { usePlayQueue } from '@/hooks/usePlayQueue';

const MusicContext = createContext(null);

const CURRENT_SONG_KEY = 'currentPlayingSong';

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
  const audioRef = useRef(null);
  const messageShownRef = useRef(false);
  const abortControllerRef = useRef(null);

  // 初始化时从 localStorage 读取上次播放的歌曲
  useEffect(() => {
    // 如果消息已经显示过，直接返回
    if (messageShownRef.current) return;
    
    try {
      const savedSong = localStorage.getItem(CURRENT_SONG_KEY);
      if (savedSong) {
        const parsedSong = JSON.parse(savedSong);
        setCurrentSong(parsedSong);
        // 使用 ref 来确保消息只显示一次
        if (!messageShownRef.current) {
          message.info(`上次播放: ${parsedSong.name} - ${parsedSong.singer}`, 3);
          messageShownRef.current = true;
        }
      }
    } catch (error) {
      console.error('Failed to load last playing song:', error);
    }
  }, []); // 只在组件挂载时执行一次

  // 当 currentSong 改变时保存到 localStorage
  useEffect(() => {
    if (!currentSong) return;
    
    try {
      localStorage.setItem(CURRENT_SONG_KEY, JSON.stringify(currentSong));
    } catch (error) {
      console.error('Failed to save current song:', error);
    }
  }, [currentSong]);

  // 添加到播放历史
  const addToHistory = (song) => {
    setPlayHistory(prev => {
      const filtered = prev.filter(s => 
        !(s.name === song.name && s.singer === song.singer && s.platform === song.platform)
      );
      
      // 直接使用原始的 requestUrl，如果没有才构建新的
      const simplifiedSong = {
        id: song.id,
        name: song.name,
        singer: song.singer,
        cover: song.cover,
        url: song.url,
        lyrics: song.lyrics || [],
        platform: song.platform,
        requestUrl: song.requestUrl || `/api/sby?platform=${song.platform}&term=${encodeURIComponent(song.searchTerm || searchTerm)}&index=${song.searchIndex}${selectedQuality ? `&quality=${selectedQuality}` : ''}`
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
  const onPlaySong = async (song, index, quality, isRetry = false, fromSearch = false) => {
    if (isLoading && !isRetry) return;

    const currentController = new AbortController();
    
    // 检查是否需要中断前一个请求
    if (abortControllerRef.current) {
      if (currentSong?.url === song.url && !isRetry && !fromSearch) {
        return;
      }
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = currentController;

    // 判断是否应该自动播放
    const shouldAutoPlay = isRetry ? isPlaying : true;

    setIsLoading(true);
    try {
      // 优先使用已存在的 requestUrl
      const requestUrl = song.requestUrl && !fromSearch
        ? song.requestUrl
        : `/api/sby?platform=${song.platform}&term=${encodeURIComponent(searchTerm)}&index=${index}${quality ? `&quality=${quality}` : ''}`;

      // 设置超时
      const timeoutId = setTimeout(() => {
        currentController.abort();
      }, 10000);

      const response = await fetch(requestUrl, {
        signal: currentController.signal
      });
      
      clearTimeout(timeoutId);
      
      const { success, data } = await response.json();

      if (success && data.code === 200) {
        const newUrl = song.platform === 'qq' ? data.data.url : data.mp3;
        
        // URL相同时保持当前状态
        if (currentSong?.url === newUrl) {
          return;
        }

        const updatedSong = {
          ...song,
          id: data.data?.id || song.id,
          url: newUrl,
          cover: song.platform === 'qq' ? data.data.cover : data.img,
          lyrics: song.platform === 'qq' ? [] : (data.lyric || []),
          searchTerm: song.searchTerm || searchTerm,
          searchIndex: song.searchIndex || index,
          details: song.platform === 'qq' ? data.data : null,
          requestUrl: requestUrl,
          quality: quality
        };

        if (!updatedSong.url || !isValidUrl(updatedSong.url)) {
          throw new Error('无效的音频 URL');
        }

        updateSongData(updatedSong);
        setCurrentSong(updatedSong);
        setIsPlaying(shouldAutoPlay);
        addToHistory(updatedSong);
      } else {
        throw new Error(data.msg || '获取歌曲详情失败');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        message.error('请求超时，播放失败');
      } else if (error.name === 'SecurityError' || error.message.includes('CORS')) {
        message.error('音频加载失败，请尝试其他歌曲');
      } else {
        message.error(error.message || '播放失败，请尝试其他歌曲');
      }
      setIsPlaying(false);
    } finally {
      if (currentController.signal.aborted) {
        abortControllerRef.current = null;
      }
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
    if (!isPlaying && currentSong && !isLoading && audioRef.current?.ended) {
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
    audioRef,
    addToHistory,
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

// 添加 URL 验证辅助函数
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}