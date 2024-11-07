'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Typography, Alert, message, Slider } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined 
} from '@ant-design/icons';
import LyricDisplay from './LyricDisplay';

const { Title, Text } = Typography;

// 格式化时间为 MM:SS
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function VinylRecord({ song, isPlaying, onPlayPause, lyrics = [] }) {
  const audioRef = useRef(null);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [audioError, setAudioError] = useState(false);
  const [audioErrorDetails, setAudioErrorDetails] = useState(null);
  const [showAudioLink, setShowAudioLink] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setShowAudioLink(true);
    setAudioError(false);
    setAudioErrorDetails(null);
  }, [song.url]);

  useEffect(() => {
    const audioElement = audioRef.current;
    
    const handleError = (e) => {
      console.error('Audio error:', e);
      setAudioError(true);
      setAudioErrorDetails({
        error: e,
        src: audioElement.src,
        networkState: audioElement.networkState,
        readyState: audioElement.readyState
      });
    };

    audioElement.addEventListener('error', handleError);
    
    return () => {
      audioElement.removeEventListener('error', handleError);
    };
  }, [song.url]);

  useEffect(() => {
    if (isPlaying && !audioError) {
      audioRef.current.play().catch(error => {
        console.error('Playback failed:', error);
        setAudioError(true);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, audioError]);

  useEffect(() => {
    const audioElement = audioRef.current;
    
    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };

    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [song.url]);

  // 处理进度条变化
  const handleSliderChange = (value) => {
    const audioElement = audioRef.current;
    audioElement.currentTime = value;
    setCurrentTime(value);
  };

  const convertTimeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const [minutes, seconds] = timeStr.split(':').map(str => {
      // 处理可能带有小数点的秒数
      return parseFloat(str);
    });
    return minutes * 60 + seconds;
  };

  // 处理歌词点击
  const handleLyricClick = (timeStr) => {
    const seconds = convertTimeToSeconds(timeStr);
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  // 更新当前歌词索引
  useEffect(() => {
    if (!lyrics.length) return;

    const getCurrentLyricIndex = (currentTime) => {
      for (let i = lyrics.length - 1; i >= 0; i--) {
        const lyricTime = convertTimeToSeconds(lyrics[i].time);
        if (lyricTime <= currentTime) {
          return i;
        }
      }
      return -1;
    };

    const handleTimeUpdate = () => {
      const currentTime = audioRef.current.currentTime;
      setCurrentTime(currentTime);
      setCurrentLyricIndex(getCurrentLyricIndex(currentTime));
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [lyrics]);

  return (
    <div className="vinyl-container flex flex-col items-center gap-4">


      {/* Main Content */}
      <div className="flex flex-col lg:flex-row w-full gap-6">
        {/* Vinyl Disc */}
        <div className="w-full lg:w-1/2 flex flex-col items-center">
          <div className={`vinyl-disc w-64 h-64 sm:w-80 sm:h-80 rounded-full 
            bg-gradient-to-br from-gray-800 to-black flex justify-center 
            items-center relative overflow-hidden shadow-2xl
            ${isPlaying ? 'animate-spin-slow' : ''}`}>
            <div 
              className="vinyl-center 
                w-24 h-24 
                bg-gray-700 
                rounded-full 
                absolute 
                z-10
                shadow-inner"
            />
            <img 
              src={song.cover || 'default-cover.jpg'} 
              alt={song.name} 
              className="absolute w-64 h-64 rounded-full object-cover border-4 border-white"
            />
          </div>

          {/* Song Info & Controls */}
          <div className="mt-6 text-center">
            <Title level={4} className="mb-1 break-all">{song.name}</Title>
            <Text type="secondary">{song.singer}</Text>
          </div>
        </div>

        {/* Lyrics */}
        {lyrics.length > 0 && (
          <div className="w-full lg:w-1/2">
            <LyricDisplay 
              lyrics={lyrics}
              currentLyricIndex={currentLyricIndex}
              onLyricClick={handleLyricClick}
            />
          </div>
        )}
      </div>

      {/* Player Controls */}
      <div className="w-full px-4">
        <div className="flex items-center gap-4">
          <Button 
            type="primary" 
            shape="circle" 
            size="large"
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={onPlayPause}
          />
          
          <Text className="w-12 text-right whitespace-nowrap">
            {formatTime(currentTime)}
          </Text>
          
          <Slider 
            className="flex-grow" 
            value={currentTime}
            max={duration || 100}
            onChange={handleSliderChange}
            tooltip={{ formatter: value => formatTime(value) }}
          />
          
          <Text className="w-12 whitespace-nowrap">
            {formatTime(duration)}
          </Text>
        </div>
      </div>

      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        src={song.url} 
        crossOrigin="anonymous"
        preload="metadata"
        className="hidden"
      />
    </div>
  );
} 