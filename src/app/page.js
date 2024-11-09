'use client';

import { useState } from 'react';
import { Modal } from 'antd';
import { MusicProvider, useMusic } from '@/contexts/MusicContext';
import MusicContainer from '@/components/MusicContainer';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';
import RequestStatusMonitor from '@/components/RequestStatusMonitor';
import { AnimatePresence, motion } from 'framer-motion';

// 创建一个新的内部组件来使用 useMusic
function HomeContent() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const { currentSong, isPlaying } = useMusic();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-3 flex-1">
          <RequestStatusMonitor />
        </div>
        <AnimatePresence>
          {!(currentSong?.lyrics?.length && isPlaying) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="cursor-pointer hover:opacity-80"
              onClick={() => setIsAboutOpen(true)}
            >
              <h1 className="text-2xl">APIPin</h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex-1 overflow-hidden">
        <MusicContainer />
      </div>
      <GlobalAudioPlayer />
      
      <Modal
        title="APIPin"
        open={isAboutOpen}
        onCancel={() => setIsAboutOpen(false)}
        footer={null}
      >
        <div className="space-y-4">
          <p>现在是一个音乐播放器</p>
          <p>GitHub: <a href="https://github.com/MindMorbius/APIPin" className="text-blue-500 hover:underline">MindMorbius/APIPin</a></p>
        </div>
      </Modal>
    </div>
  );
}

// 主页面组件
export default function Home() {
  return (
    <MusicProvider>
      <HomeContent />
    </MusicProvider>
  );
}
