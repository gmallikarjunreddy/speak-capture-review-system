import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Plus, Upload, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

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

  const addSentence = async () => {
    if (!newSentence.text.trim()) {
      toast({
        title: "Error",
        description: "Please enter a sentence",
        variant: "destructive",
      });
      return;
    }

    console.log("Attempting to add sentence:", newSentence.text);
    
    // Check auth status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log("Current session:", session);
    console.log("Session error:", sessionError);
    
    if (!session) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add sentences",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("sentences")
      .insert([{ text: newSentence.text }]);
      
    console.log("Insert error:", error);
    
    if (error) {
      toast({
        title: "Error",
        description: `Failed to add sentence: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Sentence added successfully",
      });
      setNewSentence({ text: "" });
      fetchData();
    }
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

    setIsUploading(true);

    try {
      console.log("Starting file upload process");
      
      // Check auth status
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("Current session for file upload:", session);
      console.log("Session error:", sessionError);
      
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to upload sentences",
          variant: "destructive",
        });
        return;
      }

      const text = await file.text();
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      console.log("Parsed lines from file:", lines);

      if (lines.length === 0) {
        toast({
          title: "Error",
          description: "No valid sentences found in the file",
          variant: "destructive",
        });
        return;
      }

      const sentencesToInsert = lines.map(line => ({ text: line }));
      console.log("Sentences to insert:", sentencesToInsert);

      const { error } = await supabase
        .from("sentences")
        .insert(sentencesToInsert);

      console.log("Batch insert error:", error);

      if (error) {
        toast({
          title: "Error",
          description: `Failed to upload sentences: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Successfully added ${lines.length} sentences`,
        });
        fetchData();
      }
    } catch (error) {
      console.log("File processing error:", error);
      toast({
        title: "Error",
        description: "Failed to read the file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const updateSentence = async () => {
    if (!editingSentence) return;
    const { error } = await supabase
      .from("sentences")
      .update({
        text: editingSentence.text,
        is_active: editingSentence.is_active,
      })
      .eq("id", editingSentence.id);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update sentence",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Sentence updated successfully",
      });
      setEditingSentence(null);
      fetchData();
    }
  };

  const deleteSentence = async (id: string) => {
    const { error } = await supabase.from("sentences").delete().eq("id", id);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete sentence",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Sentence deleted successfully",
      });
      fetchData();
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
              Upload a .txt file with one sentence per line
            </p>
          </div>
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
    </div>
  );
};

export default SentencesTab;
