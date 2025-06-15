import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Users, Mic, FileText, LogOut, Search, Filter } from 'lucide-react';
import AdminAuth from '@/components/AdminAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import UserDetailsModal from '@/components/admin/UserDetailsModal';

const Admin = () => {
  const { isAdmin, loading, adminLogin, adminLogout } = useAdminAuth();
  const [sentences, setSentences] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [filteredRecordings, setFilteredRecordings] = useState<any[]>([]);
  const [newSentence, setNewSentence] = useState<{ text: string }>({ text: '' });
  const [editingSentence, setEditingSentence] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // User details modal state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  // Recording filters and pagination
  const [recordingFilters, setRecordingFilters] = useState({
    status: 'all',
    category: 'all',
    search: '',
    sortBy: 'recorded_at',
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const recordingsPerPage = 10;
  
  const { toast } = useToast();

  const categories = []; // category filtering not needed

  useEffect(() => {
    if (isAdmin) {
      console.log('Admin authenticated, fetching data...');
      fetchData();
    }
  }, [isAdmin]);

  useEffect(() => {
    // Apply filters whenever recordings or filters change
    applyFilters();
  }, [recordings, recordingFilters]);

  const applyFilters = () => {
    let filtered = [...recordings];

    // Filter by status
    if (recordingFilters.status !== 'all') {
      filtered = filtered.filter(recording => recording.status === recordingFilters.status);
    }

    // Filter by search term (no category search)
    if (recordingFilters.search) {
      const searchTerm = recordingFilters.search.toLowerCase();
      filtered = filtered.filter(recording => 
        recording.user_profiles?.full_name?.toLowerCase().includes(searchTerm) ||
        recording.user_profiles?.email?.toLowerCase().includes(searchTerm) ||
        recording.sentences?.text?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort recordings (remove sentence_text sort, category)
    filtered.sort((a, b) => {
      let aValue = a[recordingFilters.sortBy];
      let bValue = b[recordingFilters.sortBy];

      // Handle nested properties for sorting (no category)
      if (recordingFilters.sortBy === 'user_name') {
        aValue = a.user_profiles?.full_name || '';
        bValue = b.user_profiles?.full_name || '';
      }

      if (recordingFilters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRecordings(filtered);
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredRecordings.length / recordingsPerPage);
  const startIndex = (currentPage - 1) * recordingsPerPage;
  const endIndex = startIndex + recordingsPerPage;
  const currentRecordings = filteredRecordings.slice(startIndex, endIndex);

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
      // Fetch users with profiles - simplified query
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
      // Fetch recordings with a simpler approach - first get recordings, then match with user data
      const { data: recordingsData, error: recordingsError } = await supabase
        .from('recordings')
        .select('*')
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
        
        // Now enrich recordings with user and sentence data
        const enrichedRecordings = await Promise.all(
          (recordingsData || []).map(async (recording) => {
            let userProfile = null;
            let sentence = null;
            
            // Fetch user profile if user_id exists
            if (recording.user_id) {
              const { data: userData } = await supabase
                .from('user_profiles')
                .select('full_name, email')
                .eq('id', recording.user_id)
                .single();
              userProfile = userData;
            }
            
            // Fetch sentence if sentence_id exists
            if (recording.sentence_id) {
              const { data: sentenceData } = await supabase
                .from('sentences')
                .select('text, category')
                .eq('id', recording.sentence_id)
                .single();
              sentence = sentenceData;
            }
            
            return {
              ...recording,
              user_profiles: userProfile,
              sentences: sentence
            };
          })
        );
        
        setRecordings(enrichedRecordings);
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
      .insert([{ text: newSentence.text }]);

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
      setNewSentence({ text: '' });
      fetchData();
    }
  };

  const updateSentence = async () => {
    if (!editingSentence) return;

    const { error } = await supabase
      .from('sentences')
      .update({
        text: editingSentence.text,
        is_active: editingSentence.is_active, // keep is_active so admin still can toggle, but remove category
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
            {/* Add New Sentence (category field removed) */}
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
                <Button onClick={addSentence} disabled={isLoading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sentence
                </Button>
              </CardContent>
            </Card>

            {/* Sentences List (no category) */}
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

          {/* Users Tab (unchanged) */}
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
                        <TableRow 
                          key={user.id} 
                          className="cursor-pointer hover:bg-blue-50"
                          onClick={() => handleUserClick(user)}
                        >
                          <TableCell className="text-blue-600 hover:text-blue-800">
                            {user.full_name || 'N/A'}
                          </TableCell>
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
          <TabsContent value="recordings" className="space-y-6">
            {/* Filters Card (remove category) */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filter & Search Recordings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search by user, email, or sentence..."
                        value={recordingFilters.search}
                        onChange={(e) => setRecordingFilters({...recordingFilters, search: e.target.value})}
                        className="pl-10 bg-white"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={recordingFilters.status} 
                      onValueChange={(value) => setRecordingFilters({...recordingFilters, status: value})}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Filter - REMOVED */}

                  {/* Sort By */}
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select 
                      value={recordingFilters.sortBy} 
                      onValueChange={(value) => setRecordingFilters({...recordingFilters, sortBy: value})}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recorded_at">Date Recorded</SelectItem>
                        <SelectItem value="user_name">User Name</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="duration_seconds">Duration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {currentRecordings.length} of {filteredRecordings.length} recordings
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setRecordingFilters({
                      status: 'all',
                      category: 'all', // safe to keep for backward compatibility
                      search: '',
                      sortBy: 'recorded_at',
                      sortOrder: 'desc'
                    })}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recordings Table (remove category column) */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Audio Recordings ({filteredRecordings.length} filtered)</CardTitle>
              </CardHeader>
              <CardContent>
                {currentRecordings.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No recordings found</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Sentence</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Recorded At</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Audio ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentRecordings.map((recording) => (
                          <TableRow key={recording.id}>
                            <TableCell>{recording.user_profiles?.full_name || 'Unknown'}</TableCell>
                            <TableCell className="max-w-md truncate">
                              {recording.sentences?.text || 'Deleted sentence'}
                            </TableCell>
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
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-6 flex justify-center">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                            
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(pageNum)}
                                    isActive={currentPage === pageNum}
                                    className="cursor-pointer"
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            })}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Details Modal */}
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
