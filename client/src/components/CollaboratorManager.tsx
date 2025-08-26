import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, UserCheck, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';

interface EventCollaborator {
  id: string;
  userId: string;
  role: "co-host" | "organizer" | "collaborator";
  permissions: string[];
  status: "pending" | "accepted" | "declined";
  invitedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CollaboratorManagerProps {
  eventId: string;
}

const PERMISSION_OPTIONS = [
  { value: 'manage_guests', label: 'Manage Guest Lists' },
  { value: 'manage_groups', label: 'Manage Event Groups' },
  { value: 'manage_event', label: 'Manage Event (create/update/cancel)' },
];

const ROLE_OPTIONS = [
  { value: 'collaborator', label: 'Collaborator' },
  { value: 'organizer', label: 'Organizer' },
  { value: 'co-host', label: 'Co-Host' },
];

export function CollaboratorManager({ eventId }: CollaboratorManagerProps) {
  const [collaborators, setCollaborators] = useState<EventCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<EventCollaborator | null>(null);
  const [addForm, setAddForm] = useState<{
    userId: string;
    role: "co-host" | "organizer" | "collaborator";
    permissions: string[];
  }>({
    userId: '',
    role: 'collaborator',
    permissions: [],
  });
  const [editForm, setEditForm] = useState<{
    role: "co-host" | "organizer" | "collaborator";
    permissions: string[];
    status: "pending" | "accepted" | "declined";
  }>({
    role: 'collaborator',
    permissions: [],
    status: 'pending',
  });

  useEffect(() => {
    fetchCollaborators();
  }, [eventId]);

  const fetchCollaborators = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/collaborators`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCollaborators(data);
      }
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (!addForm.userId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(addForm),
      });

      if (response.ok) {
        await fetchCollaborators();
        setAddForm({ userId: '', role: 'collaborator', permissions: [] });
        setIsAddDialogOpen(false);
        toast({
          title: "Collaborator Added",
          description: "The collaborator has been invited to this event.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to add collaborator",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditCollaborator = async () => {
    if (!selectedCollaborator) return;

    try {
      const response = await fetch(`/api/events/${eventId}/collaborators/${selectedCollaborator.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        await fetchCollaborators();
        setIsEditDialogOpen(false);
        setSelectedCollaborator(null);
        toast({
          title: "Collaborator Updated",
          description: "The collaborator's permissions have been updated.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update collaborator",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCollaborator = async (collaborator: EventCollaborator) => {
    try {
      const response = await fetch(`/api/events/${eventId}/collaborators/${collaborator.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchCollaborators();
        toast({
          title: "Collaborator Removed",
          description: "The collaborator has been removed from this event.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to remove collaborator",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (collaborator: EventCollaborator) => {
    setSelectedCollaborator(collaborator);
    setEditForm({
      role: collaborator.role,
      permissions: [...collaborator.permissions],
      status: collaborator.status,
    });
    setIsEditDialogOpen(true);
  };

  const togglePermission = (permission: string, isAdd: boolean = true) => {
    if (isAdd) {
      const updatedPermissions = addForm.permissions.includes(permission)
        ? addForm.permissions.filter(p => p !== permission)
        : [...addForm.permissions, permission];
      setAddForm({ ...addForm, permissions: updatedPermissions });
    } else {
      const updatedPermissions = editForm.permissions.includes(permission)
        ? editForm.permissions.filter(p => p !== permission)
        : [...editForm.permissions, permission];
      setEditForm({ ...editForm, permissions: updatedPermissions });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'co-host': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'organizer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'declined': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Event Collaborators
          </CardTitle>
          <CardDescription>Loading collaborators...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Event Collaborators ({collaborators.length})
            </CardTitle>
            <CardDescription>
              Manage co-hosts, organizers, and collaborators for this event
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-add-collaborator">
                <Plus className="h-3 w-3 mr-1" />
                Add Collaborator
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Event Collaborator</DialogTitle>
                <DialogDescription>
                  Invite someone to help manage this event with specific permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    value={addForm.userId}
                    onChange={(e) => setAddForm({ ...addForm, userId: e.target.value })}
                    placeholder="Enter the user's ID"
                    data-testid="input-collaborator-userId"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={addForm.role} onValueChange={(value: any) => setAddForm({ ...addForm, role: value })}>
                    <SelectTrigger data-testid="select-collaborator-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Permissions</Label>
                  <div className="space-y-2 mt-2">
                    {PERMISSION_OPTIONS.map(permission => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={addForm.permissions.includes(permission.value)}
                          onCheckedChange={() => togglePermission(permission.value, true)}
                          data-testid={`checkbox-add-permission-${permission.value}`}
                        />
                        <Label htmlFor={permission.value} className="text-sm">
                          {permission.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCollaborator} data-testid="button-confirm-add-collaborator">
                  Add Collaborator
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {collaborators.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No collaborators yet</p>
            <p className="text-sm">Add collaborators to help manage this event</p>
          </div>
        ) : (
          <div className="space-y-3">
            {collaborators.map((collaborator) => (
              <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{collaborator.userId}</span>
                    <Badge className={getRoleColor(collaborator.role)} data-testid={`badge-role-${collaborator.id}`}>
                      {collaborator.role}
                    </Badge>
                    <Badge className={getStatusColor(collaborator.status)} data-testid={`badge-status-${collaborator.id}`}>
                      {collaborator.status}
                    </Badge>
                  </div>
                  {collaborator.permissions.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {collaborator.permissions.map(permission => (
                        <Badge key={permission} variant="secondary" className="text-xs" data-testid={`badge-permission-${permission}`}>
                          {PERMISSION_OPTIONS.find(p => p.value === permission)?.label || permission}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(collaborator)}
                    data-testid={`button-edit-collaborator-${collaborator.id}`}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveCollaborator(collaborator)}
                    data-testid={`button-remove-collaborator-${collaborator.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collaborator</DialogTitle>
            <DialogDescription>
              Update the role and permissions for this collaborator.
            </DialogDescription>
          </DialogHeader>
          {selectedCollaborator && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editForm.role} onValueChange={(value: any) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger data-testid="select-edit-collaborator-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editForm.status} onValueChange={(value: any) => setEditForm({ ...editForm, status: value })}>
                  <SelectTrigger data-testid="select-edit-collaborator-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="space-y-2 mt-2">
                  {PERMISSION_OPTIONS.map(permission => (
                    <div key={permission.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${permission.value}`}
                        checked={editForm.permissions.includes(permission.value)}
                        onCheckedChange={() => togglePermission(permission.value, false)}
                        data-testid={`checkbox-edit-permission-${permission.value}`}
                      />
                      <Label htmlFor={`edit-${permission.value}`} className="text-sm">
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCollaborator} data-testid="button-confirm-edit-collaborator">
              Update Collaborator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}