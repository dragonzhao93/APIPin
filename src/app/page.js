import MusicPlayer from '@/components/MusicPlayer';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">APIPin | 音乐播放器</h1>
      <MusicPlayer />
    </div>
  );
}
