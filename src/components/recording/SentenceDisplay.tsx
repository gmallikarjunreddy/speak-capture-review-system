
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SentenceDisplayProps {
  sentence: {
    text: string;
    category: string;
  } | undefined;
}

export const SentenceDisplay = ({ sentence }: SentenceDisplayProps) => {
  if (!sentence) {
    return null;
  }
  
  return (
    <Card className="mb-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center">Read This Sentence</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-2xl font-medium text-gray-800 leading-relaxed mb-4">
            "{sentence.text}"
          </p>
          <p className="text-sm text-gray-500">
            Category: {sentence.category}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
