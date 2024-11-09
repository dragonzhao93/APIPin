'use client';

import { useState } from 'react';
import { Modal } from 'antd';
import { MusicProvider } from '@/contexts/MusicContext';
import MusicContainer from '@/components/MusicContainer';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';
import RequestStatusMonitor from '@/components/RequestStatusMonitor';

export default function Home() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <MusicProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <RequestStatusMonitor />
          </div>
          <div 
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsAboutOpen(true)}
          >
            <h1 className="text-2xl">APIPin</h1>
          </div>
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
    </MusicProvider>
  );
}
