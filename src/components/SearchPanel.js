'use client';

import { Input, Button, List, Select, Tag } from 'antd';
import { SearchOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';

const QUALITY_OPTIONS = [
  { value: 9, label: '杜比全景声' },
  { value: 12, label: '臻品2.0' },
  { value: 13, label: '臻品全景声' },
  { value: 14, label: 'SQ无损音质' }
];

// 添加平台特性标签
const PlatformFeatureTag = ({ platform }) => {
  if (platform === 'qq') {
    return (
      <Tag color="blue" className="ml-2 whitespace-nowrap">
        QQ音乐 <span className="text-xs opacity-75">可选音质</span>
      </Tag>
    );
  }
  return (
    <Tag color="green" className="ml-2 whitespace-nowrap">
      网易云 <span className="text-xs opacity-75">含歌词</span>
    </Tag>
  );
};

export default function SearchPanel({ 
  searchTerm,
  setSearchTerm,
  songs,
  onSearch,
  onPlaySong
}) {
  const [selectedQuality, setSelectedQuality] = useState(12);

  // 计算每个歌曲在其平台中的序号
  const getPlatformIndex = (song, index) => {
    return songs
      .slice(0, index + 1)
      .filter(s => s.platform === song.platform)
      .length;
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input.Search
          placeholder="搜索歌曲"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={onSearch}
          enterButton
          className="flex-grow"
        />
      </div>

      <List
        className="overflow-y-auto custom-scrollbar"
        style={{ 
          maxHeight: 'calc(100vh - 240px)',
          paddingRight: '8px'
        }}
        itemLayout="horizontal"
        dataSource={songs}
        renderItem={(song, index) => (
          <List.Item 
            className="hover:bg-gray-50/50 rounded-lg transition-colors duration-200 flex-col items-start"
          >
            {/* 上部分：歌曲信息和来源 */}
            <div className="w-full flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                {/* 歌曲名称可换行显示 */}
                <div className="text-base mb-1 break-words pr-4">
                  {song.name}
                </div>
                <div className="text-sm text-gray-500">
                  {song.singer}
                </div>
              </div>
              
              {/* 使用新的平台特性标签组件 */}
              <PlatformFeatureTag platform={song.platform} />
            </div>

            {/* 下部分：音质选择和播放按钮 */}
            <div className="w-full flex justify-end items-center gap-2 mt-1">
              {/* 音质选择在左 */}
              {song.platform === 'qq' && (
                <Select 
                  size="small"
                  value={selectedQuality}
                  onChange={(value) => setSelectedQuality(value)}
                  className="w-24"
                  bordered={false}
                  dropdownMatchSelectWidth={false}
                  options={QUALITY_OPTIONS}
                />
              )}

              {/* 播放按钮在右 */}
              <Button 
                type="text" 
                icon={<PlayCircleOutlined />} 
                onClick={() => onPlaySong(song, getPlatformIndex(song, index) - 1, selectedQuality)}
              >
                播放
              </Button>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
} 