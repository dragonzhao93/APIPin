'use client';

import { useState, useEffect, useRef } from 'react';
import { Progress } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';

export default function RequestStatusMonitor() {
  const [activeRequests, setActiveRequests] = useState(0);
  const [stats, setStats] = useState({
    success: 0,
    error: 0,
    total: 0
  });
  const [messageIndex, setMessageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const autoScrollInterval = useRef(null);
  const typingTimeout = useRef(null);

  // 监听网络请求
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      setActiveRequests(prev => prev + 1);
      setStats(prev => ({...prev, total: prev.total + 1}));

      try {
        const response = await originalFetch(...args);
        setStats(prev => ({...prev, success: prev.success + 1}));
        setActiveRequests(prev => prev - 1);
        return response;
      } catch (error) {
        setStats(prev => ({...prev, error: prev.error + 1}));
        setActiveRequests(prev => prev - 1);
        throw error;
      }
    };
  }, []);

  // 计算完成进度
  const completedPercent = Math.round(((stats.success + stats.error) / stats.total) * 100) || 0;

  // 获取当前状态对应的消息数组
  const getMessageArray = () => {
    if (stats.total === 0) return ['等待用户指令...'];
    
    if (activeRequests === 0 && completedPercent === 100) {
      if (stats.error > 0) {
        return [
          '检测到系统异常...',
          '数据传输中断...',
          '遇到意外干扰...',
          '任务执行受阻...',
          '是否需要重新初始化？...'
        ];
      }
      return [
        '量子计算完成...',
        '神经网络同步成功...',
        '音频矩阵校准完毕...',
        '数据流重组完成...',
        '沉浸式音乐体验已启动...'
      ];
    }

    if (activeRequests > 2) {
      return [
        '正在进行多线程数据处理...',
        '启动量子加速传输模式...',
        '并行计算正在进行中...',
        '高速数据通道已开启...'
      ];
    }

    if (activeRequests > 0) {
      return [
        '数据流正在传输中...',
        '正在解析音频矩阵...',
        '量子解码进行中...',
        '正在建立神经网络连接...'
      ];
    }

    return [
      '最终数据校验中...',
      '系统优化即将完成...',
      '正在完成神经网络分析...',
      '数据整合即将就绪...'
    ];
  };

  // 点击切换消息
  const handleClick = () => {
    const messages = getMessageArray();
    setMessageIndex((prev) => (prev + 1) % messages.length);
  };

  // 获取当前消息
  const getMessage = () => {
    const messages = getMessageArray();
    return messages[messageIndex % messages.length];
  };

  // 获取状态颜色
  const getStatusColor = () => {
    if (activeRequests === 0 && stats.error > 0) return '#ff4d4f';
    if (activeRequests === 0 && completedPercent === 100) return '#52c41a';
    return '#1677ff';
  };

  // 打字机效果
  useEffect(() => {
    const message = getMessage();
    if (message === displayedText) return;

    setIsTyping(true);
    let index = 0;
    clearTimeout(typingTimeout.current);

    const typeText = () => {
      if (index <= message.length) {
        setDisplayedText(message.slice(0, index));
        index++;
        typingTimeout.current = setTimeout(typeText, 200);
      } else {
        setIsTyping(false);
      }
    };

    typeText();

    return () => clearTimeout(typingTimeout.current);
  }, [getMessage()]);

  // 自动滚动消息
  useEffect(() => {
    if (!isTyping) {
      autoScrollInterval.current = setInterval(() => {
        handleClick();
      }, 5000);
    }

    return () => clearInterval(autoScrollInterval.current);
  }, [isTyping]);

  return (
    <motion.div 
      className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm cursor-pointer select-none"
      whileHover={{ 
        scale: 1.02,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
      whileTap={{ scale: 0.98 }}
      animate={{ 
        scale: [1, 1.02, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={handleClick}
      onHoverStart={() => {
        setIsHovered(true);
        clearInterval(autoScrollInterval.current);
      }}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.div
        animate={activeRequests > 0 ? { rotate: 360 } : { rotate: 0 }}
        transition={activeRequests > 0 ? { 
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        } : { duration: 0.3 }}
      >
        <Progress 
          type="circle"
          percent={completedPercent}
          size={24}
          strokeWidth={6}
          status={activeRequests > 0 ? "active" : "normal"}
          strokeColor={{
            '0%': getStatusColor(),
            '100%': getStatusColor(),
          }}
          showInfo={false}
        />
      </motion.div>

      <div className="flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={getMessage()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-gray-600 max-w-[200px] truncate"
          >
            {displayedText}
            {isTyping && (
              <motion.span
                animate={{ opacity: [0, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                |
              </motion.span>
            )}
          </motion.div>
        </AnimatePresence>

        <motion.span 
          className="text-xs text-gray-400"
          animate={{ opacity: isHovered ? 0.8 : 0.6 }}
        >
          {stats.total > 0 ? 
            `任务进度 ${completedPercent}%` : 
            '任务系统已就绪'
          }
        </motion.span>
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-1/2 -bottom-8 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap bg-white/90 px-2 py-1 rounded-md shadow-sm"
          >
            点击切换状态消息
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 