
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminHeader from '@/components/admin/AdminHeader';
import SentencesTab from '@/components/admin/SentencesTab';
import UsersTab from '@/components/admin/UsersTab';
import RecordingsTab from '@/components/admin/RecordingsTab';
import AdminAuth from '@/components/AdminAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/hooks/use-toast';
import UserDetailsModal from '@/components/admin/UserDetailsModal';

const Admin = () => {
  const { isAdmin, loading, adminLogin, adminLogout } = useAdminAuth();
  const [sentences, setSentences] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // User details modal state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch sentences
      const { data: sentencesData } = await supabase
        .from('sentences')
        .select('*')
        .order('created_at', { ascending: false });
      setSentences(sentencesData || []);

      // Fetch user profiles
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers(usersData || []);

      // Fetch all recordings and enrich
      const { data: recordingsData } = await supabase
        .from('recordings')
        .select('*')
        .order('recorded_at', { ascending: false });

      const enrichedRecordings = await Promise.all(
        (recordingsData || []).map(async (recording) => {
          let userProfile = null;
          let sentence = null;
          if (recording.user_id) {
            const { data: userData } = await supabase
              .from('user_profiles')
              .select('full_name, email')
              .eq('id', recording.user_id)
              .maybeSingle();
            userProfile = userData;
          }
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
            user_profiles: userProfile,
            sentences: sentence,
          };
        })
      );
      setRecordings(enrichedRecordings);
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminAuth onAdminLogin={adminLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <AdminHeader adminLogout={adminLogout} usersCount={users.length} sentencesCount={sentences.length} recordingsCount={recordings.length} />
        <Tabs defaultValue="sentences" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="sentences">Sentences ({sentences.length})</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="recordings">Recordings ({recordings.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="sentences">
            <SentencesTab sentences={sentences} setSentences={setSentences} isLoading={isLoading} fetchData={fetchData} />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab users={users} onUserClick={handleUserClick} />
          </TabsContent>
          <TabsContent value="recordings">
            <RecordingsTab
              recordings={recordings}
              isLoading={isLoading}
              users={users}
              sentences={sentences}
            />
          </TabsContent>
        </Tabs>
      </div>
      <UserDetailsModal
        user={selectedUser}
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
};

export default Admin;
