'use client';

import { Input, Button, List, Select } from 'antd';
import { SearchOutlined, PlayCircleOutlined } from '@ant-design/icons';

export default function SearchPanel({ 
  searchTerm,
  setSearchTerm,
  platform,
  setPlatform,
  quality,
  setQuality,
  songs,
  onSearch,
  onPlaySong
}) {
  return (
    <div className="w-full">
      <div className="search-container flex flex-col sm:flex-row gap-2 mb-4">
        <Input 
          placeholder="搜索歌曲" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
          className="flex-grow"
        />
        <div className="flex gap-2">
          <Select 
            value={platform} 
            onChange={setPlatform}
            className="w-24"
          >
            <Select.Option value="wy">网易云</Select.Option>
            <Select.Option value="qq">QQ音乐</Select.Option>
          </Select>
          {platform === 'qq' && (
            <Select 
              value={quality} 
              onChange={setQuality}
              className="w-20"
            >
              {[...Array(14)].map((_, i) => (
                <Select.Option key={i+1} value={i+1}>
                  音质 {i+1}
                </Select.Option>
              ))}
            </Select>
          )}
          <Button onClick={onSearch}>搜索</Button>
        </div>
      </div>

      <List
        className="overflow-y-auto max-h-[calc(100vh-200px)]"
        itemLayout="horizontal"
        dataSource={songs}
        renderItem={(song, index) => (
          <List.Item 
            actions={[
              <Button 
                key={`play-${index}`}
                type="text" 
                icon={<PlayCircleOutlined />} 
                onClick={() => onPlaySong(song, index)}
              >
                播放
              </Button>
            ]}
          >
            <List.Item.Meta
              title={platform === 'qq' ? song.song : song.name}
              description={platform === 'qq' ? song.singer : song.singer}
            />
          </List.Item>
        )}
      />
    </div>
  );
} 