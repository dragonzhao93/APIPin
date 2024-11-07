import MusicPlayer from '@/components/MusicPlayer';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">音乐搜索播放器</h1>
      <MusicPlayer />
    </div>
  );
}
