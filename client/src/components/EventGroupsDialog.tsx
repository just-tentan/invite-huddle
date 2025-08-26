import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderPlus, Edit2, Trash2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { EventGroup } from '@shared/schema';

// API request helper
const apiRequest = async (url: string, method: string, data?: any) => {
  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response;
};

interface EventGroupsDialogProps {
  children: React.ReactNode;
  onSelectGroup?: (groupId: string) => void;
  showSelectOptions?: boolean;
  selectedGroupId?: string | null;
}

export function EventGroupsDialog({ 
  children, 
  onSelectGroup, 
  showSelectOptions = false,
  selectedGroupId 
}: EventGroupsDialogProps) {
  const [open, setOpen] = useState(false);
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EventGroup | null>(null);
  const { toast } = useToast();

  // Form state
  const [groupForm, setGroupForm] = useState({ title: '', description: '' });

  useEffect(() => {
    if (open) {
      fetchEventGroups();
    }
  }, [open]);

  const fetchEventGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/event-groups', {
        credentials: 'include'
      });
      if (response.ok) {
        const groups = await response.json();
        setEventGroups(groups);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load event groups',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiRequest('/api/event-groups', 'POST', groupForm);
      const newGroup = await response.json();
      setEventGroups([...eventGroups, newGroup]);
      setGroupForm({ title: '', description: '' });
      setShowCreateForm(false);
      toast({
        title: 'Success',
        description: 'Event group created successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create event group',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    try {
      const response = await apiRequest(`/api/event-groups/${editingGroup.id}`, 'PUT', groupForm);
      const updatedGroup = await response.json();
      setEventGroups(eventGroups.map(group => 
        group.id === editingGroup.id ? updatedGroup : group
      ));
      setEditingGroup(null);
      setGroupForm({ title: '', description: '' });
      toast({
        title: 'Success',
        description: 'Event group updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update event group',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this event group? Events in this group will not be deleted, but they will no longer be grouped.')) {
      return;
    }

    try {
      await apiRequest(`/api/event-groups/${groupId}`, 'DELETE');
      setEventGroups(eventGroups.filter(group => group.id !== groupId));
      toast({
        title: 'Success',
        description: 'Event group deleted successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete event group',
        variant: 'destructive'
      });
    }
  };

  const startEditGroup = (group: EventGroup) => {
    setEditingGroup(group);
    setGroupForm({ title: group.title, description: group.description || '' });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setEditingGroup(null);
    setGroupForm({ title: '', description: '' });
  };

  const handleSelectGroup = (groupId: string) => {
    if (onSelectGroup) {
      onSelectGroup(groupId);
      setOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showSelectOptions ? 'Select Event Group' : 'Event Groups Management'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showSelectOptions && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Group related events together for better organization
              </p>
              <Button
                size="sm"
                onClick={() => setShowCreateForm(true)}
                data-testid="button-create-event-group"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Group
              </Button>
            </div>
          )}

          {/* Create/Edit Group Form */}
          {showCreateForm && !showSelectOptions && (
            <Card>
              <CardHeader>
                <CardTitle>{editingGroup ? 'Edit Event Group' : 'Create New Event Group'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup} className="space-y-4">
                  <div>
                    <Label htmlFor="group-title">Group Title</Label>
                    <Input
                      id="group-title"
                      placeholder="Monthly Meetups"
                      value={groupForm.title}
                      onChange={(e) => setGroupForm({ ...groupForm, title: e.target.value })}
                      required
                      data-testid="input-group-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="group-description">Description (Optional)</Label>
                    <Textarea
                      id="group-description"
                      placeholder="Regular monthly gatherings for networking and fun"
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                      data-testid="textarea-group-description"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" data-testid="button-save-group">
                      {editingGroup ? 'Update Group' : 'Create Group'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Event Groups List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading event groups...</p>
            </div>
          ) : eventGroups.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FolderPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No event groups yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create event groups to organize related events together
                </p>
                {!showSelectOptions && (
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Group
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {showSelectOptions && (
                <Card 
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    !selectedGroupId ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSelectGroup('')}
                  data-testid="card-no-group"
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">No Group</h4>
                        <p className="text-sm text-muted-foreground">Don't assign to any group</p>
                      </div>
                      {!selectedGroupId && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {eventGroups.map((group) => (
                <Card
                  key={group.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    showSelectOptions && selectedGroupId === group.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={showSelectOptions ? () => handleSelectGroup(group.id) : undefined}
                  data-testid={`card-event-group-${group.id}`}
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{group.title}</h4>
                          {showSelectOptions && selectedGroupId === group.id && (
                            <Badge variant="default">Selected</Badge>
                          )}
                        </div>
                        {group.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {group.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Created {formatDate(group.createdAt.toString())}
                        </p>
                      </div>
                      
                      {!showSelectOptions && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditGroup(group)}
                            data-testid={`button-edit-group-${group.id}`}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteGroup(group.id)}
                            data-testid={`button-delete-group-${group.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}