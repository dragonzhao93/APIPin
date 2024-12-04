"use client";

import { useState, useEffect } from "react";
import { Modal } from "antd";
import { MusicProvider, useMusic } from "@/contexts/MusicContext";
import MusicContainer from "@/components/MusicContainer";
import GlobalAudioPlayer from "@/components/GlobalAudioPlayer";
import RequestStatusMonitor from "@/components/RequestStatusMonitor";
import { AnimatePresence, motion } from "framer-motion";

// 添加 Cookie 工具函数
const setCookie = (name, value, days = 365) => {
	const expires = new Date();
	expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
	document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name) => {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop().split(";").shift();
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
		const agreed = getCookie("disclaimer_agreed");
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
		setCookie("disclaimer_agreed", "true");
		setHasAgreed(true);
		setIsAboutOpen(false);
	};

	return (
		<div className="h-screen flex flex-col overflow-hidden">
			<div className="flex justify-between items-center p-4">
				<div className="flex items-center gap-3 flex-1">
					<RequestStatusMonitor />
				</div>
			</div>
			<div className="flex-1 overflow-hidden">
				<MusicContainer />
			</div>
			<GlobalAudioPlayer />
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
