
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Mic, Users, FileText, BarChart3, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Mic className="w-8 h-8 text-blue-600" />,
      title: "High-Quality Recording",
      description: "Crystal clear audio recording with professional-grade quality"
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600" />,
      title: "User Management",
      description: "Complete user profiles with demographic information"
    },
    {
      icon: <FileText className="w-8 h-8 text-green-600" />,
      title: "Sentence Management",
      description: "Admin panel to manage recording prompts and categories"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-orange-600" />,
      title: "Progress Tracking",
      description: "Track recording sessions and completion status"
    }
  ];

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
                Voice Capture System
              </h1>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <img src="/lovable-uploads/6fab767f-d57d-48e1-8938-bf7e64722a11.png" alt="ICFAI Foundation for Higher Education Logo" className="h-12 object-contain" />
              <img src="/lovable-uploads/ab5649a2-059c-4c00-bf78-609cd8b00ec2.png" alt="IcfaiTech Logo" className="h-12 object-contain" />
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/auth')}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Professional Voice <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Recording Platform</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Collect high-quality speech data with our comprehensive recording system. 
            Perfect for speech recognition, voice AI training, and linguistic research.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Start Recording
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/admin')}
            >
              Admin Panel
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Powerful Features
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-shadow">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h3>
          <div className="space-y-8">
            <div className="flex items-center space-x-6">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Sign Up & Complete Profile</h4>
                <p className="text-gray-600">Create your account and provide basic information for data collection.</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Record Audio Samples</h4>
                <p className="text-gray-600">Read provided sentences and record your voice with high-quality audio.</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Review & Submit</h4>
                <p className="text-gray-600">Listen to your recordings, accept or re-record as needed, then submit.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Join our voice recording platform and contribute to the future of speech technology.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Sign Up Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">Voice Capture System</span>
          </div>
          <p className="text-gray-400">
            Building the future of speech technology, one voice at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
