
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface AdminHeaderProps {
  adminLogout: () => void;
  usersCount: number;
  sentencesCount: number;
  recordingsCount: number;
}

const AdminHeader = ({ adminLogout, usersCount, sentencesCount, recordingsCount }: AdminHeaderProps) => (
  <div className="mb-8 flex justify-between items-center">
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Control Panel</h1>
      <p className="text-gray-600">Manage sentences, users, and recordings</p>
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
        <div>Users: <b>{usersCount}</b></div>
        <div>Sentences: <b>{sentencesCount}</b></div>
        <div>Recordings: <b>{recordingsCount}</b></div>
      </div>
    </div>
    <Button 
      onClick={adminLogout}
      variant="outline"
      className="border-red-300 text-red-600 hover:bg-red-50"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Logout
    </Button>
  </div>
);

export default AdminHeader;
