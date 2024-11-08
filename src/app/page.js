import { MusicProvider } from '@/contexts/MusicContext';
import MusicContainer from '@/components/MusicContainer';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';

export default function Home() {
  return (
    <MusicProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <h1 className="text-2xl p-4">APIPin | 真的能听歌</h1>
        <div className="flex-1 overflow-hidden">
          <MusicContainer />
        </div>
        <GlobalAudioPlayer />
      </div>
    </MusicProvider>
  );
}
