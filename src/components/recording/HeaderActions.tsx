
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HeaderActions = () => {
  const navigate = useNavigate();
  return (
    <Button 
      variant="outline" 
      onClick={() => navigate('/dashboard')}
      className="mb-6"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to Dashboard
    </Button>
  );
};
