import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Shield, CheckCircle, XCircle, Search, Eye, User, Trash2, Edit } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  lastLogin: any; // Timestamp or null
  creationTime?: string;
  lastSignInTime?: string;
  authProvider: string;
}

export const AdminUsers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // Edit State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("lastLogin", "desc"));

      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map(doc => doc.data() as UserData);
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      try {
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
        const usersList = querySnapshot.docs.map(doc => doc.data() as UserData);
        setUsers(usersList);
      } catch (e) {
        console.error("Error fetching users fallback:", e);
      }
    }
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (u: UserData) => {
    setSelectedUser(u);
    setEditName(u.displayName || "");
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      const userRef = doc(db, "users", selectedUser.uid);
      await updateDoc(userRef, { displayName: editName });

      // Update local state
      setUsers(users.map(u => u.uid === selectedUser.uid ? { ...u, displayName: editName } : u));

      toast({ title: "Success", description: "User updated successfully" });
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (u: UserData) => {
    setUserToDelete(u);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      // Prevent deleting yourself if you want
      if (user && userToDelete.uid === user.uid) {
        toast({ title: "Warning", description: "You cannot delete your own account details from here while logged in.", variant: "destructive" });
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        return;
      }

      await deleteDoc(doc(db, "users", userToDelete.uid));
      setUsers(users.filter(u => u.uid !== userToDelete.uid));
      toast({ title: "Success", description: "User removed from database" });
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">User Management</h2>
        <p className="text-muted-foreground">Monitor and manage user access</p>
      </div>

      {/* Current User Card */}
      {user && (
        <Card className="p-6 bg-gradient-to-br from-background to-muted/50 border-primary/20">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Current Session
          </h3>
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
              <AvatarFallback className="gradient-primary text-primary-foreground text-xl">
                {user.displayName?.[0] || user.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div>
                <h4 className="text-xl font-bold">{user.displayName || 'No Name Set'}</h4>
                <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                  <Mail className="h-4 w-4" /> {user.email}
                </p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <Badge variant={user.emailVerified ? "default" : "secondary"} className="gap-1">
                  {user.emailVerified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {user.emailVerified ? "Verified" : "Unverified"}
                </Badge>
                <Badge variant="outline" className="gap-1 bg-background">
                  Provider: {user.providerData[0]?.providerId || 'email'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* All Users List */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold">All Registered Users ({users.length})</h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.photoURL} />
                          <AvatarFallback>{u.displayName?.[0] || u.email?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{u.displayName || 'User'}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-sm">{u.authProvider}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.lastLogin?.seconds ? new Date(u.lastLogin.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedUser(u)} title="View Details">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(u)} title="Edit User">
                          <Edit className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(u)} title="Delete User">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser && !editDialogOpen} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Full information for {selectedUser?.displayName}</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 py-4">
              <div className="flex justify-center">
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage src={selectedUser.photoURL} />
                  <AvatarFallback className="text-2xl">{selectedUser.displayName?.[0]}</AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <span className="text-muted-foreground font-medium col-span-1">Name:</span>
                  <span className="col-span-2">{selectedUser.displayName || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <span className="text-muted-foreground font-medium col-span-1">Email:</span>
                  <span className="col-span-2">{selectedUser.email}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <span className="text-muted-foreground font-medium col-span-1">User ID:</span>
                  <span className="col-span-2 font-mono text-xs">{selectedUser.uid}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <span className="text-muted-foreground font-medium col-span-1">Provider:</span>
                  <span className="col-span-2 capitalize">{selectedUser.authProvider}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <span className="text-muted-foreground font-medium col-span-1">Created:</span>
                  <span className="col-span-2">{selectedUser.creationTime ? new Date(selectedUser.creationTime).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <span className="text-muted-foreground font-medium col-span-1">Last Login:</span>
                  <span className="col-span-2">
                    {selectedUser.lastLogin?.seconds
                      ? new Date(selectedUser.lastLogin.seconds * 1000).toLocaleString()
                      : 'Just now'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update details for {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email (Read only)</Label>
              <Input value={selectedUser?.email || ''} disabled className="bg-muted" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isUpdating}>Cancel</Button>
            <Button onClick={handleUpdateUser} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user record for
              <span className="font-bold text-foreground mx-1">{userToDelete?.email}</span>
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
