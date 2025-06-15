
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

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

  const addSentence = async () => {
    if (!newSentence.text.trim()) {
      toast({
        title: "Error",
        description: "Please enter a sentence",
        variant: "destructive",
      });
      return;
    }
    const { error } = await supabase
      .from("sentences")
      .insert([{ text: newSentence.text }]);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to add sentence",
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
