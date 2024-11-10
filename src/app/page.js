'use client';

import { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { MusicProvider, useMusic } from '@/contexts/MusicContext';
import MusicContainer from '@/components/MusicContainer';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';
import RequestStatusMonitor from '@/components/RequestStatusMonitor';
import { AnimatePresence, motion } from 'framer-motion';

// 添加 Cookie 工具函数
const setCookie = (name, value, days = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// 创建一个新的内部组件来使用 useMusic
function HomeContent() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [hasAgreed, setHasAgreed] = useState(false);
  const { currentSong, isPlaying } = useMusic();

  useEffect(() => {
    // 改用 Cookie 检查同意状态
    const agreed = getCookie('disclaimer_agreed');
    setHasAgreed(!!agreed);
    
    if (!agreed) {
      setIsAboutOpen(true);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, []);

  const handleAgree = () => {
    // 改用 Cookie 存储同意状态
    setCookie('disclaimer_agreed', 'true');
    setHasAgreed(true);
    setIsAboutOpen(false);
  };

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
              className="cursor-pointer hover:opacity-80 text-right"
              onClick={() => setIsAboutOpen(true)}
            >
              <div className="text-xs text-gray-500 mb-1">
                {hasAgreed ? '已同意免责声明' : '使用前请点击查看免责声明'}
              </div>
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
        title="免责声明 | Disclaimer"
        open={isAboutOpen}
        onCancel={() => setIsAboutOpen(false)}
        footer={[
          <button
            key="agree"
            onClick={handleAgree}
            className={`w-full py-2 text-white rounded-lg mt-4 ${
              hasAgreed 
                ? 'bg-green-500 cursor-default' 
                : countdown > 0 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
            }`}
            disabled={!hasAgreed && countdown > 0}
          >
            {hasAgreed 
              ? '已同意' 
              : countdown > 0 
                ? `请仔细阅读 (${countdown}s)` 
                : '我已阅读并同意上述声明'
            }
          </button>
        ]}
        width={600}
        maskClosable={hasAgreed}
        closable={hasAgreed}
      >
        <div className="space-y-4">
          <div className="p-6 bg-red-50 border-2 border-red-300 rounded-lg">
            <h3 className="font-bold text-red-800 text-lg mb-3">重要免责声明</h3>
            <div className="space-y-3 text-red-700">
              <p>1. 本站仅作为API接口测试和技术学习交流使用，不提供任何音乐存储、下载或付费服务。</p>
              <p>2. 本站对展示内容的来源不知情，也不对内容的合法性、准确性负责。所有内容版权归版权方所有。</p>
              <p>3. <strong>继续使用本站即表示您已完全理解并接受</strong>：本站仅供技术研究，若因使用本站造成任何法律纠纷，本项目开发人员概不负责。</p>
              <p>4. 如果您不同意以上声明，请立即停止使用本站。</p>
              <p>5. 请支持正版音乐，尊重知识产权。</p>
            </div>
          </div>
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
