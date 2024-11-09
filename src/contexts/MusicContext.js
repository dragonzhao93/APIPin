'use client';

import { createContext, useContext, useState } from 'react';
import { musicApi, fetchApi } from '../services/api';
import { message } from 'antd';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useFavoriteSync } from '@/hooks/useFavoriteSync';

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

  // 添加到播放历史
  const addToHistory = (song) => {
    setPlayHistory(prev => {
      const filtered = prev.filter(s => 
        !(s.name === song.name && s.singer === song.singer && s.platform === song.platform)
      );
      return [{
        ...song,
        details: song.details || null,
        endpoint: song.endpoint || null
      }, ...filtered].slice(0, 50);
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
        fetchApi(musicApi.search.wy(searchTerm)),
        fetchApi(musicApi.search.qq(searchTerm))
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
  const onPlaySong = async (song, index, quality) => {
    setIsLoading(true);
    try {
      let endpoint;
      const currentQuality = quality || selectedQuality;
      
      if (song.endpoint) {
        const { term, index: songIndex } = song.endpoint;
        endpoint = song.platform === 'qq' 
          ? musicApi.getSongDetail.qq(term, songIndex, currentQuality)
          : musicApi.getSongDetail.wy(term, songIndex);
      } else {
        endpoint = song.platform === 'qq' 
          ? musicApi.getSongDetail.qq(searchTerm, song.searchIndex, currentQuality)
          : musicApi.getSongDetail.wy(searchTerm, song.searchIndex);
      }

      const { success, data } = await fetchApi(endpoint);

      if (success && data.code === 200) {
        const updatedSong = {
          ...song,
          endpoint: {
            term: song.endpoint?.term || searchTerm,
            index: song.endpoint?.index || song.searchIndex,
            quality: song.endpoint?.quality || quality
          },
          details: song.platform === 'qq' ? extractQQDetails(data.data) : null
        };

        if (song.platform === 'qq') {
          setSongs(prevSongs => prevSongs.map(s => 
            s === song ? updatedSong : s
          ));
        }

        setCurrentSong(formatSongData(data, song.platform, updatedSong));
        setIsPlaying(true);
        addToHistory(updatedSong);
      } else {
        message.error('获取歌曲详情失败');
      }
    } catch (error) {
      message.error('播放失败');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 修改音质选择处理函数
  const handleQualityChange = (quality) => {
    setSelectedQuality(quality);
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
        endpoint: originalSong?.endpoint
      }
    : {
        name: data.name,
        singer: data.author,
        url: data.mp3,
        cover: data.img,
        lyrics: data.lyric || [],
        platform,
        details: originalSong?.details,
        endpoint: originalSong?.endpoint
      };
}

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}; 