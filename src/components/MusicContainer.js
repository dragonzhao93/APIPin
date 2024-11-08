'use client';

import { useMusic } from '@/contexts/MusicContext';
import SearchPanel from './SearchPanel';
import PlayList from './PlayList';
import { SearchOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useRef } from 'react';
import { Input } from 'antd';

export default function MusicContainer() {
  const { view, setView, searchTerm, setSearchTerm, onSearch } = useMusic();
  const swiperRef = useRef(null);

  const handleViewChange = (newView) => {
    setView(newView);
    if (swiperRef.current) {
      swiperRef.current.slideTo(newView === 'search' ? 0 : 1);
    }
  };

  return (
    <div className="h-full flex flex-col px-4 pb-4">
      <div className="inline-flex p-1 bg-gray-100 rounded-full mx-auto mb-6">
        <button
          className={`
            px-6 py-2 rounded-full text-sm font-medium transition-all duration-200
            flex items-center gap-2
            ${view === 'search' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
          onClick={() => handleViewChange('search')}
        >
          <SearchOutlined /> 搜索
        </button>
        <button
          className={`
            px-6 py-2 rounded-full text-sm font-medium transition-all duration-200
            flex items-center gap-2
            ${view === 'list' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
          onClick={() => handleViewChange('list')}
        >
          <UnorderedListOutlined /> 收藏
        </button>
      </div>

      {view === 'search' && (
        <div className="mb-4">
          <Input.Search
            placeholder="搜索歌曲"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={onSearch}
            enterButton
            className="flex-grow"
          />
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <Swiper
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          initialSlide={view === 'search' ? 0 : 1}
          onSlideChange={(swiper) => setView(swiper.activeIndex === 0 ? 'search' : 'list')}
          className="h-full"
          touchEventsTarget="wrapper"
          touchRatio={1}
          touchAngle={45}
          longSwipes={true}
          longSwipesRatio={0.5}
          threshold={5}
        >
          <SwiperSlide className="h-full overflow-y-auto">
            <div className="pb-[80px]">
              <SearchPanel showSearchInput={false} />
            </div>
          </SwiperSlide>
          <SwiperSlide className="h-full overflow-y-auto">
            <div className="pb-[80px]">
              <PlayList />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
} 