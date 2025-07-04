
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mic, User, LogOut, Settings, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const data = await apiClient.getProfile();
        setProfile(data);
        // Check if profile has required fields
        setHasProfile(!!(data.full_name && data.phone && data.state && data.mother_tongue));
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleStartRecording = () => {
    if (hasProfile) {
      navigate('/recording');
    } else {
      navigate('/profile-setup');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out."
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Voice Capture
              </h1>
            </div>
            <div className="hidden lg:flex">
              <Header />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.email}</span>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to Record Your Voice?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Help us build better speech recognition by recording clear, natural speech samples.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Profile Status Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-6 h-6 mr-2 text-blue-600" />
                Profile Status
              </CardTitle>
              <CardDescription>
                {hasProfile ? 'Your profile is complete' : 'Complete your profile to start recording'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasProfile ? (
                <div className="space-y-2">
                  <p><strong>Name:</strong> {profile?.full_name || 'Not provided'}</p>
                  <p><strong>Phone:</strong> {profile?.phone || 'Not provided'}</p>
                  <p><strong>State:</strong> {profile?.state || 'Not provided'}</p>
                  <p><strong>Mother Tongue:</strong> {profile?.mother_tongue || 'Not provided'}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/profile-setup')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">
                    Please complete your profile before starting to record.
                  </p>
                  <Button onClick={() => navigate('/profile-setup')}>
                    Complete Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recording Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mic className="w-6 h-6 mr-2 text-purple-600" />
                Audio Recording
              </CardTitle>
              <CardDescription>
                Start recording your voice samples
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <Play className="w-10 h-10 text-white" />
                </div>
                <Button 
                  size="lg"
                  onClick={handleStartRecording}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={!hasProfile}
                >
                  <Mic className="w-5 h-5 mr-2" />
                  {hasProfile ? 'Start Recording' : 'Complete Profile First'}
                </Button>
                {!hasProfile && (
                  <p className="text-sm text-gray-500 mt-2">
                    Complete your profile to unlock recording features
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
