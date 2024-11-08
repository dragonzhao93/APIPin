'use client';

import { useState } from 'react';
import { Input, Button, List, message, Select, Card, Typography } from 'antd';
import { 
  SearchOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  ArrowLeftOutlined 
} from '@ant-design/icons';
import SearchPanel from './SearchPanel';
import GlobalAudioPlayer from './GlobalAudioPlayer';
import { musicApi, fetchApi } from '../services/api';

const { Title, Text } = Typography;

export default function MusicPlayer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rawResponseData, setRawResponseData] = useState(null);

  const searchMusic = async () => {
    try {
      const [wyResult, qqResult] = await Promise.all([
        fetchApi(musicApi.search.wy(searchTerm)),
        fetchApi(musicApi.search.qq(searchTerm))
      ]);

      let combinedSongs = [];
      
      if (wyResult.success && wyResult.data.code === 200) {
        const wySongs = wyResult.data.data.map(song => ({
          ...song,
          platform: 'wy',
          name: song.name || song.song,
          singer: song.singer || song.author
        }));
        combinedSongs.push(...wySongs);
      }

      if (qqResult.success && qqResult.data.code === 200) {
        const qqSongs = (Array.isArray(qqResult.data.data) ? qqResult.data.data : [qqResult.data.data])
          .map(song => ({
            ...song,
            platform: 'qq',
            name: song.song,
            singer: song.singer
          }));
        combinedSongs.push(...qqSongs);
      }

      const interleavedSongs = [];
      const maxLength = Math.max(
        combinedSongs.filter(s => s.platform === 'wy').length,
        combinedSongs.filter(s => s.platform === 'qq').length
      );

      for (let i = 0; i < maxLength; i++) {
        const wySong = combinedSongs.find((s, index) => s.platform === 'wy' && 
          combinedSongs.filter(x => x.platform === 'wy').indexOf(s) === i);
        const qqSong = combinedSongs.find((s, index) => s.platform === 'qq' && 
          combinedSongs.filter(x => x.platform === 'qq').indexOf(s) === i);
        
        if (wySong) interleavedSongs.push(wySong);
        if (qqSong) interleavedSongs.push(qqSong);
      }

      setSongs(interleavedSongs);
    } catch (error) {
      message.error('搜索失败');
      console.error(error);
    }
  };

  const checkAudioUrl = async (url) => {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',  // 只请求头部信息
        mode: 'no-cors'  // 跨域请求
      });
      
      // 检查响应头的 Content-Type
      const contentType = response.headers.get('Content-Type');
      const isAudioType = contentType && (
        contentType.includes('audio/') || 
        contentType.includes('application/octet-stream')
      );

      return isAudioType;
    } catch (error) {
      console.error('Audio URL check failed:', error);
      return false;
    }
  };

  const playSong = async (song, index, quality) => {
    try {
      const endpoint = song.platform === 'qq' 
        ? musicApi.getSongDetail.qq(searchTerm, index, quality)
        : musicApi.getSongDetail.wy(searchTerm, index);

      const { success, data } = await fetchApi(endpoint);

      if (success && data.code === 200) {
        if (song.platform === 'qq') {
          setSongs(prevSongs => prevSongs.map(s => {
            if (s === song) {
              return {
                ...s,
                details: {
                  pay: data.data.pay,
                  time: data.data.time,
                  bpm: data.data.bpm,
                  quality: data.data.quality,
                  interval: data.data.interval,
                  size: data.data.size,
                  kbps: data.data.kbps
                }
              };
            }
            return s;
          }));
        }

        const processedSong = song.platform === 'qq' 
          ? {
              name: data.data.song,
              singer: data.data.singer,
              url: data.data.url,
              cover: data.data.cover,
              lyrics: []
            }
          : {
              name: data.name,
              singer: data.author,
              url: data.mp3,
              cover: data.img,
              lyrics: data.lyric || []
            };
        
        setCurrentSong(processedSong);
        setIsPlaying(true);
      } else {
        message.error('获取歌曲详情失败');
      }
    } catch (error) {
      message.error('播放失败');
      console.error(error);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePlaySong = async (song, index, quality) => {
    setIsPlaying(false);
    await playSong(song, index, quality);
    setIsPlaying(true);
  };

  return (
    <>
      <Card 
        className="music-player-card mx-auto h-[calc(100vh-120px)] md:max-w-7xl"
        style={{ 
          background: 'var(--background)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          margin: '16px'
        }}
      >
        <SearchPanel 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          songs={songs}
          onSearch={searchMusic}
          onPlaySong={handlePlaySong}
        />
      </Card>
      
      <GlobalAudioPlayer 
        song={currentSong}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
      />
    </>
  );
} 