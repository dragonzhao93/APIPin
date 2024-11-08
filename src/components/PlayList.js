'use client';

import { useMusic } from '@/contexts/MusicContext';
import { List, Button, Empty, Tabs, Tag } from 'antd';
import { 
  PlayCircleOutlined, 
  DeleteOutlined, 
  StarOutlined, 
  StarFilled 
} from '@ant-design/icons';

// 平台标签组件
const PlatformTag = ({ platform }) => {
  if (platform === 'qq') {
    return (
      <Tag color="blue" className="whitespace-nowrap">QQ音乐</Tag>
    );
  }
  return (
    <Tag color="green" className="whitespace-nowrap">网易云</Tag>
  );
};

// 付费标签组件
const PaymentTag = ({ payType }) => {
  if (!payType) return null;
  
  const getPaymentStyle = (type) => {
    switch (type) {
      case '付费':
        return { color: '#ff4d4f', borderColor: '#ff4d4f' };
      case '免费':
        return { color: '#52c41a', borderColor: '#52c41a' };
      default:
        return { color: '#faad14', borderColor: '#faad14' };
    }
  };

  return (
    <Tag 
      className="rounded-full text-xs border px-2 py-0.5"
      style={getPaymentStyle(payType)}
      bordered
    >
      {payType}
    </Tag>
  );
};

export default function PlayList() {
  const { 
    playHistory,
    favorites,
    removeFromHistory,
    toggleFavorite,
    isFavorite,
    onPlaySong,
    selectedQuality 
  } = useMusic();

  const renderSongList = (songs, isHistory = false) => {
    if (!songs.length) {
      return (
        <Empty 
          description={isHistory ? "暂无播放记录" : "暂无收藏歌曲"} 
          className="mt-8"
        />
      );
    }

    return (
      <List
        className="overflow-y-auto custom-scrollbar"
        style={{ maxHeight: 'calc(100vh - 240px)' }}
        itemLayout="horizontal"
        dataSource={songs}
        renderItem={(song, index) => (
          <List.Item
            className="hover:bg-gray-50/50 rounded-lg transition-colors duration-200"
            actions={[
              <Button 
                key="play"
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => onPlaySong(song, index, selectedQuality)}
                className="flex items-center !px-2"
              />,
              isHistory ? (
                <Button
                  key="favorite"
                  type="text"
                  size="small"
                  icon={isFavorite(song) ? <StarFilled /> : <StarOutlined />}
                  onClick={() => toggleFavorite(song)}
                  className="flex items-center !px-2"
                />
              ) : (
                <Button
                  key="unfavorite"
                  type="text"
                  size="small"
                  danger
                  icon={<StarFilled />}
                  onClick={() => toggleFavorite(song)}
                  className="flex items-center !px-2"
                />
              ),
              isHistory && (
                <Button
                  key="delete"
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeFromHistory(song)}
                  className="flex items-center !px-2"
                />
              )
            ].filter(Boolean)}
          >
            <List.Item.Meta
              title={
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{song.name}</span>
                  <PlatformTag platform={song.platform} />
                  {song.details && <PaymentTag payType={song.details.pay} />}
                </div>
              }
              description={<span className="text-xs">{song.singer}</span>}
            />
          </List.Item>
        )}
      />
    );
  };

  return (
    <Tabs
      defaultActiveKey="history"
      items={[
        {
          key: 'history',
          label: '播放历史',
          children: renderSongList(playHistory, true)
        },
        {
          key: 'favorites',
          label: '收藏列表',
          children: renderSongList(favorites)
        }
      ]}
    />
  );
} 