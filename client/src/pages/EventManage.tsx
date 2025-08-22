import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, MessageCircle, ArrowLeft, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { EventChat } from '@/components/EventChat';

interface Event {
  id: string;
  title: string;
  description: string | null;
  dateTime: string;
  location: string | null;
}

interface Invitation {
  id: string;
  token: string;
  email: string | null;
  rsvpStatus: "pending" | "yes" | "no" | "maybe";
}

const EventManage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingEvent, setLoadingEvent] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchEventData();
    }
  }, [user, id]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    return <Navigate to="/auth" replace />;
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
                <CardTitle className="text-2xl">{event.title}</CardTitle>
                <CardDescription>Event Details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.description && (
                  <p className="text-muted-foreground">{event.description}</p>
                )}
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(event.dateTime)}</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                  )}
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
            <Card>
              <CardHeader>
                <CardTitle>Invitations</CardTitle>
                <CardDescription>
                  Manage your event invitations
                </CardDescription>
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
                            {invitation.email || 'Anonymous Guest'}
                          </p>
                          <Badge 
                            className={`text-xs mt-1 ${getRSVPBadgeColor(invitation.rsvpStatus)}`}
                            variant="secondary"
                          >
                            {invitation.rsvpStatus.toUpperCase()}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyInviteLink(invitation.token)}
                          className="ml-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventManage;