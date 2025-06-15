
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter, Search } from "lucide-react";
import { Label } from "@/components/ui/label";

interface RecordingsTabProps {
  recordings: any[];
  isLoading: boolean;
  users: any[];
  sentences: any[];
}

const RecordingsTab = ({ recordings, isLoading }: RecordingsTabProps) => {
  const [recordingFilters, setRecordingFilters] = useState({
    status: "all",
    search: "",
    sortBy: "recorded_at",
    sortOrder: "desc",
  });
  const [filteredRecordings, setFilteredRecordings] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const recordingsPerPage = 10;

  useEffect(() => {
    let filtered = [...recordings];

    // Filter by status
    if (recordingFilters.status !== "all") {
      filtered = filtered.filter((rec) => rec.status === recordingFilters.status);
    }
    // Search
    if (recordingFilters.search) {
      const search = recordingFilters.search.toLowerCase();
      filtered = filtered.filter((r) =>
        (r.user_profiles?.full_name || "").toLowerCase().includes(search) ||
        (r.user_profiles?.email || "").toLowerCase().includes(search) ||
        (r.sentences?.text || "").toLowerCase().includes(search)
      );
    }
    // Sort (support user_name for demo)
    filtered.sort((a, b) => {
      let aValue = a[recordingFilters.sortBy];
      let bValue = b[recordingFilters.sortBy];
      if (recordingFilters.sortBy === "user_name") {
        aValue = a.user_profiles?.full_name || "";
        bValue = b.user_profiles?.full_name || "";
      }
      if (recordingFilters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    setFilteredRecordings(filtered);
    setCurrentPage(1);
  }, [recordings, recordingFilters]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRecordings.length / recordingsPerPage));
  const startIndex = (currentPage - 1) * recordingsPerPage;
  const endIndex = startIndex + recordingsPerPage;
  const currentRecordings = filteredRecordings.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter & Search Recordings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by user, email, or sentence..."
                  value={recordingFilters.search}
                  onChange={(e) =>
                    setRecordingFilters({ ...recordingFilters, search: e.target.value })
                  }
                  className="pl-10 bg-white"
                />
              </div>
            </div>
            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={recordingFilters.status}
                onValueChange={(value) =>
                  setRecordingFilters({ ...recordingFilters, status: value })
                }
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
            {/* Sort By */}
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                value={recordingFilters.sortBy}
                onValueChange={(value) =>
                  setRecordingFilters({ ...recordingFilters, sortBy: value })
                }
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
              onClick={() =>
                setRecordingFilters({
                  status: "all",
                  search: "",
                  sortBy: "recorded_at",
                  sortOrder: "desc",
                })
              }
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Recordings Table */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>
            Audio Recordings ({filteredRecordings.length} filtered)
          </CardTitle>
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
                      <TableCell>{recording.user_profiles?.full_name || "Unknown"}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {recording.sentences?.text || "Deleted sentence"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            recording.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {recording.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {recording.recorded_at
                          ? new Date(recording.recorded_at).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {recording.duration_seconds
                          ? `${recording.duration_seconds}s`
                          : "N/A"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {recording.audio_url || "N/A"}
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
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
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
                        }
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage(Math.min(totalPages, currentPage + 1))
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
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
    </div>
  );
};

export default RecordingsTab;
