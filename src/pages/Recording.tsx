
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { useRecording } from '@/hooks/useRecording';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Mic, Play, Square, Check, X, SkipForward, ChevronLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Recording = () => {
  const { user } = useAuth();
  const [sentences, setSentences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  useEffect(() => {
    const fetchSentences = async () => {
      try {
        const data = await apiClient.getSentences();
        setSentences(data);
      } catch (error) {
        console.error('Error fetching sentences:', error);
        toast({
          title: "Error",
          description: "Failed to load sentences",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSentences();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (sentences.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Sentences Available</CardTitle>
            <CardDescription>There are no sentences to record at the moment.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSentence = sentences[currentIndex];
  const progress = ((currentIndex + 1) / sentences.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <audio ref={audioRef} />
      
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Recording Session</h1>
            <p className="text-gray-600">Sentence {currentIndex + 1} of {sentences.length}</p>
          </div>
          <div className="w-32" /> {/* Spacer for alignment */}
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Current Sentence */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center">Read this sentence clearly</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl text-center leading-relaxed p-6 bg-gray-50 rounded-lg">
              {currentSentence?.text}
            </p>
          </CardContent>
        </Card>

        {/* Recording Controls */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Mic className="w-6 h-6 mr-2" />
              Recording Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-6">
              {/* Recording Button */}
              <div className="flex justify-center">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full"
                    disabled={audioUrl !== null}
                  >
                    <Mic className="w-6 h-6 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full animate-pulse"
                  >
                    <Square className="w-6 h-6 mr-2" />
                    Stop Recording
                  </Button>
                )}
              </div>

              {/* Playback Controls */}
              {audioUrl && (
                <div className="flex flex-col items-center space-y-4">
                  <Button
                    onClick={playRecording}
                    variant="outline"
                    disabled={isPlaying}
                    className="px-6 py-2"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isPlaying ? 'Playing...' : 'Play Recording'}
                  </Button>

                  {/* Accept/Reject Controls */}
                  <div className="flex space-x-4">
                    <Button
                      onClick={acceptRecording}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={rejectRecording}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 px-6 py-2"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Re-record
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <Button
                onClick={previousSentence}
                variant="outline"
                disabled={isPreviousDisabled}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <Button
                onClick={skipSentence}
                variant="outline"
                disabled={currentIndex >= sentences.length - 1}
              >
                Skip
                <SkipForward className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Recording;
