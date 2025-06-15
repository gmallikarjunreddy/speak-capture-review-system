import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRecording } from '@/hooks/useRecording';
import { ProgressDisplay } from '@/components/recording/ProgressDisplay';
import { SentenceDisplay } from '@/components/recording/SentenceDisplay';
import { RecordingControls } from '@/components/recording/RecordingControls';
import { HeaderActions } from '@/components/recording/HeaderActions';
import { Header } from '@/components/Header';

const Recording = () => {
  const [sentences, setSentences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSentences = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('sentences')
        .select('*')
        .eq('is_active', true)
        .order('created_at');
      
      if (data) {
        setSentences(data);
      }
      setIsLoading(false);
    };

    fetchSentences();
  }, []);

  const {
    currentIndex,
    isRecording,
    isPlaying,
    audioUrl,
    audioRef,
    startRecording,
    stopRecording,
    playRecording,
    acceptRecording,
    rejectRecording,
    skipSentence,
    previousSentence,
    isPreviousDisabled,
  } = useRecording(sentences);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Header className="mb-4" />
        <HeaderActions />

        <ProgressDisplay 
          currentIndex={currentIndex}
          totalSentences={sentences.length}
        />

        <SentenceDisplay sentence={sentences[currentIndex]} />

        <RecordingControls
          isRecording={isRecording}
          startRecording={startRecording}
          stopRecording={stopRecording}
          audioUrl={audioUrl}
          audioRef={audioRef}
          isPlaying={isPlaying}
          playRecording={playRecording}
          acceptRecording={acceptRecording}
          rejectRecording={rejectRecording}
          skipSentence={skipSentence}
          isSkipDisabled={currentIndex + 1 >= sentences.length}
          previousSentence={previousSentence}
          isPreviousDisabled={isPreviousDisabled}
        />
      </div>
    </div>
  );
};

export default Recording;
