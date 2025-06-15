import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Pause, User, Phone, Mail, MapPin, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserDetailsModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

interface Recording {
  id: string;
  audio_url: string;
  status: string;
  recorded_at: string;
  duration_seconds: number;
  sentences: {
    text: string;
  } | null;
}

const UserDetailsModal = ({ user, isOpen, onClose }: UserDetailsModalProps) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      fetchUserRecordings();
    }
  }, [isOpen, user]);

  useEffect(() => {
    // Cleanup audio when modal closes
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
        setPlayingAudio(null);
      }
    };
  }, [currentAudio]);

  const fetchUserRecordings = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data: recordingsData, error } = await supabase
        .from('recordings')
        .select(`
          id,
          audio_url,
          status,
          recorded_at,
          duration_seconds,
          sentence_id
        `)
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false });

      if (error) {
        console.error('Error fetching user recordings:', error);
        toast({
          title: "Error",
          description: "Failed to fetch user recordings",
          variant: "destructive"
        });
        return;
      }

      // Enrich recordings with sentence data
      const enrichedRecordings = await Promise.all(
        (recordingsData || []).map(async (recording) => {
          let sentence = null;
          
          if (recording.sentence_id) {
            const { data: sentenceData } = await supabase
              .from('sentences')
              .select('text')
              .eq('id', recording.sentence_id)
              .maybeSingle();
            sentence = sentenceData;
          }
          
          return {
            ...recording,
            sentences: sentence
          };
        })
      );

      setRecordings(enrichedRecordings);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateReadableAudioId = (recording: Recording) => {
    const date = new Date(recording.recorded_at).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });
    const time = new Date(recording.recorded_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const shortId = recording.id.split('-')[0];
    return `${date}-${time}-${shortId}`;
  };

  const handlePlayAudio = async (recording: Recording) => {
    try {
      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }

      if (playingAudio === recording.id) {
        setPlayingAudio(null);
        return;
      }

      // Create new audio element
      const audio = new Audio(recording.audio_url);
      setCurrentAudio(audio);
      setPlayingAudio(recording.id);

      audio.onended = () => {
        setPlayingAudio(null);
        setCurrentAudio(null);
      };

      audio.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to play audio",
          variant: "destructive"
        });
        setPlayingAudio(null);
        setCurrentAudio(null);
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        title: "Error",
        description: "Failed to play audio",
        variant: "destructive"
      });
      setPlayingAudio(null);
      setCurrentAudio(null);
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setPlayingAudio(null);
    }
  };

  const acceptedRecordings = recordings.filter(r => r.status === 'accepted');
  const rejectedRecordings = recordings.filter(r => r.status === 'rejected');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Details: {user?.full_name || 'Unknown User'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Email:</strong> {user?.email || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Phone:</strong> {user?.phone || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  <strong>State:</strong> {user?.state || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Mother Tongue:</strong> {user?.mother_tongue || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Recording Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{recordings.length}</div>
              <div className="text-sm text-blue-800">Total Recordings</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{acceptedRecordings.length}</div>
              <div className="text-sm text-green-800">Accepted</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{rejectedRecordings.length}</div>
              <div className="text-sm text-red-800">Rejected</div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading recordings...</p>
            </div>
          ) : (
            <>
              {/* Accepted Recordings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-green-700">
                  Accepted Recordings ({acceptedRecordings.length})
                </h3>
                {acceptedRecordings.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No accepted recordings found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Audio ID</TableHead>
                        <TableHead>Sentence</TableHead>
                        <TableHead>Recorded At</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {acceptedRecordings.map((recording) => (
                        <TableRow key={recording.id}>
                          <TableCell className="font-mono text-sm">
                            {generateReadableAudioId(recording)}
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="truncate" title={recording.sentences?.text}>
                              {recording.sentences?.text || 'Deleted sentence'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(recording.recorded_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {recording.duration_seconds ? `${recording.duration_seconds}s` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePlayAudio(recording)}
                              disabled={!recording.audio_url}
                              className="flex items-center gap-1"
                            >
                              {playingAudio === recording.id ? (
                                <>
                                  <Pause className="w-3 h-3" />
                                  Stop
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3" />
                                  Play
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Rejected Recordings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-red-700">
                  Rejected Recordings ({rejectedRecordings.length})
                </h3>
                {rejectedRecordings.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No rejected recordings found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Audio ID</TableHead>
                        <TableHead>Sentence</TableHead>
                        <TableHead>Recorded At</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rejectedRecordings.map((recording) => (
                        <TableRow key={recording.id}>
                          <TableCell className="font-mono text-sm">
                            {generateReadableAudioId(recording)}
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="truncate" title={recording.sentences?.text}>
                              {recording.sentences?.text || 'Deleted sentence'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(recording.recorded_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {recording.duration_seconds ? `${recording.duration_seconds}s` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePlayAudio(recording)}
                              disabled={!recording.audio_url}
                              className="flex items-center gap-1"
                            >
                              {playingAudio === recording.id ? (
                                <>
                                  <Pause className="w-3 h-3" />
                                  Stop
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3" />
                                  Play
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
