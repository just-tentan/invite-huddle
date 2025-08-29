import { useState, useEffect } from 'react';
import { Megaphone, Plus, Edit, Trash2, Send, Eye, Globe, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: "all_users" | "event_attendees" | "specific_users";
  eventId?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Event {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime?: string;
}

export function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    targetAudience: 'all_users' as "all_users" | "event_attendees" | "specific_users",
    eventId: '',
  });
  const [editForm, setEditForm] = useState<{
    title: string;
    content: string;
    targetAudience: "all_users" | "event_attendees" | "specific_users";
    eventId: string;
  }>({
    title: '',
    content: '',
    targetAudience: 'all_users',
    eventId: '',
  });

  useEffect(() => {
    fetchAnnouncements();
    fetchEvents();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Filter to upcoming events and sort by date
        const upcomingEvents = data
          .filter((event: Event) => new Date(event.startDateTime) >= new Date())
          .sort((a: Event, b: Event) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
        setEvents(upcomingEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!createForm.title.trim() || !createForm.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in title and content",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: createForm.title,
          content: createForm.content,
          targetAudience: createForm.targetAudience,
          eventId: createForm.eventId || undefined,
          sendEmail: true, // Send emails when creating announcement
        }),
      });

      if (response.ok) {
        await fetchAnnouncements();
        setCreateForm({ title: '', content: '', targetAudience: 'all_users', eventId: '' });
        setIsCreateDialogOpen(false);
        toast({
          title: "Announcement Created",
          description: "Your announcement has been created successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create announcement",
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

  const handleEditAnnouncement = async () => {
    if (!selectedAnnouncement || !editForm.title.trim() || !editForm.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in title and content",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/announcements/${selectedAnnouncement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editForm.title,
          content: editForm.content,
          targetAudience: editForm.targetAudience,
          eventId: editForm.eventId || undefined,
        }),
      });

      if (response.ok) {
        await fetchAnnouncements();
        setIsEditDialogOpen(false);
        setSelectedAnnouncement(null);
        toast({
          title: "Announcement Updated",
          description: "Your announcement has been updated successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update announcement",
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

  const handlePublishAnnouncement = async (announcement: Announcement) => {
    try {
      const response = await fetch(`/api/announcements/${announcement.id}/publish`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchAnnouncements();
        toast({
          title: "Announcement Published",
          description: "Your announcement is now visible to users.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to publish announcement",
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

  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    try {
      const response = await fetch(`/api/announcements/${announcement.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchAnnouncements();
        toast({
          title: "Announcement Deleted",
          description: "The announcement has been deleted successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete announcement",
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

  const openEditDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setEditForm({
      title: announcement.title,
      content: announcement.content,
      targetAudience: announcement.targetAudience,
      eventId: announcement.eventId || '',
    });
    setIsEditDialogOpen(true);
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'all_users': return <Globe className="h-3 w-3" />;
      case 'event_attendees': return <Users className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'all_users': return 'All Users';
      case 'event_attendees': return 'Event Attendees';
      default: return 'Specific Users';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Announcements
          </CardTitle>
          <CardDescription>Loading announcements...</CardDescription>
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
              <Megaphone className="h-5 w-5" />
              Announcements ({announcements.length})
            </CardTitle>
            <CardDescription>
              Create and manage announcements for your users
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-create-announcement">
                <Plus className="h-3 w-3 mr-1" />
                Create Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>
                  Create an announcement to share with your users.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="Enter announcement title"
                    data-testid="input-announcement-title"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={createForm.content}
                    onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                    placeholder="Enter announcement content"
                    rows={4}
                    data-testid="textarea-announcement-content"
                  />
                </div>
                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Select
                    value={createForm.targetAudience}
                    onValueChange={(value: any) => setCreateForm({ ...createForm, targetAudience: value })}
                  >
                    <SelectTrigger data-testid="select-announcement-audience">
                      <SelectValue placeholder="Select target audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">All Users</SelectItem>
                      <SelectItem value="event_attendees">Event Attendees</SelectItem>
                      <SelectItem value="specific_users">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(createForm.targetAudience === 'event_attendees') && (
                  <div>
                    <Label htmlFor="eventId">Select Event</Label>
                    <Select
                      value={createForm.eventId}
                      onValueChange={(value) => setCreateForm({ ...createForm, eventId: value })}
                    >
                      <SelectTrigger data-testid="select-announcement-event">
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title} - {new Date(event.startDateTime).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAnnouncement} data-testid="button-confirm-create-announcement">
                  Create Announcement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No announcements yet</p>
            <p className="text-sm">Create announcements to communicate with your users</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg" data-testid={`text-announcement-title-${announcement.id}`}>
                      {announcement.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1" data-testid={`text-announcement-content-${announcement.id}`}>
                      {announcement.content.length > 150 
                        ? `${announcement.content.slice(0, 150)}...` 
                        : announcement.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!announcement.isPublished && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublishAnnouncement(announcement)}
                        data-testid={`button-publish-${announcement.id}`}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Publish
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(announcement)}
                      data-testid={`button-edit-${announcement.id}`}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAnnouncement(announcement)}
                      data-testid={`button-delete-${announcement.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  <Badge 
                    className={`flex items-center gap-1 ${
                      announcement.isPublished 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                    data-testid={`badge-status-${announcement.id}`}
                  >
                    {announcement.isPublished ? <Eye className="h-3 w-3" /> : <Edit className="h-3 w-3" />}
                    {announcement.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1" data-testid={`badge-audience-${announcement.id}`}>
                    {getAudienceIcon(announcement.targetAudience)}
                    {getAudienceLabel(announcement.targetAudience)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Created {formatDate(announcement.createdAt)}
                  </span>
                  {announcement.isPublished && announcement.publishedAt && (
                    <span className="text-xs text-muted-foreground">
                      • Published {formatDate(announcement.publishedAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>
              Update your announcement details.
            </DialogDescription>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Enter announcement title"
                  data-testid="input-edit-announcement-title"
                />
              </div>
              <div>
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  placeholder="Enter announcement content"
                  rows={4}
                  data-testid="textarea-edit-announcement-content"
                />
              </div>
              <div>
                <Label htmlFor="edit-targetAudience">Target Audience</Label>
                <Select
                  value={editForm.targetAudience}
                  onValueChange={(value: any) => setEditForm({ ...editForm, targetAudience: value })}
                >
                  <SelectTrigger data-testid="select-edit-announcement-audience">
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_users">All Users</SelectItem>
                    <SelectItem value="event_attendees">Event Attendees</SelectItem>
                    <SelectItem value="specific_users">Specific Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-eventId">Related Event ID (optional)</Label>
                <Input
                  id="edit-eventId"
                  value={editForm.eventId}
                  onChange={(e) => setEditForm({ ...editForm, eventId: e.target.value })}
                  placeholder="Enter event ID (optional)"
                  data-testid="input-edit-announcement-event-id"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAnnouncement} data-testid="button-confirm-edit-announcement">
              Update Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}