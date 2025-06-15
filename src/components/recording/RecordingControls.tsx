
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Square, Play, Check, RotateCcw, SkipForward, SkipBack } from 'lucide-react';

interface RecordingControlsProps {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  audioUrl: string | null;
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  playRecording: () => void;
  acceptRecording: () => void;
  rejectRecording: () => void;
  skipSentence: () => void;
  isSkipDisabled: boolean;
  previousSentence: () => void;
  isPreviousDisabled: boolean;
}

export const RecordingControls = ({
  isRecording,
  startRecording,
  stopRecording,
  audioUrl,
  audioRef,
  isPlaying,
  playRecording,
  acceptRecording,
  rejectRecording,
  skipSentence,
  isSkipDisabled,
  previousSentence,
  isPreviousDisabled,
}: RecordingControlsProps) => {
  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="text-center space-y-6">
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

          <div className="pt-4 border-t flex justify-center items-center space-x-4">
            <Button
              variant="ghost"
              onClick={previousSentence}
              disabled={isPreviousDisabled}
            >
              <SkipBack className="w-4 h-4 mr-2" />
              Previous Sentence
            </Button>
            <Button
              variant="ghost"
              onClick={skipSentence}
              disabled={isSkipDisabled}
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip This Sentence
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

