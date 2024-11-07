'use client';

import { useState } from 'react';
import { Input, Button, List, message, Select, Card, Typography } from 'antd';
import { 
  SearchOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  ArrowLeftOutlined 
} from '@ant-design/icons';
import VinylRecord from './VinylRecord';
import RawDataDisplay from './RawDataDisplay';
import SearchPanel from './SearchPanel';

const { Title, Text } = Typography;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function MusicPlayer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [platform, setPlatform] = useState('wy');
  const [quality, setQuality] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rawResponseData, setRawResponseData] = useState(null);
  const [showSearch, setShowSearch] = useState(true);

  const searchMusic = async () => {
    try {
      let apiUrl;
      if (platform === 'qq') {
        apiUrl = quality 
          ? `${API_BASE_URL}/qqdg/?word=${searchTerm}&q=${quality}`
          : `${API_BASE_URL}/qqdg/?word=${searchTerm}`;
      } else {
        apiUrl = `${API_BASE_URL}/wydg/?msg=${searchTerm}`;
      }

      const response = await fetch(apiUrl);
      const data = await response.json();

      setRawResponseData(data);

      if (data.code === 200) {
        const songList = platform === 'qq' 
          ? (Array.isArray(data.data) ? data.data : [data.data])
          : data.data;
        
        setSongs(songList);
      } else {
        message.error('未找到歌曲');
      }
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

  const playSong = async (song, index) => {
    try {
      let apiUrl;
      if (platform === 'qq') {
        apiUrl = quality 
          ? `${API_BASE_URL}/qqdg/?word=${searchTerm}&n=${index + 1}&q=${quality}`
          : `${API_BASE_URL}/qqdg/?word=${searchTerm}&n=${index + 1}`;
      } else {
        apiUrl = `${API_BASE_URL}/wydg/?msg=${searchTerm}&n=${index + 1}`;
      }

      const response = await fetch(apiUrl);
      const data = await response.json();

      setRawResponseData(data);

      if (data.code === 200) {
        const processedSong = platform === 'qq' 
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

  const handlePlaySong = async (song, index) => {
    await playSong(song, index);
    setShowSearch(false);
  };

  return (
    <Card 
      className="music-player-card max-w-7xl mx-auto"
      style={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
    >
      {showSearch ? (
        <SearchPanel 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          platform={platform}
          setPlatform={setPlatform}
          quality={quality}
          setQuality={setQuality}
          songs={songs}
          onSearch={searchMusic}
          onPlaySong={handlePlaySong}
        />
      ) : (
        <div>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => setShowSearch(true)}
            className="mb-4"
          >
            返回搜索
          </Button>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full">
              <VinylRecord 
                song={currentSong} 
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                lyrics={currentSong?.lyrics}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
} 