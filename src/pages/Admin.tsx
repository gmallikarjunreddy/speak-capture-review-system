
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Users, Mic, FileText, LogOut } from 'lucide-react';
import AdminAuth from '@/components/AdminAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const Admin = () => {
  const { isAdmin, loading, adminLogin, adminLogout } = useAdminAuth();
  const [sentences, setSentences] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [newSentence, setNewSentence] = useState({ text: '', category: 'general' });
  const [editingSentence, setEditingSentence] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const categories = ['general', 'introduction', 'instruction', 'technology', 'personal', 'education', 'arts', 'health', 'travel'];

  useEffect(() => {
    if (isAdmin) {
      console.log('Admin authenticated, fetching data...');
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching sentences...');
      // Fetch sentences
      const { data: sentencesData, error: sentencesError } = await supabase
        .from('sentences')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (sentencesError) {
        console.error('Error fetching sentences:', sentencesError);
        toast({
          title: "Error",
          description: "Failed to fetch sentences",
          variant: "destructive"
        });
      } else {
        console.log('Sentences fetched:', sentencesData?.length || 0);
        setSentences(sentencesData || []);
      }

      console.log('Fetching users...');
      // Fetch users with profiles
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive"
        });
      } else {
        console.log('Users fetched:', usersData?.length || 0);
        setUsers(usersData || []);
      }

      console.log('Fetching recordings...');
      // Fetch recordings with related data
      const { data: recordingsData, error: recordingsError } = await supabase
        .from('recordings')
        .select(`
          *,
          user_profiles!recordings_user_id_fkey(full_name, email),
          sentences(text, category)
        `)
        .order('recorded_at', { ascending: false });
      
      if (recordingsError) {
        console.error('Error fetching recordings:', recordingsError);
        toast({
          title: "Error",
          description: "Failed to fetch recordings",
          variant: "destructive"
        });
      } else {
        console.log('Recordings fetched:', recordingsData?.length || 0);
        setRecordings(recordingsData || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching data:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addSentence = async () => {
    if (!newSentence.text.trim()) {
      toast({
        title: "Error",
        description: "Please enter a sentence",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('sentences')
      .insert([newSentence]);

    if (error) {
      console.error('Error adding sentence:', error);
      toast({
        title: "Error",
        description: "Failed to add sentence",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Sentence added successfully"
      });
      setNewSentence({ text: '', category: 'general' });
      fetchData();
    }
  };

  const updateSentence = async () => {
    if (!editingSentence) return;

    const { error } = await supabase
      .from('sentences')
      .update({
        text: editingSentence.text,
        category: editingSentence.category,
        is_active: editingSentence.is_active
      })
      .eq('id', editingSentence.id);

    if (error) {
      console.error('Error updating sentence:', error);
      toast({
        title: "Error",
        description: "Failed to update sentence",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Sentence updated successfully"
      });
      setEditingSentence(null);
      fetchData();
    }
  };

  const deleteSentence = async (id: string) => {
    const { error } = await supabase
      .from('sentences')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting sentence:', error);
      toast({
        title: "Error",
        description: "Failed to delete sentence",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Sentence deleted successfully"
      });
      fetchData();
    }
  };

  const handleAdminLogout = () => {
    adminLogout();
    toast({
      title: "Logged Out",
      description: "Admin session ended"
    });
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Control Panel</h1>
            <p className="text-gray-600">Manage sentences, users, and recordings</p>
          </div>
          <Button 
            onClick={handleAdminLogout}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        )}

        <Tabs defaultValue="sentences" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="sentences">
              <FileText className="w-4 h-4 mr-2" />
              Sentences ({sentences.length})
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="recordings">
              <Mic className="w-4 h-4 mr-2" />
              Recordings ({recordings.length})
            </TabsTrigger>
          </TabsList>

          {/* Sentences Tab */}
          <TabsContent value="sentences" className="space-y-6">
            {/* Add New Sentence */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Add New Sentence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sentence-text">Sentence Text</Label>
                  <Textarea
                    id="sentence-text"
                    value={newSentence.text}
                    onChange={(e) => setNewSentence({...newSentence, text: e.target.value})}
                    placeholder="Enter the sentence to be recorded..."
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sentence-category">Category</Label>
                  <Select 
                    value={newSentence.category} 
                    onValueChange={(value) => setNewSentence({...newSentence, category: value})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addSentence} disabled={isLoading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sentence
                </Button>
              </CardContent>
            </Card>

            {/* Sentences List */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Manage Sentences ({sentences.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {sentences.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No sentences found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Text</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sentences.map((sentence) => (
                        <TableRow key={sentence.id}>
                          <TableCell className="max-w-md">
                            {editingSentence?.id === sentence.id ? (
                              <Textarea
                                value={editingSentence.text}
                                onChange={(e) => setEditingSentence({...editingSentence, text: e.target.value})}
                                className="bg-white"
                              />
                            ) : (
                              sentence.text
                            )}
                          </TableCell>
                          <TableCell>
                            {editingSentence?.id === sentence.id ? (
                              <Select 
                                value={editingSentence.category} 
                                onValueChange={(value) => setEditingSentence({...editingSentence, category: value})}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              sentence.category
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              sentence.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {sentence.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {editingSentence?.id === sentence.id ? (
                                <>
                                  <Button size="sm" onClick={updateSentence} disabled={isLoading}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingSentence(null)}>
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setEditingSentence(sentence)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => deleteSentence(sentence.id)}
                                    disabled={isLoading}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Registered Users ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No users found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Mother Tongue</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.full_name || 'N/A'}</TableCell>
                          <TableCell>{user.email || 'N/A'}</TableCell>
                          <TableCell>{user.phone || 'N/A'}</TableCell>
                          <TableCell>{user.state || 'N/A'}</TableCell>
                          <TableCell>{user.mother_tongue || 'N/A'}</TableCell>
                          <TableCell>
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recordings Tab */}
          <TabsContent value="recordings">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Audio Recordings ({recordings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {recordings.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No recordings found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Sentence</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recorded At</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Audio ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recordings.map((recording) => (
                        <TableRow key={recording.id}>
                          <TableCell>{recording.user_profiles?.full_name || 'Unknown'}</TableCell>
                          <TableCell className="max-w-md truncate">
                            {recording.sentences?.text || 'Deleted sentence'}
                          </TableCell>
                          <TableCell>{recording.sentences?.category || 'N/A'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              recording.status === 'accepted' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {recording.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {recording.recorded_at ? new Date(recording.recorded_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {recording.duration_seconds ? `${recording.duration_seconds}s` : 'N/A'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {recording.audio_url || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
