'use client';

import { useMusic } from '@/contexts/MusicContext';
import SearchPanel from './SearchPanel';
import PlayList from './PlayList';
import { SearchOutlined, UnorderedListOutlined, PlaySquareOutlined } from '@ant-design/icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useRef } from 'react';
import { Input } from 'antd';
import PlayQueue from './PlayQueue';

export default function MusicContainer() {
  const { view, setView, searchTerm, setSearchTerm, onSearch } = useMusic();
  const swiperRef = useRef(null);

  const handleViewChange = (newView) => {
    setView(newView);
    if (swiperRef.current) {
      const slideIndex = {
        'search': 0,
        'list': 1,
        'queue': 2
      }[newView];
      swiperRef.current.slideTo(slideIndex);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative">
        <Swiper
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          initialSlide={view === 'search' ? 0 : view === 'list' ? 1 : 2}
          onSlideChange={(swiper) => {
            const views = ['search', 'list', 'queue'];
            setView(views[swiper.activeIndex]);
          }}
          className="h-full"
          touchEventsTarget="wrapper"
          noSwiping={true}
          noSwipingClass="ant-select-dropdown"
        >
          <SwiperSlide>
            <div 
              className="h-full overflow-y-auto px-4" 
              style={{ paddingBottom: 'calc(200px + env(safe-area-inset-bottom))' }}
            >
              <SearchPanel showSearchInput={false} />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div 
              className="h-full overflow-y-auto px-4" 
              style={{ paddingBottom: 'calc(200px + env(safe-area-inset-bottom))' }}
            >
              <PlayList />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div 
              className="h-full overflow-y-auto px-4" 
              style={{ paddingBottom: 'calc(200px + env(safe-area-inset-bottom))' }}
            >
              <PlayQueue />
            </div>
          </SwiperSlide>
        </Swiper>

        {/* 悬浮搜索框 */}
        {view === 'search' && (
          <div className="fixed left-0 right-0 bottom-[180px] px-4 z-10">
            <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-2">
              <Input.Search
                placeholder="搜索歌曲"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={onSearch}
                enterButton
                className="flex-grow"
              />
            </div>
          </div>
        )}

        {/* 悬浮切换按钮 */}
        <div className="fixed bottom-[100px] right-4 z-10">
          <div className="inline-flex p-1.5 bg-white/80 backdrop-blur-md shadow-lg rounded-2xl">
            <button
              className={`
                px-6 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${view === 'search' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}
              `}
              onClick={() => handleViewChange('search')}
            >
              <SearchOutlined /> 搜索
            </button>
            <button
              className={`
                px-6 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${view === 'list' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}
              `}
              onClick={() => handleViewChange('list')}
            >
              <UnorderedListOutlined /> 列表
            </button>
            <button
              className={`
                px-6 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${view === 'queue' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}
              `}
              onClick={() => handleViewChange('queue')}
            >
              <PlaySquareOutlined /> 清单
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 