"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { message } from "antd";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useFavoriteSync } from "@/hooks/useFavoriteSync";
import { usePlayQueue } from "@/hooks/usePlayQueue";

const MusicContext = createContext(null);

const CURRENT_SONG_KEY = "currentPlayingSong";

export function MusicProvider({ children }) {
	const [searchTerm, setSearchTerm] = useState("");
	const [songs, setSongs] = useState([]);
	const [currentSong, setCurrentSong] = useState(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [view, setView] = useState("search");
	const [selectedQuality, setSelectedQuality] = useState(5); // 默认标准音质
	const [playHistory, setPlayHistory] = useLocalStorage("playHistory", []);
	const { favorites, isFavorite, toggleFavorite } = useFavoriteSync();
	const [isSearching, setIsSearching] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const {
		queue: playQueue,
		isInQueue,
		toggleQueue,
		clearQueue,
		getNextSong,
		getPreviousSong,
	} = usePlayQueue();
	const audioRef = useRef(null);
	const messageShownRef = useRef(false);
	const abortControllerRef = useRef(null);

	// 初始化时从 localStorage 读取上次播放的歌曲
	useEffect(() => {
		// 如果消息已经显示过，直接返回
		if (messageShownRef.current) return;

		try {
			const savedSong = localStorage.getItem(CURRENT_SONG_KEY);
			if (savedSong) {
				const parsedSong = JSON.parse(savedSong);
				setCurrentSong(parsedSong);
				// 使用 ref 来确保消息只显示一次
				if (!messageShownRef.current) {
					message.info(
						`上次播放: ${parsedSong.name} - ${parsedSong.singer}`,
						3
					);
					messageShownRef.current = true;
				}
			}
		} catch (error) {
			console.error("Failed to load last playing song:", error);
		}
	}, []); // 只在组件挂载时执行一次

	// 当 currentSong 改变时保存到 localStorage
	useEffect(() => {
		if (!currentSong) return;

		try {
			localStorage.setItem(CURRENT_SONG_KEY, JSON.stringify(currentSong));
		} catch (error) {
			console.error("Failed to save current song:", error);
		}
	}, [currentSong]);

	// 添加 URL 格式化函数
	const formatRequestUrl = (song, searchTerm = "", index = 0) => {
		// 如果没有 requestUrl，根据平台构建
		if (!song.requestUrl) {
			const term = encodeURIComponent(
				searchTerm || `${song.name} ${song.singer}`
			);
			return song.platform === "qq"
				? `?platform=${platform}&term=${term}&index=${index}`
				: `?platform=wy&term=${term}&index=${index}`;
		}

		// 处理旧格式 URL
		if (isOldRequestUrl(song.requestUrl)) {
			const url = new URL(song.requestUrl, "http://example.com");
			const term =
				url.searchParams.get("term") || `${song.name} ${song.singer}`;
			const n = url.searchParams.get("n") || index;
			return song.platform === "qq"
				? `?platform=qq&term=${encodeURIComponent(term)}&index=${n}`
				: `?platform=wy&term=${encodeURIComponent(term)}&index=${n}`;
		}

		// 已经是新格式，但可能缺少参数
		try {
			const url = new URL(song.requestUrl, "http://example.com");
			const term =
				url.searchParams.get(song.platform === "qq" ? "word" : "msg") ||
				`${song.name} ${song.singer}`;
			const n = url.searchParams.get("n") || index;

			return song.platform === "qq"
				? `?platform=qq&term=${encodeURIComponent(term)}&index=${n}`
				: `?platform=term=${encodeURIComponent(term)}&index=${n}`;
		} catch {
			// URL 解析失败，创建新的
			const term = encodeURIComponent(`${song.name} ${song.singer}`);
			return song.platform === "qq"
				? `?platform=qq&term=${term}&index=${index || 1}`
				: `?platform=term=${term}&index=${index || 1}`;
		}
	};

	// 修改 addToHistory 函数
	const addToHistory = (song) => {
		setPlayHistory((prev) => {
			const filtered = prev.filter(
				(s) =>
					!(
						s.name === song.name &&
						s.singer === song.singer &&
						s.platform === song.platform
					)
			);

			const updatedSong = {
				...song,
				requestUrl: formatRequestUrl(song, searchTerm, song.searchIndex),
			};

			return [updatedSong, ...filtered].slice(0, 50);
		});
	};

	// 从播放历史中删除
	const removeFromHistory = (song) => {
		setPlayHistory((prev) =>
			prev.filter(
				(s) =>
					!(
						s.name === song.name &&
						s.singer === song.singer &&
						s.platform === song.platform
					)
			)
		);
	};

	// 搜索功能
	const onSearch = async () => {
		if (!searchTerm.trim()) return;
		setIsSearching(true);
		try {
			const [{ data: wyResult }, { data: qqResult }] = await Promise.all([
				fetch(
					`/api/sby?platform=wy&term=${encodeURIComponent(searchTerm)}`
				).then((r) => r.json()),
				fetch(
					`/api/sby?platform=qq&term=${encodeURIComponent(searchTerm)}`
				).then((r) => r.json()),
			]);

			const combinedSongs = [];

			if (wyResult.code === 200) {
				combinedSongs.push(
					...wyResult.data.map((song, index) => ({
						...song,
						platform: "wy",
						name: song.name || song.song,
						singer: song.singer || song.author,
						searchIndex: index,
						requestUrl: `/wydg/?msg=${encodeURIComponent(searchTerm)}&index=${
							index + 1
						}`,
					}))
				);
			}

			if (qqResult.code === 200) {
				const qqSongs = Array.isArray(qqResult.data)
					? qqResult.data
					: [qqResult.data];
				combinedSongs.push(
					...qqSongs.map((song, index) => ({
						...song,
						platform: "qq",
						name: song.song,
						singer: song.singer,
						searchIndex: index,
						requestUrl: `/qqdg/?word=${encodeURIComponent(searchTerm)}&index=${
							index + 1
						}`,
					}))
				);
			}
			console.log(combinedSongs, "combinedSongs");
			setSongs(interleaveResults(combinedSongs));
		} catch (error) {
			message.error("搜索失败");
			console.error(error);
		} finally {
			setIsSearching(false);
		}
	};

	// 修改 onPlaySong 函数
	const onPlaySong = async (
		song,
		index,
		quality,
		isRetry = false,
		fromSearch = false
	) => {
		if (isLoading && !isRetry) return;
		// 如果有 URL 且不是重试，直接播放
		if (song.url && !isRetry) {
			setCurrentSong(song);
			setIsPlaying(true);
			return;
		}

		const currentController = new AbortController();
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		abortControllerRef.current = currentController;

		setIsLoading(true);
		try {
			// 格式化 requestUrl
			const formattedRequestUrl = formatRequestUrl(song, searchTerm, index);
			const requestUrl = `/api/sby${formattedRequestUrl}${
				quality ? `&quality=${quality}` : ""
			}`;

			const timeoutId = setTimeout(() => {
				currentController.abort();
			}, 10000);

			const response = await fetch(requestUrl, {
				signal: currentController.signal,
			});

			clearTimeout(timeoutId);

			const { data } = await response.json();

			if (data.code === 200) {
				const updatedSong = {
					...song,
					id: data.data?.id || song.id,
					url: song.platform === "qq" ? data.data.url : data.mp3,
					cover: song.platform === "qq" ? data.data.cover : data.img,
					lyrics: song.platform === "qq" ? [] : data.lyric || [],
					searchTerm: song.searchTerm || searchTerm,
					searchIndex: song.searchIndex || index,
					details: song.platform === "qq" ? data.data : null,
					requestUrl: formattedRequestUrl,
					quality: quality,
				};

				if (!updatedSong.url || !isValidUrl(updatedSong.url)) {
					throw new Error("无效的音频 URL");
				}

				updateSongData(updatedSong);
				setCurrentSong(updatedSong);
				setIsPlaying(isRetry ? isPlaying : true);
				addToHistory(updatedSong);
			} else {
				throw new Error(data.msg || "获取歌曲详情失败");
			}
		} catch (error) {
			if (error.name === "AbortError") {
				message.error("请求超时，播放失败");
			} else if (
				error.name === "SecurityError" ||
				error.message.includes("CORS")
			) {
				message.error("音频加载失败，请尝试其他歌曲");
			} else {
				message.error(error.message || "播放失败，请尝试其他歌曲");
			}
			setIsPlaying(false);
		} finally {
			if (currentController.signal.aborted) {
				abortControllerRef.current = null;
			}
			setIsLoading(false);
		}
	};

	// 更新所有相关列表中的歌曲数据
	const updateSongData = (updatedSong) => {
		// 更新播放历史 - 使用完全匹配
		setPlayHistory((prev) =>
			prev.map((song) =>
				isSameSong(song, updatedSong) &&
				song.requestUrl === updatedSong.requestUrl
					? { ...updatedSong }
					: song
			)
		);

		// 更新播放队列 - 使用完全匹配
		if (
			playQueue.some(
				(song) =>
					isSameSong(song, updatedSong) &&
					song.requestUrl === updatedSong.requestUrl
			)
		) {
			toggleQueue(updatedSong);
			toggleQueue(updatedSong);
		}

		// 搜索结果不需要更新
		// 删除 setSongs 的更新
	};

	// 修改判断是否为同一首歌的逻辑
	const isSameSong = (song1, song2) => {
		return (
			song1.name === song2.name &&
			song1.singer === song2.singer &&
			song1.platform === song2.platform &&
			(!song1.requestUrl ||
				!song2.requestUrl ||
				song1.requestUrl === song2.requestUrl)
		);
	};

	// 修改音质选择处理函数
	const handleQualityChange = (quality) => {
		setSelectedQuality(quality);
	};

	// 监听歌曲播放结束,自动播放下一首
	useEffect(() => {
		if (!isPlaying && currentSong && !isLoading && audioRef.current?.ended) {
			debugger;
			const nextSong = getNextSong(currentSong);
			if (nextSong) {
				if (nextSong.url) {
					setCurrentSong(nextSong);
					setIsPlaying(true);
				} else {
					onPlaySong(nextSong, nextSong.searchIndex, selectedQuality);
				}
			}
		}
	}, [isPlaying, currentSong, isLoading]);

	const playPreviousSong = () => {
		if (!currentSong) return;
		const previousSong = getPreviousSong(currentSong);
		if (previousSong) {
			if (previousSong.url) {
				setCurrentSong(previousSong);
				setIsPlaying(true);
			} else {
				onPlaySong(previousSong, previousSong.searchIndex, selectedQuality);
			}
		}
	};

	const playNextSong = () => {
		if (!currentSong) return;
		const nextSong = getNextSong(currentSong);
		if (nextSong) {
			if (nextSong.url) {
				setCurrentSong(nextSong);
				setIsPlaying(true);
			} else {
				onPlaySong(nextSong, nextSong.searchIndex, selectedQuality);
			}
		}
	};

	const value = {
		searchTerm,
		setSearchTerm,
		songs,
		setSongs,
		currentSong,
		setCurrentSong,
		isPlaying,
		setIsPlaying,
		view,
		setView,
		selectedQuality,
		setSelectedQuality: handleQualityChange,
		onSearch,
		onPlaySong,
		playHistory,
		favorites,
		isFavorite,
		removeFromHistory,
		toggleFavorite,
		isSearching,
		isLoading,
		playQueue,
		isInQueue,
		toggleQueue,
		clearQueue,
		playPreviousSong,
		playNextSong,
		audioRef,
		addToHistory,
	};

	return (
		<MusicContext.Provider value={value}>{children}</MusicContext.Provider>
	);
}

// 辅助函数
function interleaveResults(songs) {
	const interleavedSongs = [];
	const maxLength = Math.max(
		songs.filter((s) => s.platform === "wy").length,
		songs.filter((s) => s.platform === "qq").length
	);

	for (let i = 0; i < maxLength; i++) {
		const wySong = songs.find(
			(s, index) =>
				s.platform === "wy" &&
				songs.filter((x) => x.platform === "wy").indexOf(s) === i
		);
		const qqSong = songs.find(
			(s, index) =>
				s.platform === "qq" &&
				songs.filter((x) => x.platform === "qq").indexOf(s) === i
		);

		if (wySong) interleavedSongs.push(wySong);
		if (qqSong) interleavedSongs.push(qqSong);
	}
	return interleavedSongs;
}

function extractQQDetails(data) {
	return {
		pay: data.pay,
		time: data.time,
		bpm: data.bpm,
		quality: data.quality,
		interval: data.interval,
		size: data.size,
		kbps: data.kbps,
	};
}

function formatSongData(data, platform, originalSong) {
	return platform === "qq"
		? {
				name: data.data.song,
				singer: data.data.singer,
				url: data.data.url,
				cover: data.data.cover,
				lyrics: [],
				platform,
				details: originalSong?.details,
				requestUrl: originalSong?.requestUrl,
		  }
		: {
				name: data.name,
				singer: data.author,
				url: data.mp3,
				cover: data.img,
				lyrics: data.lyric || [],
				platform,
				details: originalSong?.details,
				requestUrl: originalSong?.requestUrl,
		  };
}

export const useMusic = () => {
	const context = useContext(MusicContext);
	if (!context) {
		throw new Error("useMusic must be used within a MusicProvider");
	}
	return context;
};

// 添加 URL 验证辅助函数
function isValidUrl(url) {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

// 在 MusicProvider 中添加辅助函数
const isOldRequestUrl = (url) => {
	return url?.startsWith("/api/sby");
};
