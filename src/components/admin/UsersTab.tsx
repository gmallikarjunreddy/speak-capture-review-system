
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UsersTabProps {
  users: any[];
  onUserClick: (user: any) => void;
}

const UsersTab = ({ users, onUserClick }: UsersTabProps) => (
  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
    <CardHeader>
      <CardTitle>
        Registered Users ({users.length})
      </CardTitle>
      <div className="mt-2 text-xs text-gray-400">
        {users.length === 0
          ? 'No users found. (Check browser console for the users array!)'
          : `${users.length} users loaded. (Check browser console for full users array!)`}
      </div>
    </CardHeader>
    <CardContent>
      {users.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No users found
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Mother Tongue</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, i) => (
              <TableRow
                key={user.id || i}
                className="cursor-pointer hover:bg-blue-50"
                onClick={() => onUserClick(user)}
              >
                <TableCell className="text-blue-600 hover:text-blue-800">
                  {user.full_name || 'N/A'}
                </TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell>{user.phone || 'N/A'}</TableCell>
                <TableCell>{user.state || 'N/A'}</TableCell>
                <TableCell>{user.mother_tongue || 'N/A'}</TableCell>
                <TableCell>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export default UsersTab;
