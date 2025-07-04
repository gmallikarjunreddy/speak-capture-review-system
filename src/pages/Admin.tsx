
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminHeader from '@/components/admin/AdminHeader';
import SentencesTab from '@/components/admin/SentencesTab';
import UsersTab from '@/components/admin/UsersTab';
import RecordingsTab from '@/components/admin/RecordingsTab';
import AdminAuth from '@/components/AdminAuth';
import { useToast } from '@/hooks/use-toast';
import UserDetailsModal from '@/components/admin/UserDetailsModal';

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sentences, setSentences] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // User details modal state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAuth = () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Check if token is admin token (you might want to validate this server-side)
        setIsAdmin(true);
      }
      setLoading(false);
    };

    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all admin data
      const [sentencesData, usersData, recordingsData] = await Promise.all([
        apiClient.getAdminSentences(),
        apiClient.getAdminUsers(),
        apiClient.getAdminRecordings()
      ]);

      setSentences(sentencesData || []);
      setUsers(usersData || []);
      setRecordings(recordingsData || []);
    } catch (error: any) {
      console.error("Error fetching admin data:", error);
      toast({
        title: "Error",
        description: "Failed to load admin data. Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (username: string, password: string) => {
    try {
      const { data, error } = await apiClient.adminSignIn(username, password);
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setIsAdmin(true);
      localStorage.setItem('adminLoginTime', Date.now().toString());
      toast({
        title: "Success",
        description: "Admin login successful",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive"
      });
    }
  };

  const adminLogout = async () => {
    try {
      await apiClient.signOut();
    } catch (error) {
      console.error("Error during admin logout:", error);
    }
    
    localStorage.removeItem('adminLoginTime');
    setIsAdmin(false);
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
    return <AdminAuth onAdminLogin={handleAdminLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <AdminHeader 
          adminLogout={adminLogout} 
          usersCount={users.length} 
          sentencesCount={sentences.length} 
          recordingsCount={recordings.length} 
        />
        <div className="mb-6">
          <a
            href="/admin/users"
            className="inline-block text-sm text-blue-700 border hover:border-blue-200 rounded px-3 py-1 bg-blue-50 hover:bg-blue-100 transition"
          >
            Go to All Users Management
          </a>
        </div>
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
