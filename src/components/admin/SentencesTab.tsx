import { useState } from "react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Plus, Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SentencesTabProps {
  sentences: any[];
  setSentences: (data: any[]) => void;
  isLoading: boolean;
  fetchData: () => void;
}

const SentencesTab = ({ sentences, setSentences, isLoading, fetchData }: SentencesTabProps) => {
  const { toast } = useToast();
  const [newSentence, setNewSentence] = useState({ text: "" });
  const [editingSentence, setEditingSentence] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'idle' | 'processing' | 'success' | 'error';
    message: string;
    processedCount?: number;
    totalCount?: number;
  }>({ type: 'idle', message: '' });

  const addSentence = async () => {
    if (!newSentence.text.trim()) {
      toast({
        title: "Error",
        description: "Please enter a sentence",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiClient.addSentence(newSentence.text);
      toast({
        title: "Success",
        description: "Sentence added successfully",
      });
      setNewSentence({ text: "" });
      fetchData();
    } catch (error: any) {
      console.error("Add sentence error:", error);
      toast({
        title: "Error",
        description: `Failed to add sentence: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const validateAndProcessFile = (text: string): string[] => {
    // Split by lines and clean up
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => line.length >= 5) // Minimum sentence length
      .filter(line => line.length <= 500); // Maximum sentence length

    // Remove duplicates
    const uniqueLines = [...new Set(lines)];
    
    return uniqueLines;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      toast({
        title: "Error",
        description: "Please upload a .txt file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 1024 * 1024) { // 1MB limit
      toast({
        title: "Error",
        description: "File size must be less than 1MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: 'processing', message: 'Reading file...' });

    try {
      console.log("Starting file upload process");

      const text = await file.text();
      const processedLines = validateAndProcessFile(text);

      if (processedLines.length === 0) {
        setUploadStatus({ type: 'error', message: 'No valid sentences found in the file' });
        toast({
          title: "Error",
          description: "No valid sentences found in the file. Please ensure each line contains a sentence between 5-500 characters.",
          variant: "destructive",
        });
        return;
      }

      setUploadStatus({ 
        type: 'processing', 
        message: `Processing ${processedLines.length} sentences...`,
        totalCount: processedLines.length,
        processedCount: 0
      });

      // Process in batches to avoid overwhelming the database
      const batchSize = 10;
      let processedCount = 0;
      const failedSentences: string[] = [];

      for (let i = 0; i < processedLines.length; i += batchSize) {
        const batch = processedLines.slice(i, i + batchSize);

        try {
          await Promise.all(batch.map(text => apiClient.addSentence(text)));
          processedCount += batch.length;
          setUploadStatus({ 
            type: 'processing', 
            message: `Processed ${processedCount} of ${processedLines.length} sentences...`,
            totalCount: processedLines.length,
            processedCount
          });
        } catch (error: any) {
          console.error(`Batch ${i} failed:`, error);
          failedSentences.push(...batch);
        }

        // Small delay between batches
        if (i + batchSize < processedLines.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const successCount = processedCount - failedSentences.length;
      
      if (successCount > 0) {
        setUploadStatus({ 
          type: 'success', 
          message: `Successfully added ${successCount} sentences${failedSentences.length > 0 ? `, ${failedSentences.length} failed` : ''}`,
          processedCount: successCount,
          totalCount: processedLines.length
        });
        
        toast({
          title: "Upload Complete",
          description: `Successfully added ${successCount} sentences${failedSentences.length > 0 ? `, ${failedSentences.length} failed` : ''}`,
        });
        
        fetchData();
      } else {
        throw new Error("Failed to upload any sentences");
      }

    } catch (error: any) {
      console.error("File processing error:", error);
      setUploadStatus({ type: 'error', message: error.message });
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
      
      // Clear status after a delay
      setTimeout(() => {
        setUploadStatus({ type: 'idle', message: '' });
      }, 5000);
    }
  };

  const updateSentence = async () => {
    if (!editingSentence) return;
    
    try {
      await apiClient.updateSentence(editingSentence.id, {
        text: editingSentence.text,
        is_active: editingSentence.is_active,
      });

      toast({
        title: "Success",
        description: "Sentence updated successfully",
      });
      setEditingSentence(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update sentence: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const deleteSentence = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sentence? If it has recordings, it will be marked as inactive instead.')) {
      return;
    }

    try {
      console.log('Attempting to delete sentence:', id);
      await apiClient.deleteSentence(id);
      toast({
        title: "Success",
        description: "Sentence processed successfully",
      });
      fetchData();
    } catch (error: any) {
      console.error('Delete sentence error:', error);
      toast({
        title: "Error",
        description: `Failed to delete sentence: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
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
              onChange={(e) =>
                setNewSentence({ ...newSentence, text: e.target.value })
              }
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

      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Upload Sentences from File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload .txt file (one sentence per line)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file-upload"
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="bg-white"
              />
              <Button 
                variant="outline" 
                disabled={isUploading}
                className="shrink-0"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Upload a .txt file with one sentence per line (max 1MB, 5-500 characters per sentence)
            </p>
          </div>

          {uploadStatus.type !== 'idle' && (
            <Alert className={`${
              uploadStatus.type === 'success' ? 'border-green-200 bg-green-50' :
              uploadStatus.type === 'error' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }`}>
              {uploadStatus.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {uploadStatus.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
              {uploadStatus.type === 'processing' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
              <AlertDescription className="ml-2">
                {uploadStatus.message}
                {uploadStatus.processedCount !== undefined && uploadStatus.totalCount && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(uploadStatus.processedCount / uploadStatus.totalCount) * 100}%` }}
                    ></div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

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
                  <TableHead>ID</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sentences.map((sentence) => (
                  <TableRow key={sentence.id}>
                    <TableCell>#{sentence.id}</TableCell>
                    <TableCell className="max-w-md">
                      {editingSentence?.id === sentence.id ? (
                        <Textarea
                          value={editingSentence.text}
                          onChange={(e) =>
                            setEditingSentence({
                              ...editingSentence,
                              text: e.target.value,
                            })
                          }
                          className="bg-white"
                        />
                      ) : (
                        sentence.text
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          sentence.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sentence.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {editingSentence?.id === sentence.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={updateSentence}
                              disabled={isLoading}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingSentence(null)}
                            >
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
                              variant="destructive"
                              onClick={() => deleteSentence(sentence.id.toString())}
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
    </div>
  );
};

export default SentencesTab;
