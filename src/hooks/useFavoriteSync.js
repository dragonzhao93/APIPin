'use client';

import { useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function useFavoriteSync() {
  const [favorites, setFavorites] = useLocalStorage('favorites', []);
  const [favoriteMap, setFavoriteMap] = useState(new Map());

  // 更新收藏映射
  useEffect(() => {
    const map = new Map();
    favorites.forEach(song => {
      const key = `${song.name}-${song.singer}-${song.platform}`;
      map.set(key, song);
    });
    setFavoriteMap(map);
  }, [favorites]);

  // 检查是否已收藏
  const isFavorite = (song) => {
    if (!song) return false;
    const key = `${song.name}-${song.singer}-${song.platform}`;
    return favoriteMap.has(key);
  };

  // 收藏/取消收藏 - 完全复制或删除
  const toggleFavorite = (song) => {
    if (!song) return;
    const key = `${song.name}-${song.singer}-${song.platform}`;
    
    setFavorites(prev => {
      if (favoriteMap.has(key)) {
        // 直接删除匹配的条目
        return prev.filter(s => 
          !(s.name === song.name && s.singer === song.singer && s.platform === song.platform)
        );
      } else {
        // 完整复制歌曲数据
        return [...prev, { ...song }];
      }
    });
  };

  return {
    favorites,
    isFavorite,
    toggleFavorite
  };
} 