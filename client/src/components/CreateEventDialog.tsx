import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, Users, FolderOpen } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { GuestListsDialog } from './GuestListsDialog';
import { EventGroupsDialog } from './EventGroupsDialog';
import type { EventGroup, GuestListMember } from '@shared/schema';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated: () => void;
}

export const CreateEventDialog = ({ open, onOpenChange, onEventCreated }: CreateEventDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    exactAddress: '',
    guests: [{ email: '', name: '' }],
    groupId: null as string | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<EventGroup | null>(null);
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([]);

  useEffect(() => {
    if (open) {
      fetchEventGroups();
    }
  }, [open]);

  const fetchEventGroups = async () => {
    try {
      const response = await fetch('/api/event-groups', {
        credentials: 'include'
      });
      if (response.ok) {
        const groups = await response.json();
        setEventGroups(groups);
      }
    } catch (error) {
      console.error('Failed to fetch event groups:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      exactAddress: '',
      guests: [{ email: '', name: '' }],
      groupId: null,
    });
    setSelectedGroup(null);
  };

  const handleSelectGroup = (groupId: string) => {
    const group = eventGroups.find(g => g.id === groupId) || null;
    setSelectedGroup(group);
    setFormData(prev => ({ ...prev, groupId: groupId || null }));
  };

  const handleInviteFromGuestList = async (guestListId: string) => {
    try {
      const response = await fetch(`/api/guest-lists/${guestListId}/members`, {
        credentials: 'include'
      });
      if (response.ok) {
        const members: GuestListMember[] = await response.json();
        const guestsToAdd = members.map(member => ({
          email: member.email,
          name: member.name
        }));
        
        // Replace current guests or add to existing ones
        setFormData(prev => ({ ...prev, guests: guestsToAdd }));
        
        toast({
          title: 'Success',
          description: `Added ${members.length} guests from the list`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load guests from list',
        variant: 'destructive'
      });
    }
  };

  const addGuestField = () => {
    setFormData(prev => ({ ...prev, guests: [...prev.guests, { email: '', name: '' }] }));
  };

  const removeGuestField = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      guests: prev.guests.filter((_, i) => i !== index)
    }));
  };

  const updateGuest = (index: number, field: 'email' | 'name', value: string) => {
    setFormData(prev => ({
      ...prev,
      guests: prev.guests.map((guest, i) => i === index ? { ...guest, [field]: value } : guest)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          dateTime: dateTime.toISOString(),
          location: formData.location || null,
          exactAddress: formData.exactAddress || null,
          groupId: formData.groupId || null,
          guests: formData.guests.filter(guest => guest.email.trim()).map(guest => ({
            email: guest.email.trim(),
            name: guest.name.trim() || null
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      toast({
        title: "Event Created",
        description: "Your event has been created successfully!",
      });

      resetForm();
      onOpenChange(false);
      onEventCreated();
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Set up a new private event and invite your guests.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="Summer BBQ Party"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Join us for a fun summer BBQ with great food and company!"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Community Center"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exactAddress">Exact Address (Optional)</Label>
            <Input
              id="exactAddress"
              placeholder="123 Main St, City, State 12345"
              value={formData.exactAddress}
              onChange={(e) => handleInputChange('exactAddress', e.target.value)}
              data-testid="input-exact-address"
            />
            <p className="text-xs text-muted-foreground">
              Provide the specific address for better directions and location mapping
            </p>
          </div>

          <div className="space-y-2">
            <Label>Event Group (Optional)</Label>
            <div className="flex gap-2">
              <EventGroupsDialog
                showSelectOptions={true}
                selectedGroupId={formData.groupId}
                onSelectGroup={handleSelectGroup}
              >
                <Button type="button" variant="outline" className="flex-1" data-testid="button-select-group">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {selectedGroup ? selectedGroup.title : 'Select Group'}
                </Button>
              </EventGroupsDialog>
              {selectedGroup && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectGroup('')}
                  data-testid="button-clear-group"
                >
                  ✕
                </Button>
              )}
            </div>
            {selectedGroup && (
              <p className="text-xs text-muted-foreground">
                Selected: {selectedGroup.title}
                {selectedGroup.description && ` - ${selectedGroup.description}`}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Guest Invitations</Label>
              <GuestListsDialog
                showInviteOptions={true}
                onInviteGuestList={handleInviteFromGuestList}
              >
                <Button type="button" variant="outline" size="sm" data-testid="button-load-guest-list">
                  <Users className="h-3 w-3 mr-1" />
                  Load from List
                </Button>
              </GuestListsDialog>
            </div>
            <div className="space-y-3">
              {formData.guests.map((guest, index) => (
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
                    {formData.guests.length > 1 && (
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
                    {index === formData.guests.length - 1 && (
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
              Add guest names and email addresses to send personalized invitations. Names are optional but make emails more personal.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};