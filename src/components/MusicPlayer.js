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

const { Title, Text } = Typography;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function MusicPlayer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rawResponseData, setRawResponseData] = useState(null);

  const searchMusic = async () => {
    try {
      const wyResponse = fetch(`${API_BASE_URL}/wydg/?msg=${searchTerm}`);
      const qqResponse = fetch(`${API_BASE_URL}/qqdg/?word=${searchTerm}`);
      
      const [wyData, qqData] = await Promise.all([
        (await wyResponse).json(),
        (await qqResponse).json()
      ]);

      let combinedSongs = [];
      
      if (wyData.code === 200) {
        const wySongs = wyData.data.map(song => ({
          ...song,
          platform: 'wy',
          name: song.name || song.song,
          singer: song.singer || song.author
        }));
        combinedSongs.push(...wySongs);
      }

      if (qqData.code === 200) {
        const qqSongs = (Array.isArray(qqData.data) ? qqData.data : [qqData.data]).map(song => ({
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

  const playSong = async (song, index, quality = 5) => {
    try {
      let apiUrl;
      if (song.platform === 'qq') {
        apiUrl = `${API_BASE_URL}/qqdg/?word=${searchTerm}&n=${index + 1}&q=${quality}`;
      } else {
        apiUrl = `${API_BASE_URL}/wydg/?msg=${searchTerm}&n=${index + 1}`;
      }

      const response = await fetch(apiUrl);
      const data = await response.json();

      setRawResponseData(data);

      if (data.code === 200) {
        const processedSong = song.platform === 'qq' 
          ? {
              name: data.data.song,
              singer: data.data.singer,
              url: data.data.url,
              cover: data.data.cover,
              lyrics: [] // QQ音乐API似乎不返回歌词
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
    setIsPlaying(false); // 先暂停当前播放
    await playSong(song, index, quality);
    setIsPlaying(true);  // 新歌曲加载后自动播放
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
      
      {currentSong && (
        <GlobalAudioPlayer 
          song={currentSong}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
        />
      )}
    </>
  );
} 