'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Slider, Typography, Drawer } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, UpOutlined, DownOutlined, CustomerServiceOutlined, StarOutlined, StarFilled, StepBackwardOutlined, StepForwardOutlined } from '@ant-design/icons';
import LyricDisplay from './LyricDisplay';
import { useMusic } from '@/contexts/MusicContext';
import { motion, AnimatePresence } from 'framer-motion';

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
    transform: 'translateY(50%)', // 关键是这，确保滑块垂直居中
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }
};

// 自定义进度条组件
const ProgressSlider = ({ value, max, onChange, disabled }) => {
  const sliderWidth = 100;
  const progress = (value / max) * sliderWidth;

  return (
    <div className="relative w-full group h-1">
      {/* 进度条背景 */}
      <div className="absolute w-full h-1 bg-gray-200/50 rounded-full" />
      
      {/* 进度条 */}
      <div 
        className="absolute h-1 bg-blue-500 rounded-full transition-all"
        style={{ width: `${progress}%` }}
      />

      {/* 滑块 */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 -ml-1.5"
        style={{ left: `${progress}%` }}
      >
        <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm 
                      transform transition-transform duration-200
                      group-hover:scale-125 group-hover:shadow-md" />
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
        style={{ height: '20px', top: '-10px' }}
      />
    </div>
  );
};

// 添加动画变体配置
const containerVariants = {
  expanded: {
    height: '100vh',
    margin: 0,
    borderRadius: 0,
    top: 0,
    bottom: 'auto'
  },
  collapsed: {
    height: '80px',
    margin: '0 8px 8px 8px',
    borderRadius: '12px',
    bottom: 0,
    top: 'auto'
  }
};

const coverVariants = {
  playing: {
    rotate: 360,
    transition: {
      duration: 20,
      ease: "linear",
      repeat: Infinity
    }
  },
  paused: {
    rotate: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export default function GlobalAudioPlayer() {
  const { 
    currentSong, 
    isPlaying, 
    setIsPlaying, 
    toggleFavorite, 
    isFavorite, 
    isLoading,
    onPlaySong,
    playPreviousSong,
    playNextSong,
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

    const playWithRetry = async () => {
      try {
        await audioElement.play();
      } catch (error) {
        console.error('Playback error:', error);
        // 检查是否为 CORS 错误
        if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError' || 
            error.message.includes('CORS') || error.message.includes('cross-origin')) {
          // CORS 错误，直接重新获取
          if (currentSong?.requestUrl) {
            onPlaySong(currentSong, currentSong.searchIndex, currentSong.quality, true);
          }
        } else {
          setIsPlaying(false);
        }
      }
    };

    let playTimeout;
    if (isPlaying) {
      // 添加错误事件监听
      const handleError = (error) => {
        console.error('Audio error:', error);
        if (currentSong?.requestUrl) {
          onPlaySong(currentSong, currentSong.searchIndex, currentSong.quality, true);
        } else {
          setIsPlaying(false);
        }
      };

      audioElement.addEventListener('error', handleError);
      
      playTimeout = setTimeout(() => {
        if (audioElement.readyState === 0) {
          if (currentSong?.requestUrl) {
            onPlaySong(currentSong, currentSong.searchIndex, currentSong.quality, true);
          } else {
            setIsPlaying(false);
          }
        }
      }, 5000);

      playWithRetry();

      return () => {
        clearTimeout(playTimeout);
        audioElement.removeEventListener('error', handleError);
      };
    } else {
      audioElement.pause();
    }
  }, [isPlaying, currentSong, onPlaySong, setIsPlaying]);

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

  const renderPlayControls = () => (
    <div className="flex items-center justify-center gap-4">
      <Button 
        type="text"
        icon={<StepBackwardOutlined />}
        onClick={playPreviousSong}
        disabled={!currentSong}
        className="hover:scale-105 transition-transform"
      />
      
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
      
      <Button 
        type="text"
        icon={<StepForwardOutlined />}
        onClick={playNextSong}
        disabled={!currentSong}
        className="hover:scale-105 transition-transform"
      />
    </div>
  );

  return (
    <motion.div 
      className="fixed left-0 right-0 bg-white/80 backdrop-blur-sm"
      variants={containerVariants}
      initial="collapsed"
      animate={expanded ? "expanded" : "collapsed"}
      transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
      style={{
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div 
            key="expanded"
            className="h-full flex flex-col p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
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
                      <motion.img 
                        src={currentSong?.cover || '/default-cover.jpg'}
                        alt={currentSong?.name}
                        className="w-full h-full object-cover"
                        variants={coverVariants}
                        animate={isPlaying ? "playing" : "paused"}
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
              
              {renderPlayControls()}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="collapsed"
            className="h-full flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* 主要内容区域 */}
            <div className="flex items-center px-3 md:px-6 gap-2 md:gap-4 h-[60px]">
              <Button 
                type="text"
                icon={<UpOutlined />}
                onClick={() => setExpanded(true)}
                className="hover:scale-105 transition-transform flex-shrink-0"
              />
              
              <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm flex-shrink-0">
                {currentSong ? (
                  <motion.img 
                    src={currentSong.cover || '/default-cover.jpg'} 
                    alt={currentSong.name}
                    className="w-full h-full object-cover"
                    variants={coverVariants}
                    animate={isPlaying ? "playing" : "paused"}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <CustomerServiceOutlined className="text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <Text className="text-sm font-medium truncate">
                    {currentSong?.name || '未播放任何歌曲'}
                  </Text>
                  {currentSong && (
                    <Button
                      type="text"
                      size="small"
                      icon={isFavorite(currentSong) ? <StarFilled /> : <StarOutlined />}
                      onClick={() => toggleFavorite(currentSong)}
                      className="flex-shrink-0 hover:scale-105 transition-transform -ml-1"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Text className="text-xs text-gray-500 truncate">
                    {currentSong?.singer || '点击播放按钮开始'}
                  </Text>
                  <Text className="text-xs text-gray-400 flex-shrink-0">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </Text>
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center">
                {renderPlayControls()}
              </div>
            </div>

            {/* 进度条区域 */}
            <div className="px-3 md:px-6 h-[20px] flex items-center">
              <ProgressSlider 
                value={currentTime}
                max={duration || 100}
                onChange={handleSliderChange}
                disabled={!currentSong}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio 
        ref={audioRef}
        src={currentSong?.url}
        crossOrigin="anonymous"
        preload="auto"
        className="hidden"
      />
    </motion.div>
  );
} 