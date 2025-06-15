
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ProgressDisplayProps {
  currentIndex: number;
  totalSentences: number;
}

export const ProgressDisplay = ({ currentIndex, totalSentences }: ProgressDisplayProps) => {
  const progress = totalSentences > 0 ? ((currentIndex + 1) / totalSentences) * 100 : 0;

  return (
    <Card className="mb-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-gray-600">
            {currentIndex + 1} of {totalSentences}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardContent>
    </Card>
  );
};
