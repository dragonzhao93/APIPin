'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Slider, Typography, Drawer } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, UpOutlined, DownOutlined, CustomerServiceOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import LyricDisplay from './LyricDisplay';
import { useMusic } from '@/contexts/MusicContext';

const { Text } = Typography;

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 在组件顶部添加样式
const vinylStyles = {
  animation: 'spin 20s linear infinite',
  animationPlayState: 'paused'
};

// 创建一个统一的 Slider 样式配置
const sliderStyles = {
  rail: { 
    backgroundColor: '#e8e8e8', 
    height: '2px' 
  },
  track: { 
    backgroundColor: '#1677ff', 
    height: '2px' 
  },
  handle: { 
    borderColor: '#1677ff',
    width: '12px',
    height: '12px',
    marginTop: '-6px',
    transform: 'translateY(50%)', // 关键是这行，确保滑块垂直居中
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }
};

// 自定义进度条组件
const ProgressSlider = ({ value, max, onChange, disabled }) => {
  const sliderWidth = 100; // 进度条宽度百分比
  const progress = (value / max) * sliderWidth;

  return (
    <div className="relative flex-1 group">
      {/* 进度条背景 */}
      <div className="absolute w-full h-1 bg-gray-200 rounded-full top-1/2 -translate-y-1/2" />
      
      {/* 进度条 */}
      <div 
        className="absolute h-1 bg-blue-500 rounded-full top-1/2 -translate-y-1/2 transition-all"
        style={{ width: `${progress}%` }}
      />

      {/* 滑块 SVG */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 -ml-2"
        style={{ left: `${progress}%` }}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 16 16"
          className="group-hover:scale-110 transition-transform duration-200"
        >
          {/* 外圈光晕 */}
          <circle
            cx="8"
            cy="8"
            r="7"
            className="fill-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"
          />
          {/* 主圆点 */}
          <circle
            cx="8"
            cy="8"
            r="4"
            className="fill-blue-500"
          />
        </svg>
      </div>

      {/* 隐藏的滑块输入 */}
      <input
        type="range"
        min="0"
        max={max}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="absolute w-full opacity-0 cursor-pointer"
        style={{ height: '20px', top: '50%', transform: 'translateY(-50%)' }}
      />
    </div>
  );
};

export default function GlobalAudioPlayer() {
  const { 
    currentSong, 
    isPlaying, 
    setIsPlaying, 
    toggleFavorite, 
    isFavorite, 
    isLoading 
  } = useMusic();

  const [expanded, setExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const audioRef = useRef(null);

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
  }, [currentSong?.url]);

  useEffect(() => {
    if (currentSong?.url) {
      // 当有新的歌曲时，等待音频加载完成后播放
      const audioElement = audioRef.current;
      audioElement.load(); // 强制重新加载
      
      const playWhenReady = () => {
        audioElement.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error('Playback failed:', error);
            setIsPlaying(false);
          });
      };

      audioElement.addEventListener('loadeddata', playWhenReady);
      return () => {
        audioElement.removeEventListener('loadeddata', playWhenReady);
      };
    } else {
      setIsPlaying(false);
    }
  }, [currentSong?.url, setIsPlaying]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.play().catch(error => {
        console.error('Playback failed:', error);
        setIsPlaying(false);
      });
    } else {
      audioElement.pause();
    }
  }, [isPlaying, setIsPlaying]);

  const handleSliderChange = (value) => {
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleLyricClick = (timeStr) => {
    const [minutes, seconds] = timeStr.split(':').map(parseFloat);
    const newTime = minutes * 60 + seconds;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  useEffect(() => {
    if (!currentSong?.lyrics?.length) return;
    
    const findCurrentLyricIndex = (time) => {
      for (let i = currentSong.lyrics.length - 1; i >= 0; i--) {
        const lyricTime = currentSong.lyrics[i].time.split(':').reduce((acc, val) => acc * 60 + parseFloat(val), 0);
        if (time >= lyricTime) return i;
      }
      return -1;
    };

    const handleTimeUpdate = () => {
      const currentTime = audioRef.current.currentTime;
      const index = findCurrentLyricIndex(currentTime);
      if (index !== currentLyricIndex) {
        setCurrentLyricIndex(index);
      }
    };

    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        if (audioElement) {
          audioElement.removeEventListener('timeupdate', handleTimeUpdate);
        }
      };
    }
  }, [currentSong?.lyrics, currentLyricIndex]);

  // 添加音频结束事件监听
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    
    const handleEnded = () => {
      setIsPlaying(false); // 通知父组件停止播放
    };

    audioElement.addEventListener('ended', handleEnded);
    return () => {
      if (audioElement) {
        audioElement.removeEventListener('ended', handleEnded);
      }
    };
  }, [setIsPlaying]);

  // 更新封面图片样式
  const coverStyles = {
    animation: isPlaying ? 'spin 20s linear infinite' : 'none',
    transform: 'rotate(0deg)',
    transition: 'all 0.5s ease-out' // 添加过渡效果，使停止更平滑
  };

  return (
    <div 
      className={`fixed left-0 right-0 bg-white/80 backdrop-blur-sm transition-all duration-300 ease-out
        ${expanded ? 'top-0 h-screen m-0 rounded-none' : 'bottom-0 h-[72px] mx-4 mb-4 rounded-xl'}
      `}
      style={{
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        willChange: 'height, margin, border-radius',
        transform: 'translateZ(0)', // 启用硬件加速
      }}
    >
      {expanded ? (
        <div className="h-full flex flex-col p-4 animate-fadeIn">
          <Button 
            type="text"
            icon={<DownOutlined />}
            onClick={() => setExpanded(false)}
            className="self-start mb-2"
          />
          
          <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden items-center justify-center" 
               style={{ maxHeight: 'calc(100vh - 180px)' }}>
            {currentSong ? (
              <>
                <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                  <div 
                    className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden"
                    style={{
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                    }}
                  >
                    <img 
                      src={currentSong?.cover || '/default-cover.jpg'}
                      alt={currentSong?.name}
                      className="w-full h-full object-cover"
                      style={coverStyles}
                    />
                  </div>
                  
                  <div className="mt-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Text strong className="text-lg">{currentSong?.name}</Text>
                      {currentSong && (
                        <Button
                          type="text"
                          icon={isFavorite(currentSong) ? <StarFilled /> : <StarOutlined />}
                          onClick={() => toggleFavorite(currentSong)}
                          className="hover:scale-105 transition-transform"
                        />
                      )}
                    </div>
                    <Text type="secondary">{currentSong?.singer}</Text>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <LyricDisplay 
                    lyrics={currentSong?.lyrics || []}
                    currentLyricIndex={currentLyricIndex}
                    onLyricClick={handleLyricClick}
                  />
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500">
                <CustomerServiceOutlined className="text-6xl mb-4 block" />
                <p>还没有播放任何歌曲</p>
                <p className="text-sm mt-2">搜索并选择一首歌曲开始播放</p>
              </div>
            )}
          </div>

          <div className="h-[120px] flex flex-col justify-end py-4">
            <div className="flex items-center gap-4">
              <Text className="w-12 text-right">{formatTime(currentTime)}</Text>
              <ProgressSlider 
                value={currentTime}
                max={duration || 100}
                onChange={handleSliderChange}
                disabled={!currentSong}
              />
              <Text className="w-12">{formatTime(duration)}</Text>
            </div>
            
            <div className="flex justify-center mt-4">
              <Button 
                type="primary" 
                shape="circle"
                size="middle"
                loading={isLoading}
                icon={!isLoading && (isPlaying ? (
                  <PauseCircleOutlined style={{ fontSize: '20px' }} />
                ) : (
                  <PlayCircleOutlined style={{ fontSize: '20px' }} />
                ))}
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={!currentSong}
                className="hover:scale-105 transition-transform duration-200 disabled:opacity-50"
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(22, 119, 255, 0.15)',
                  background: '#1677ff'
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center px-6 gap-4 animate-fadeIn">
          <Button 
            type="text"
            icon={<UpOutlined />}
            onClick={() => setExpanded(true)}
            className="hover:scale-105 transition-transform"
          />
          
          <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm">
            {currentSong ? (
              <img 
                src={currentSong.cover || '/default-cover.jpg'} 
                alt={currentSong.name}
                className="w-full h-full object-cover"
                style={coverStyles}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <CustomerServiceOutlined className="text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <Text className="text-sm truncate flex-1 text-gray-800">
                {currentSong ? `${currentSong.name} - ${currentSong.singer}` : '未播放任何歌曲'}
              </Text>
              {currentSong && (
                <Button
                  type="text"
                  size="small"
                  icon={isFavorite(currentSong) ? <StarFilled /> : <StarOutlined />}
                  onClick={() => toggleFavorite(currentSong)}
                  className="ml-2 hover:scale-105 transition-transform"
                />
              )}
              <Text className="text-xs ml-2 whitespace-nowrap text-gray-500">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
            </div>
            <ProgressSlider 
              value={currentTime}
              max={duration || 100}
              onChange={handleSliderChange}
              disabled={!currentSong}
            />
          </div>

          <Button 
            type="primary" 
            shape="circle"
            size="middle"
            loading={isLoading}
            icon={!isLoading && (isPlaying ? (
              <PauseCircleOutlined style={{ fontSize: '20px' }} />
            ) : (
              <PlayCircleOutlined style={{ fontSize: '20px' }} />
            ))}
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!currentSong}
            className="hover:scale-105 transition-transform duration-200 disabled:opacity-50"
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(22, 119, 255, 0.15)',
              background: '#1677ff'
            }}
          />
        </div>
      )}

      <audio 
        ref={audioRef}
        src={currentSong?.url}
        crossOrigin="anonymous"
        preload="auto" // 改为 auto 以预加载音频
        className="hidden"
      />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 