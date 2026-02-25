import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Link } from 'wouter';
import { Calendar, MapPin, Users, MessageCircle, ArrowLeft, Copy, CheckCircle, Mail, Plus, Send, Minus, Edit, Trash2, X, MoreVertical, UserMinus, Ban, MessageSquareOff } from 'lucide-react';
import { AddToCalendar } from '@/components/AddToCalendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { EventChat } from '@/components/EventChat';
import { CollaboratorManager } from '@/components/CollaboratorManager';

interface Event {
  id: string;
  title: string;
  description: string | null;
  startDateTime: string;
  endDateTime: string | null;
  isAllDay: boolean;
  location: string | null;
  exactAddress: string | null;
  customDirections: string | null;
  status: string | null;
}

interface Invitation {
  id: string;
  token: string;
  email: string | null;
  name: string | null;
  rsvpStatus: "pending" | "yes" | "no" | "maybe";
  isSuspended: boolean | null;
  messageBlocked: boolean | null;
}

const EventManage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [isAddingInvitations, setIsAddingInvitations] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendingInvitations, setResendingInvitations] = useState<Set<string>>(new Set());
  const [newGuests, setNewGuests] = useState([{ email: '', name: '' }]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    isAllDay: false,
    location: '',
    exactAddress: '',
    customDirections: ''
  });
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchEventData();
    }
  }, [user, id]);

  useEffect(() => {
    if (event && isEditDialogOpen) {
      setEditForm({
        title: event.title,
        description: event.description || '',
        startDateTime: new Date(event.startDateTime).toISOString().slice(0, 16),
        endDateTime: event.endDateTime ? new Date(event.endDateTime).toISOString().slice(0, 16) : '',
        isAllDay: event.isAllDay,
        location: event.location || '',
        exactAddress: event.exactAddress || '',
        customDirections: event.customDirections || ''
      });
    }
  }, [event, isEditDialogOpen]);

  const fetchEventData = async () => {
    try {
      const [eventRes, invitationsRes] = await Promise.all([
        fetch(`/api/events/${id}`, { credentials: 'include' }),
        fetch(`/api/events/${id}/invitations`, { credentials: 'include' })
      ]);

      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvent(eventData);
      }

      if (invitationsRes.ok) {
        const invitationsData = await invitationsRes.json();
        setInvitations(invitationsData);
      }
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setLoadingEvent(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Link copied!",
      description: "The invitation link has been copied to your clipboard.",
    });
  };

  const formatDate = (startDateString: string, endDateString?: string | null, isAllDay: boolean = false) => {
    if (!startDateString) return 'Invalid Date';
    
    const startDate = new Date(startDateString);
    if (isNaN(startDate.getTime())) return 'Invalid Date';
    
    const formatOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    if (!isAllDay) {
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
    }
    
    let dateStr = startDate.toLocaleDateString('en-US', formatOptions);
    
    if (endDateString) {
      const endDate = new Date(endDateString);
      if (!isNaN(endDate.getTime())) {
        if (startDate.toDateString() === endDate.toDateString()) {
          // Same day event - show end time only
          if (!isAllDay) {
            const endTimeStr = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            dateStr += ` - ${endTimeStr}`;
          }
        } else {
          // Multi-day event
          const endDateStr = endDate.toLocaleDateString('en-US', formatOptions);
          dateStr += ` - ${endDateStr}`;
        }
      }
    }
    
    if (isAllDay) {
      dateStr += ' (All Day)';
    }
    
    return dateStr;
  };

  const getRSVPBadgeColor = (status: string) => {
    switch (status) {
      case 'yes': return 'bg-green-100 text-green-800';
      case 'no': return 'bg-red-100 text-red-800';
      case 'maybe': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRSVPCounts = () => {
    return {
      yes: invitations.filter(i => i.rsvpStatus === 'yes').length,
      no: invitations.filter(i => i.rsvpStatus === 'no').length,
      maybe: invitations.filter(i => i.rsvpStatus === 'maybe').length,
      pending: invitations.filter(i => i.rsvpStatus === 'pending').length
    };
  };

  const getPendingInvitationsCount = () => {
    return invitations.filter(i => i.rsvpStatus === 'pending').length;
  };

  const resendInvitations = async () => {
    if (!id) return;
    
    setIsResending(true);
    try {
      const response = await fetch(`/api/events/${id}/resend-invitations`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Invitations Sent",
          description: result.message || "Pending invitation emails have been resent successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to resend invitations. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const resendSingleInvitation = async (invitationId: string) => {
    if (!id) return;

    setResendingInvitations(prev => new Set(prev).add(invitationId));
    try {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "Invitation Sent",
          description: "The invitation email has been resent successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to resend invitation. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendingInvitations(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  const addNewInvitations = async () => {
    if (!id) return;

    const validGuests = newGuests.filter(guest => guest.email.trim() && guest.email.includes('@'));
    if (validGuests.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingInvitations(true);
    try {
      const response = await fetch(`/api/events/${id}/add-invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ guests: validGuests.map(guest => ({ email: guest.email.trim(), name: guest.name.trim() || null })) }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Invitations Added",
          description: `${result.invitations.length} new invitations sent successfully.`,
        });
        setNewGuests([{ email: '', name: '' }]);
        fetchEventData(); // Refresh the invitations list
      } else {
        toast({
          title: "Error",
          description: "Failed to add invitations. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingInvitations(false);
    }
  };

  const addGuestField = () => {
    setNewGuests(prev => [...prev, { email: '', name: '' }]);
  };

  const removeGuestField = (index: number) => {
    setNewGuests(prev => prev.filter((_, i) => i !== index));
  };

  const updateGuest = (index: number, field: 'email' | 'name', value: string) => {
    setNewGuests(prev => prev.map((guest, i) => i === index ? { ...guest, [field]: value } : guest));
  };

  const handleEditEvent = async () => {
    if (!editForm.title || !editForm.startDateTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsEditing(true);
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description || null,
          startDateTime: editForm.startDateTime,
          endDateTime: editForm.endDateTime || null,
          isAllDay: editForm.isAllDay,
          location: editForm.location || null,
          exactAddress: editForm.exactAddress || null,
          customDirections: editForm.customDirections || null,
        }),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setEvent(updatedEvent);
        setIsEditDialogOpen(false);
        toast({
          title: "Event Updated",
          description: "Your event has been updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update event. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelEvent = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/events/${id}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setEvent(result.event);
        setIsCancelDialogOpen(false);
        toast({
          title: "Event Cancelled",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to cancel event. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        toast({
          title: "Event Deleted",
          description: "The event has been permanently deleted.",
        });
        // Redirect to dashboard after successful deletion
        window.location.href = '/dashboard';
      } else {
        toast({
          title: "Error",
          description: "Failed to delete event. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveGuest = async (invitationId: string, guestName: string) => {
    try {
      const response = await fetch(`/api/events/${id}/guests/${invitationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchEventData(); // Refresh invitations
        toast({
          title: "Guest Removed",
          description: `${guestName} has been removed from the event.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to remove guest. Please try again.",
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

  const handleSuspendGuest = async (invitationId: string, guestName: string, suspend: boolean) => {
    try {
      const response = await fetch(`/api/events/${id}/guests/${invitationId}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ suspended: suspend }),
      });

      if (response.ok) {
        await fetchEventData(); // Refresh invitations
        toast({
          title: suspend ? "Guest Suspended" : "Suspension Removed",
          description: suspend 
            ? `${guestName} has been suspended from the event.`
            : `${guestName}'s suspension has been removed.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update guest status. Please try again.",
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

  const handleBlockGuest = async (invitationId: string, guestName: string, block: boolean) => {
    try {
      const response = await fetch(`/api/events/${id}/guests/${invitationId}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ blocked: block }),
      });

      if (response.ok) {
        await fetchEventData(); // Refresh invitations
        toast({
          title: block ? "Guest Blocked" : "Block Removed",
          description: block 
            ? `${guestName} has been blocked from messaging.`
            : `${guestName}'s messaging block has been removed.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update guest status. Please try again.",
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

  if (loading || loadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/auth';
    return null;
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">This event doesn't exist or you don't have access to it.</p>
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rsvpCounts = getRSVPCounts();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Event Management</h1>
              <p className="text-muted-foreground">Manage your event and invitations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{event.title}</CardTitle>
                    <CardDescription>Event Details</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditDialogOpen(true)}
                      data-testid="button-edit-event"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    
                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" data-testid="button-event-actions">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsCancelDialogOpen(true)} data-testid="menu-cancel-event">
                          <Ban className="h-4 w-4 mr-2" />
                          Cancel Event
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setIsDeleteDialogOpen(true)} 
                          className="text-destructive focus:text-destructive"
                          data-testid="menu-delete-event"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.description && (
                  <p className="text-muted-foreground">{event.description}</p>
                )}
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(event.startDateTime, event.endDateTime, event.isAllDay)}</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <AddToCalendar
                    title={event.title}
                    description={event.description}
                    startDateTime={event.startDateTime}
                    endDateTime={event.endDateTime}
                    location={event.location}
                    isAllDay={event.isAllDay}
                  />
                </div>
              </CardContent>
            </Card>

            {/* RSVP Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  RSVP Summary
                </CardTitle>
                <CardDescription>
                  {invitations.length} total invitations sent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{rsvpCounts.yes}</div>
                    <div className="text-sm text-green-600">Yes</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-700">{rsvpCounts.maybe}</div>
                    <div className="text-sm text-yellow-600">Maybe</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-700">{rsvpCounts.no}</div>
                    <div className="text-sm text-red-600">No</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-700">{rsvpCounts.pending}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Chat */}
            <EventChat eventId={event.id} />
          </div>

          {/* Invitations List */}
          <div className="space-y-6">
            {/* Event Collaborators */}
            <CollaboratorManager eventId={event.id} />
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Invitations</CardTitle>
                    <CardDescription>
                      Manage your event invitations
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resendInvitations}
                      disabled={isResending || getPendingInvitationsCount() === 0}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {isResending ? 'Sending...' : `Resend Pending (${getPendingInvitationsCount()})`}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Guests
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add New Invitations</DialogTitle>
                          <DialogDescription>
                            Add email addresses to send new invitations for this event.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Guest Invitations</Label>
                            <div className="space-y-3">
                              {newGuests.map((guest, index) => (
                                <div key={index} className="space-y-2 p-3 border rounded-md">
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <Input
                                        placeholder="Guest Name (optional)"
                                        value={guest.name}
                                        onChange={(e) => updateGuest(index, 'name', e.target.value)}
                                        data-testid={`input-guest-name-${index}`}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <Input
                                        placeholder="guest@example.com"
                                        value={guest.email}
                                        onChange={(e) => updateGuest(index, 'email', e.target.value)}
                                        type="email"
                                        data-testid={`input-guest-email-${index}`}
                                      />
                                    </div>
                                    {newGuests.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => removeGuestField(index)}
                                        data-testid={`button-remove-guest-${index}`}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {index === newGuests.length - 1 && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={addGuestField}
                                        data-testid="button-add-guest"
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Add guest names and email addresses to send personalized invitations.
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={addNewInvitations}
                            disabled={isAddingInvitations}
                            className="w-full"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            {isAddingInvitations ? 'Sending...' : 'Send Invitations'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {invitations.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No invitations sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {invitation.name ? `${invitation.name} (${invitation.email})` : invitation.email || 'Anonymous Guest'}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge 
                              className={`text-xs ${getRSVPBadgeColor(invitation.rsvpStatus)}`}
                              variant="secondary"
                            >
                              {invitation.rsvpStatus.toUpperCase()}
                            </Badge>
                            {invitation.isSuspended && (
                              <Badge variant="destructive" className="text-xs">
                                SUSPENDED
                              </Badge>
                            )}
                            {invitation.messageBlocked && (
                              <Badge variant="outline" className="text-xs">
                                NO MESSAGES
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          {invitation.rsvpStatus === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resendSingleInvitation(invitation.id)}
                              disabled={resendingInvitations.has(invitation.id)}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyInviteLink(invitation.token)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" data-testid={`button-guest-menu-${invitation.id}`}>
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleSuspendGuest(
                                  invitation.id,
                                  invitation.name || invitation.email || 'Anonymous Guest',
                                  !invitation.isSuspended
                                )}
                              >
                                <Ban className="h-3 w-3 mr-2" />
                                {invitation.isSuspended ? 'Remove Suspension' : 'Suspend Guest'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleBlockGuest(
                                  invitation.id,
                                  invitation.name || invitation.email || 'Anonymous Guest',
                                  !invitation.messageBlocked
                                )}
                              >
                                <MessageSquareOff className="h-3 w-3 mr-2" />
                                {invitation.messageBlocked ? 'Allow Messages' : 'Block Messages'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRemoveGuest(
                                  invitation.id,
                                  invitation.name || invitation.email || 'Anonymous Guest'
                                )}
                                className="text-destructive focus:text-destructive"
                              >
                                <UserMinus className="h-3 w-3 mr-2" />
                                Remove Guest
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Make changes to your event details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Event Title *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter event title"
                data-testid="input-edit-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Event description (optional)"
                data-testid="input-edit-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-datetime">Date & Time *</Label>
              <Input
                id="edit-datetime"
                type="datetime-local"
                value={editForm.startDateTime}
                onChange={(e) => setEditForm(prev => ({ ...prev, startDateTime: e.target.value }))}
                data-testid="input-edit-datetime"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editForm.location}
                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Event location (optional)"
                data-testid="input-edit-location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Exact Address</Label>
              <Input
                id="edit-address"
                value={editForm.exactAddress}
                onChange={(e) => setEditForm(prev => ({ ...prev, exactAddress: e.target.value }))}
                placeholder="Full address for navigation (optional)"
                data-testid="input-edit-address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditEvent} disabled={isEditing}>
              {isEditing ? 'Updating...' : 'Update Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Event Confirmation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this event? This action cannot be undone and cancellation emails will be sent to all guests who have RSVP'd "Yes".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex items-center gap-2 text-destructive">
                <X className="h-4 w-4" />
                <span className="font-semibold">This will:</span>
              </div>
              <ul className="mt-2 text-sm text-destructive/80 space-y-1 ml-6">
                <li>• Mark the event as cancelled</li>
                <li>• Send cancellation emails to all "Yes" RSVPs</li>
                <li>• Make the event non-editable</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Keep Event
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelEvent} 
              disabled={isCancelling}
              data-testid="button-confirm-cancel"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Event Permanently</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this event? This action cannot be undone and all data will be lost.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-4 w-4" />
                <span className="font-semibold">This will permanently:</span>
              </div>
              <ul className="mt-2 text-sm text-destructive/80 space-y-1 ml-6">
                <li>• Delete the event and all its data</li>
                <li>• Remove all invitations and RSVPs</li>
                <li>• Delete all chat messages</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Keep Event
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEvent} 
              disabled={isDeleting}
              data-testid="button-confirm-delete"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventManage;