import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Plus, Calendar, Users, MessageCircle, LogOut, User, Search, Filter, FolderOpen, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { HostProfileDialog } from '@/components/HostProfileDialog';
import { GuestListsDialog } from '@/components/GuestListsDialog';
import { EventGroupsDialog } from '@/components/EventGroupsDialog';
import { AnnouncementManager } from '@/components/AnnouncementManager';
import { PollManager } from '@/components/PollManager';
import type { Host } from '@shared/schema';

interface Event {
  id: string;
  title: string;
  description: string | null;
  startDateTime: string;
  endDateTime: string | null;
  isAllDay: boolean;
  location: string | null;
  created_at: string;
  status: string | null;
  rsvpCounts: {
    total: number;
    yes: number;
    no: number;
    maybe: number;
    pending: number;
  };
  messageCount: number;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [host, setHost] = useState<Host | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [eventGroups, setEventGroups] = useState([]);
  const [eventGroupFilter, setEventGroupFilter] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchHostProfile();
    }
  }, [user]);

  const fetchHostProfile = async () => {
    try {
      const response = await fetch('/api/host/profile', {
        credentials: 'include',
      });

      if (response.ok) {
        const hostData = await response.json();
        setHost(hostData);
      }
    } catch (error) {
      console.error('Error fetching host profile:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Map API response to interface format
        const formattedEvents = data.map((event: any) => ({
          ...event,
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
          isAllDay: event.isAllDay,
          created_at: event.createdAt,
          rsvpCounts: event.rsvpCounts,
          messageCount: event.messageCount
        }));
        setEvents(formattedEvents);
      } else {
        console.error('Error fetching events:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/auth';
    return null;
  }

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

  const getEventStatus = (event: Event) => {
    if (event.status === 'cancelled') return 'cancelled';
    return new Date(event.startDateTime) > new Date() ? 'upcoming' : 'past';
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const eventStatus = getEventStatus(event);
    const matchesFilter = filterStatus === 'all' || eventStatus === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {host?.pictureUrl && (
              <img
                src={host.pictureUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-border"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">EventHost</h1>
              <p className="text-muted-foreground">
                Welcome back, {host?.preferredName || host?.firstName || user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {host && (
              <HostProfileDialog
                host={host}
                onHostUpdate={(updatedHost) => {
                  setHost(updatedHost);
                }}
              >
                <Button variant="outline" data-testid="button-edit-profile">
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </HostProfileDialog>
            )}
            
            <GuestListsDialog>
              <Button variant="outline" size="sm" data-testid="button-manage-guest-lists">
                <UserPlus className="h-4 w-4 mr-2" />
                Guest Lists
              </Button>
            </GuestListsDialog>
            
            <EventGroupsDialog>
              <Button variant="outline" size="sm" data-testid="button-manage-event-groups">
                <FolderOpen className="h-4 w-4 mr-2" />
                Event Groups
              </Button>
            </EventGroupsDialog>
            
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2"
              data-testid="button-create-event"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
            <Button
              variant="outline"
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Your Events</h2>
          <p className="text-muted-foreground">
            Manage your private group events and invitations
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search events by title, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-events"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === 'upcoming' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('upcoming')}
              data-testid="button-filter-upcoming"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Upcoming ({events.filter(e => getEventStatus(e) === 'upcoming').length})
            </Button>
            <Button
              variant={filterStatus === 'past' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('past')}
              data-testid="button-filter-past"
            >
              <Filter className="h-3 w-3 mr-1" />
              Past ({events.filter(e => getEventStatus(e) === 'past').length})
            </Button>
            <Button
              variant={filterStatus === 'cancelled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('cancelled')}
              data-testid="button-filter-cancelled"
            >
              Cancelled ({events.filter(e => getEventStatus(e) === 'cancelled').length})
            </Button>
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
              data-testid="button-filter-all"
            >
              All Events ({events.length})
            </Button>
          </div>
        </div>

        {loadingEvents ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredEvents.length === 0 && events.length > 0 ? (
          <Card className="text-center py-8">
            <CardContent className="pt-6">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : events.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent className="pt-6">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No events yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first private event to get started
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <Badge 
                      variant={
                        getEventStatus(event) === 'cancelled' ? 'destructive' :
                        getEventStatus(event) === 'upcoming' ? 'default' : 'secondary'
                      }
                    >
                      {getEventStatus(event) === 'cancelled' ? 'Cancelled' :
                       getEventStatus(event) === 'upcoming' ? 'Upcoming' : 'Past'}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {formatDate(event.startDateTime, event.endDateTime, event.isAllDay)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  {event.location && (
                    <p className="text-sm mb-3">📍 {event.location}</p>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.rsvpCounts.yes}/{event.rsvpCounts.total} attending
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {event.messageCount} messages
                      </span>
                    </div>
                    <Link to={`/events/${event.id}/manage`}>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Management Features Section */}
      <div className="container mx-auto px-4 pb-8 space-y-8">
        <AnnouncementManager />
        <PollManager />
      </div>

      <CreateEventDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onEventCreated={fetchEvents}
      />
    </div>
  );
};

export default Dashboard;