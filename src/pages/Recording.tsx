import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Check, 
  X, 
  ArrowLeft, 
  SkipForward,
  RotateCcw
} from 'lucide-react';

const Recording = () => {
  const { user } = useAuth();
  const [sentences, setSentences] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSentences = async () => {
      const { data, error } = await supabase
        .from('sentences')
        .select('*')
        .eq('is_active', true)
        .order('created_at');
      
      if (data) {
        setSentences(data);
        // Create recording session
        createSession(data.length);
      }
    };

    fetchSentences();
  }, []);

  const createSession = async (totalSentences: number) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('recording_sessions')
      .insert({
        user_id: user.id,
        total_sentences: totalSentences,
        completed_sentences: 0,
        status: 'in_progress'
      })
      .select()
      .single();
    
    if (data) {
      setSessionId(data.id);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly and naturally"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording Stopped",
        description: "Review your recording and accept or re-record"
      });
    }
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  const acceptRecording = async () => {
    if (!audioBlob || !user || !sessionId) return;
    
    try {
      // Upload audio file with user folder structure
      const fileName = `${user.id}/recording_${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, audioBlob);
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Upload Error",
          description: "Failed to upload recording",
          variant: "destructive"
        });
        return;
      }
      
      // Save recording metadata
      const { error: dbError } = await supabase
        .from('recordings')
        .insert({
          user_id: user.id,
          sentence_id: sentences[currentIndex].id,
          audio_url: uploadData.path,
          status: 'accepted',
          attempt_number: 1,
          duration_seconds: 0 // You could calculate this
        });
      
      if (dbError) {
        console.error('Database error:', dbError);
        toast({
          title: "Database Error",
          description: "Failed to save recording",
          variant: "destructive"
        });
        return;
      }
      
      // Update session
      const newCompletedCount = completedCount + 1;
      await supabase
        .from('recording_sessions')
        .update({ 
          completed_sentences: newCompletedCount,
          status: newCompletedCount >= sentences.length ? 'completed' : 'in_progress',
          completed_at: newCompletedCount >= sentences.length ? new Date().toISOString() : null
        })
        .eq('id', sessionId);
      
      setCompletedCount(newCompletedCount);
      
      toast({
        title: "Recording Accepted",
        description: "Moving to next sentence"
      });
      
      // Move to next sentence or complete
      if (currentIndex + 1 < sentences.length) {
        setCurrentIndex(currentIndex + 1);
        resetRecording();
      } else {
        toast({
          title: "Session Complete!",
          description: "All recordings completed successfully"
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Accept recording error:', error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      });
    }
  };

  const rejectRecording = () => {
    resetRecording();
    toast({
      title: "Recording Rejected",
      description: "Try recording again"
    });
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
  };

  const skipSentence = () => {
    if (currentIndex + 1 < sentences.length) {
      setCurrentIndex(currentIndex + 1);
      resetRecording();
    }
  };

  if (sentences.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentSentence = sentences[currentIndex];
  const progress = ((currentIndex + 1) / sentences.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Progress */}
        <Card className="mb-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-600">
                {currentIndex + 1} of {sentences.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Current Sentence */}
        <Card className="mb-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center">Read This Sentence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-2xl font-medium text-gray-800 leading-relaxed mb-4">
                "{currentSentence?.text}"
              </p>
              <p className="text-sm text-gray-500">
                Category: {currentSentence?.category}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recording Controls */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              {/* Recording Button */}
              <div>
                <Button
                  size="lg"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-20 h-20 rounded-full ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  }`}
                >
                  {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
                </p>
              </div>

              {/* Audio Playback */}
              {audioUrl && (
                <div className="space-y-4">
                  <audio ref={audioRef} className="hidden" />
                  <Button
                    variant="outline"
                    onClick={playRecording}
                    disabled={isPlaying}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isPlaying ? 'Playing...' : 'Play Recording'}
                  </Button>
                  
                  {/* Accept/Reject Buttons */}
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={acceptRecording}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={rejectRecording}
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-50"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Re-record
                    </Button>
                  </div>
                </div>
              )}

              {/* Skip Button */}
              <div className="pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={skipSentence}
                  disabled={currentIndex + 1 >= sentences.length}
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip This Sentence
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Recording;
