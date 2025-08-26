import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Users, Edit2, Trash2, UserPlus, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import type { GuestList, GuestListMember } from '@shared/schema';

interface GuestListWithMembers extends GuestList {
  memberCount: number;
}

interface GuestListsDialogProps {
  children: React.ReactNode;
  onInviteGuestList?: (guestListId: string) => void;
  showInviteOptions?: boolean;
}

export function GuestListsDialog({ children, onInviteGuestList, showInviteOptions = false }: GuestListsDialogProps) {
  const [open, setOpen] = useState(false);
  const [guestLists, setGuestLists] = useState<GuestListWithMembers[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [members, setMembers] = useState<GuestListMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingList, setEditingList] = useState<GuestListWithMembers | null>(null);
  const [editingMember, setEditingMember] = useState<GuestListMember | null>(null);
  const { toast } = useToast();

  // Form state
  const [listForm, setListForm] = useState({ name: '', description: '' });
  const [memberForm, setMemberForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    if (open) {
      fetchGuestLists();
    }
  }, [open]);

  useEffect(() => {
    if (selectedList) {
      fetchMembers(selectedList);
    }
  }, [selectedList]);

  const fetchGuestLists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/guest-lists', {
        credentials: 'include'
      });
      if (response.ok) {
        const lists = await response.json();
        setGuestLists(lists);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load guest lists',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (listId: string) => {
    try {
      const response = await fetch(`/api/guest-lists/${listId}/members`, {
        credentials: 'include'
      });
      if (response.ok) {
        const listMembers = await response.json();
        setMembers(listMembers);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load members',
        variant: 'destructive'
      });
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiRequest('/api/guest-lists', 'POST', listForm);
      const newList = await response.json();
      setGuestLists([...guestLists, newList]);
      setListForm({ name: '', description: '' });
      setShowCreateForm(false);
      toast({
        title: 'Success',
        description: 'Guest list created successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create guest list',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingList) return;

    try {
      const response = await apiRequest(`/api/guest-lists/${editingList.id}`, 'PUT', listForm);
      const updatedList = await response.json();
      setGuestLists(guestLists.map(list => 
        list.id === editingList.id ? updatedList : list
      ));
      setEditingList(null);
      setListForm({ name: '', description: '' });
      toast({
        title: 'Success',
        description: 'Guest list updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update guest list',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this guest list? This action cannot be undone.')) {
      return;
    }

    try {
      await apiRequest(`/api/guest-lists/${listId}`, 'DELETE');
      setGuestLists(guestLists.filter(list => list.id !== listId));
      if (selectedList === listId) {
        setSelectedList(null);
        setMembers([]);
      }
      toast({
        title: 'Success',
        description: 'Guest list deleted successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete guest list',
        variant: 'destructive'
      });
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedList) return;

    try {
      const response = await apiRequest(`/api/guest-lists/${selectedList}/members`, 'POST', memberForm);
      const newMember = await response.json();
      setMembers([...members, newMember]);
      setMemberForm({ name: '', email: '', phone: '' });
      setShowMemberForm(false);
      
      // Update member count
      setGuestLists(guestLists.map(list => 
        list.id === selectedList ? { ...list, memberCount: list.memberCount + 1 } : list
      ));
      
      toast({
        title: 'Success',
        description: 'Member added successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add member',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !selectedList) return;

    try {
      const response = await apiRequest(
        `/api/guest-lists/${selectedList}/members/${editingMember.id}`, 
        'PUT', 
        memberForm
      );
      const updatedMember = await response.json();
      setMembers(members.map(member => 
        member.id === editingMember.id ? updatedMember : member
      ));
      setEditingMember(null);
      setMemberForm({ name: '', email: '', phone: '' });
      toast({
        title: 'Success',
        description: 'Member updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update member',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!selectedList) return;
    
    if (!confirm('Are you sure you want to remove this member from the guest list?')) {
      return;
    }

    try {
      await apiRequest(`/api/guest-lists/${selectedList}/members/${memberId}`, 'DELETE');
      setMembers(members.filter(member => member.id !== memberId));
      
      // Update member count
      setGuestLists(guestLists.map(list => 
        list.id === selectedList ? { ...list, memberCount: list.memberCount - 1 } : list
      ));
      
      toast({
        title: 'Success',
        description: 'Member removed successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive'
      });
    }
  };

  const startEditList = (list: GuestListWithMembers) => {
    setEditingList(list);
    setListForm({ name: list.name, description: list.description || '' });
    setShowCreateForm(true);
  };

  const startEditMember = (member: GuestListMember) => {
    setEditingMember(member);
    setMemberForm({ 
      name: member.name, 
      email: member.email, 
      phone: member.phone || '' 
    });
    setShowMemberForm(true);
  };

  const resetForms = () => {
    setShowCreateForm(false);
    setShowMemberForm(false);
    setEditingList(null);
    setEditingMember(null);
    setListForm({ name: '', description: '' });
    setMemberForm({ name: '', email: '', phone: '' });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetForms();
        setSelectedList(null);
        setMembers([]);
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guest Lists Management</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Panel - Guest Lists */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Your Guest Lists</h3>
              <Button
                size="sm"
                onClick={() => setShowCreateForm(true)}
                data-testid="button-create-guest-list"
              >
                <Plus className="h-4 w-4 mr-1" />
                New List
              </Button>
            </div>

            {/* Create/Edit List Form */}
            {showCreateForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingList ? 'Edit Guest List' : 'Create New Guest List'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={editingList ? handleUpdateList : handleCreateList} className="space-y-4">
                    <div>
                      <Label htmlFor="list-name">List Name</Label>
                      <Input
                        id="list-name"
                        placeholder="Family & Friends"
                        value={listForm.name}
                        onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                        required
                        data-testid="input-list-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="list-description">Description (Optional)</Label>
                      <Textarea
                        id="list-description"
                        placeholder="Close friends and family members"
                        value={listForm.description}
                        onChange={(e) => setListForm({ ...listForm, description: e.target.value })}
                        data-testid="textarea-list-description"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" data-testid="button-save-list">
                        {editingList ? 'Update List' : 'Create List'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForms}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Guest Lists */}
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : guestLists.length === 0 ? (
              <Card>
                <CardContent className="text-center py-6">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No guest lists yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {guestLists.map((list) => (
                  <Card
                    key={list.id}
                    className={`cursor-pointer transition-colors ${
                      selectedList === list.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedList(list.id)}
                    data-testid={`card-guest-list-${list.id}`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{list.name}</h4>
                            <Badge variant="secondary">
                              {list.memberCount} member{list.memberCount !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          {list.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {list.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {showInviteOptions && onInviteGuestList && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onInviteGuestList(list.id);
                                setOpen(false);
                              }}
                              data-testid={`button-invite-list-${list.id}`}
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditList(list);
                            }}
                            data-testid={`button-edit-list-${list.id}`}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteList(list.id);
                            }}
                            data-testid={`button-delete-list-${list.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Members */}
          <div className="space-y-4">
            {selectedList ? (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">List Members</h3>
                  <Button
                    size="sm"
                    onClick={() => setShowMemberForm(true)}
                    data-testid="button-add-member"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add Member
                  </Button>
                </div>

                {/* Add/Edit Member Form */}
                {showMemberForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{editingMember ? 'Edit Member' : 'Add New Member'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={editingMember ? handleUpdateMember : handleCreateMember} className="space-y-4">
                        <div>
                          <Label htmlFor="member-name">Name</Label>
                          <Input
                            id="member-name"
                            placeholder="John Doe"
                            value={memberForm.name}
                            onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                            required
                            data-testid="input-member-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="member-email">Email</Label>
                          <Input
                            id="member-email"
                            type="email"
                            placeholder="john@example.com"
                            value={memberForm.email}
                            onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                            required
                            data-testid="input-member-email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="member-phone">Phone (Optional)</Label>
                          <Input
                            id="member-phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={memberForm.phone}
                            onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                            data-testid="input-member-phone"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" data-testid="button-save-member">
                            {editingMember ? 'Update Member' : 'Add Member'}
                          </Button>
                          <Button type="button" variant="outline" onClick={resetForms}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Members List */}
                {members.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-6">
                      <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No members in this list yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <Card key={member.id} data-testid={`card-member-${member.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{member.name}</h4>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                              {member.phone && (
                                <p className="text-sm text-muted-foreground">{member.phone}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditMember(member)}
                                data-testid={`button-edit-member-${member.id}`}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteMember(member.id)}
                                data-testid={`button-delete-member-${member.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Select a guest list to view members</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}