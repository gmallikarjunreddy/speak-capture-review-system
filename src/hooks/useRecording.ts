
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
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
      try {
        const profile = await apiClient.getProfile();
        let name = profile.full_name;
        if (!name) {
          name = user.email ? user.email.split('@')[0] : user.id;
        }
        setUsername(name.replace(/\s+/g, '_'));
      } catch (error) {
        console.error('Error fetching username:', error);
      }
    };
    if (user) fetchUsername();
  }, [user]);

  useEffect(() => {
    const createSession = async (totalSentences: number) => {
      if (!user) return;
      
      try {
        const session = await apiClient.createRecordingSession(totalSentences);
        setSessionId(session.id);
      } catch (error: any) {
        toast({
          title: "Error Creating Session",
          description: error.message,
          variant: "destructive"
        });
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
      const attemptNum = status === 'rejected' ? rejectedCount + 1 : 1;
      await apiClient.uploadRecording(
        audioBlob,
        sentences[currentIndex].id,
        status,
        attemptNum
      );

      if (status === 'rejected') {
        setRejectedCount(rejectedCount + 1);
      }

      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong while saving",
        variant: "destructive"
      });
      return false;
    }
  };

  const acceptRecording = async () => {
    const success = await saveRecording('accepted');
    if (!success || !sessionId) return;
    
    try {
      await apiClient.updateRecordingSession(sessionId, {
        completed_sentences: completedCount + 1,
        status: completedCount + 1 >= sentences.length ? 'completed' : 'in_progress',
        completed_at: completedCount + 1 >= sentences.length ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error('Error updating session:', error);
    }
    
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

  const previousSentence = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
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
    previousSentence,
    isPreviousDisabled: currentIndex === 0,
  };
};
