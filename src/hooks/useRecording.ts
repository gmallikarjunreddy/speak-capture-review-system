
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useRecording = (sentences: any[]) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsername = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      let name = data?.full_name;
      if (!name) {
        name = user.email ? user.email.split('@')[0] : user.id;
      }
      setUsername(name.replace(/\s+/g, '_'));
    };
    if (user) fetchUsername();
  }, [user]);

  useEffect(() => {
    const createSession = async (totalSentences: number) => {
      if (!user || !sessionId) return;
      
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
    if (sentences.length > 0 && user && !sessionId) {
      createSession(sentences.length);
    }
  }, [sentences, user, sessionId]);

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
  
  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
  };

  const saveRecording = async (status: 'accepted' | 'rejected') => {
    if (!audioBlob || !user || !sessionId || !username) return false;

    try {
      const sentenceNo = currentIndex + 1;
      const recId = `${username}_${sentenceNo}_${Date.now()}`;
      const fileName = `${recId}.webm`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, audioBlob, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Upload Error",
          description: "Failed to upload recording",
          variant: "destructive"
        });
        return false;
      }

      const { error: dbError } = await supabase
        .from('recordings')
        .insert({
          id: recId,
          user_id: user.id,
          sentence_id: sentences[currentIndex].id,
          audio_url: uploadData.path,
          status: status,
          attempt_number: status === 'rejected' ? rejectedCount + 1 : 1,
          duration_seconds: 0
        });

      if (dbError) {
        console.error('Database error:', dbError);
        toast({
          title: "Database Error",
          description: "Failed to save recording metadata",
          variant: "destructive"
        });
        return false;
      }

      if (status === 'rejected') {
        setRejectedCount(rejectedCount + 1);
      }

      return true;
    } catch (error) {
      console.error('Save recording error:', error);
      toast({
        title: "Error",
        description: "Something went wrong while saving",
        variant: "destructive"
      });
      return false;
    }
  };

  const acceptRecording = async () => {
    const success = await saveRecording('accepted');
    if (!success || !sessionId) return;
    
    await supabase
      .from('recording_sessions')
      .update({ 
        completed_sentences: completedCount + 1,
        status: completedCount + 1 >= sentences.length ? 'completed' : 'in_progress',
        completed_at: completedCount + 1 >= sentences.length ? new Date().toISOString() : null
      })
      .eq('id', sessionId);
    
    setCompletedCount(completedCount + 1);
    
    toast({
      title: "Recording Accepted",
      description: "Moving to next sentence"
    });
    
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
  };

  const rejectRecording = async () => {
    const success = await saveRecording('rejected');
    if (success) {
      toast({
        title: "Recording Rejected",
        description: "Recording saved as rejected. Try recording again"
      });
    }
    resetRecording();
  };

  const skipSentence = () => {
    if (currentIndex + 1 < sentences.length) {
      setCurrentIndex(currentIndex + 1);
      resetRecording();
    }
  };

  return {
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
  };
};
