'use client';

import { List, Button, Empty } from 'antd';
import { PlayCircleOutlined, DeleteOutlined, ClearOutlined } from '@ant-design/icons';
import { useMusic } from '@/contexts/MusicContext';
import { PlatformTag } from './PlayList'; // 复用 PlayList 中的标签组件

export default function PlayQueue({ onClose }) {
  const { 
    currentSong,
    onPlaySong,
    setCurrentSong,
    setIsPlaying,
    playQueue,
    toggleQueue,
    clearQueue
  } = useMusic();

  const handlePlay = (song) => {
    if (song.url) {
      // 如果有 url，直接播放
      setCurrentSong(song);
      setIsPlaying(true);
    } else {
      onPlaySong(song, song.searchIndex, song.quality);
    }
    onClose?.();
  };

  if (!playQueue.length) {
    return (
      <Empty description="播放清单为空" className="my-8" />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 px-4">
        <span className="text-sm text-gray-500">共 {playQueue.length} 首歌曲</span>
        <Button 
          type="text" 
          icon={<ClearOutlined />}
          onClick={clearQueue}
          size="small"
          danger
        >
          清空
        </Button>
      </div>

      <List
        className="flex-1 overflow-y-auto custom-scrollbar px-4"
        itemLayout="horizontal"
        dataSource={playQueue}
        renderItem={(song) => (
          <List.Item
            className={`
              hover:bg-gray-50/50 rounded-lg transition-colors duration-200
              ${currentSong?.name === song.name ? 'bg-blue-50/50' : ''}
            `}
            actions={[
              <Button 
                key="play"
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handlePlay(song)}
              />,
              <Button
                key="delete"
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => toggleQueue(song)}
              />
            ]}
          >
            <List.Item.Meta
              title={
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{song.name}</span>
                  <PlatformTag platform={song.platform} />
                </div>
              }
              description={<div className="text-xs">{song.singer}</div>}
            />
          </List.Item>
        )}
      />
    </div>
  );
} 