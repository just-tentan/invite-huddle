import { useState, useEffect } from 'react';
import { BarChart3, Plus, Edit, Trash2, Play, Square, RefreshCw, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';

interface Poll {
  id: string;
  title: string;
  description?: string;
  options: string[];
  allowMultipleChoices: boolean;
  endDate: string;
  status: "active" | "ended" | "converted";
  convertedEventId?: string;
  createdAt: string;
  updatedAt: string;
  voteCounts?: number[];
  totalVotes?: number;
}

interface GuestList {
  id: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  email: string;
}

export function PollManager() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [guestLists, setGuestLists] = useState<GuestList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    options: ['', ''],
    allowMultipleChoices: false,
    endDate: '',
    notifyGuestLists: [] as string[],
    sendNotifications: true,
  });
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    options: ['', ''],
    allowMultipleChoices: false,
    endDate: '',
    notifyGuestLists: [] as string[],
    sendNotifications: false,
  });
  const [voteForm, setVoteForm] = useState({
    voterName: '',
    voterEmail: '',
    selectedOptions: [] as string[],
  });
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [convertForm, setConvertForm] = useState({
    title: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    location: '',
    isAllDay: false,
  });

  useEffect(() => {
    fetchPolls();
    fetchGuestLists();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await fetch('/api/polls', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPolls(data);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuestLists = async () => {
    try {
      const response = await fetch('/api/guest-lists', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setGuestLists(data);
      }
    } catch (error) {
      console.error('Error fetching guest lists:', error);
    }
  };

  const fetchPollDetails = async (pollId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}`);

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error fetching poll details:', error);
    }
    return null;
  };

  const handleCreatePoll = async () => {
    if (!createForm.title.trim() || !createForm.endDate) {
      toast({
        title: "Error",
        description: "Please fill in title and end date",
        variant: "destructive",
      });
      return;
    }

    const validOptions = createForm.options.filter(option => option.trim() !== '');
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Please provide at least 2 options",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description || undefined,
          options: validOptions,
          allowMultipleChoices: createForm.allowMultipleChoices,
          endDate: createForm.endDate,
          sendEmail: createForm.sendNotifications,
          notifyGuestListIds: createForm.sendNotifications ? createForm.notifyGuestLists : [],
        }),
      });

      if (response.ok) {
        await fetchPolls();
        setCreateForm({
          title: '',
          description: '',
          options: ['', ''],
          allowMultipleChoices: false,
          endDate: '',
          notifyGuestLists: [],
          sendNotifications: true,
        });
        setIsCreateDialogOpen(false);
        toast({
          title: "Poll Created",
          description: "Your poll has been created successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create poll",
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

  const handleEndPoll = async (poll: Poll) => {
    try {
      const response = await fetch(`/api/polls/${poll.id}/end`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchPolls();
        toast({
          title: "Poll Ended",
          description: "The poll has been ended successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to end poll",
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

  const openEditDialog = (poll: Poll) => {
    setSelectedPoll(poll);
    // Format the date for datetime-local input (YYYY-MM-DDTHH:MM)
    const formatDateForInput = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    };
    
    setEditForm({
      title: poll.title,
      description: poll.description || '',
      options: [...poll.options],
      allowMultipleChoices: poll.allowMultipleChoices,
      endDate: formatDateForInput(poll.endDate),
      notifyGuestLists: [],
      sendNotifications: false,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditPoll = async () => {
    if (!selectedPoll || !editForm.title.trim() || !editForm.endDate) {
      toast({
        title: "Error",
        description: "Please fill in title and end date",
        variant: "destructive",
      });
      return;
    }

    const validOptions = editForm.options.filter(option => option.trim() !== '');
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Please provide at least 2 options",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/polls/${selectedPoll.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description || undefined,
          options: validOptions,
          allowMultipleChoices: editForm.allowMultipleChoices,
          endDate: editForm.endDate,
          sendEmail: editForm.sendNotifications,
          notifyGuestListIds: editForm.sendNotifications ? editForm.notifyGuestLists : [],
        }),
      });

      if (response.ok) {
        await fetchPolls();
        setIsEditDialogOpen(false);
        toast({
          title: "Poll Updated",
          description: editForm.sendNotifications ? "Poll updated and notifications sent!" : "Poll updated successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update poll",
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

  const addEditOption = () => {
    setEditForm(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeEditOption = (index: number) => {
    if (editForm.options.length > 2) {
      setEditForm(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateEditOption = (index: number, value: string) => {
    setEditForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleConvertToEvent = async () => {
    if (!selectedPoll || !convertForm.title.trim() || !convertForm.startDateTime) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/polls/${selectedPoll.id}/convert-to-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          eventData: {
            title: convertForm.title,
            description: convertForm.description || undefined,
            startDateTime: convertForm.startDateTime,
            endDateTime: convertForm.endDateTime || undefined,
            location: convertForm.location || undefined,
            isAllDay: convertForm.isAllDay,
          },
        }),
      });

      if (response.ok) {
        await fetchPolls();
        setIsConvertDialogOpen(false);
        setSelectedPoll(null);
        setConvertForm({
          title: '',
          description: '',
          startDateTime: '',
          endDateTime: '',
          location: '',
          isAllDay: false,
        });
        toast({
          title: "Poll Converted",
          description: "The poll has been converted to an event successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to convert poll",
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

  const handleDeletePoll = async (poll: Poll) => {
    try {
      const response = await fetch(`/api/polls/${poll.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchPolls();
        toast({
          title: "Poll Deleted",
          description: "The poll has been deleted successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete poll",
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

  const handleVote = async () => {
    if (!selectedPoll || voteForm.selectedOptions.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one option",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/polls/${selectedPoll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterName: voteForm.voterName || undefined,
          voterEmail: voteForm.voterEmail || undefined,
          selectedOptions: voteForm.selectedOptions,
        }),
      });

      if (response.ok) {
        setIsVoteDialogOpen(false);
        setSelectedPoll(null);
        setVoteForm({ voterName: '', voterEmail: '', selectedOptions: [] });
        toast({
          title: "Vote Recorded",
          description: "Your vote has been recorded successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to record vote",
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

  const openVoteDialog = async (poll: Poll) => {
    const pollWithVotes = await fetchPollDetails(poll.id);
    if (pollWithVotes) {
      setSelectedPoll(pollWithVotes);
      setIsVoteDialogOpen(true);
    }
  };
  
  const openConvertDialog = async (poll: Poll) => {
    const pollWithVotes = await fetchPollDetails(poll.id);
    if (pollWithVotes) {
      setSelectedPoll(pollWithVotes);
      setConvertForm({
        title: poll.title,
        description: poll.description || '',
        startDateTime: '',
        endDateTime: '',
        location: '',
        isAllDay: false,
      });
      setIsConvertDialogOpen(true);
    }
  };

  const addOption = () => {
    setCreateForm({ ...createForm, options: [...createForm.options, ''] });
  };

  const removeOption = (index: number) => {
    if (createForm.options.length > 2) {
      const newOptions = createForm.options.filter((_, i) => i !== index);
      setCreateForm({ ...createForm, options: newOptions });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...createForm.options];
    newOptions[index] = value;
    setCreateForm({ ...createForm, options: newOptions });
  };

  const toggleVoteOption = (optionIndex: string) => {
    if (!selectedPoll) return;

    if (selectedPoll.allowMultipleChoices) {
      const newSelectedOptions = voteForm.selectedOptions.includes(optionIndex)
        ? voteForm.selectedOptions.filter(o => o !== optionIndex)
        : [...voteForm.selectedOptions, optionIndex];
      setVoteForm({ ...voteForm, selectedOptions: newSelectedOptions });
    } else {
      setVoteForm({ ...voteForm, selectedOptions: [optionIndex] });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'converted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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

  const isPollExpired = (endDate: string) => {
    return new Date() > new Date(endDate);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Polls
          </CardTitle>
          <CardDescription>Loading polls...</CardDescription>
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
              <BarChart3 className="h-5 w-5" />
              Polls ({polls.length})
            </CardTitle>
            <CardDescription>
              Create polls to gauge interest before creating events
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-create-poll">
                <Plus className="h-3 w-3 mr-1" />
                Create Poll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Poll</DialogTitle>
                <DialogDescription>
                  Create a poll to gauge interest before creating an event.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="Enter poll title"
                    data-testid="input-poll-title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Enter poll description"
                    rows={3}
                    data-testid="textarea-poll-description"
                  />
                </div>
                <div>
                  <Label>Options</Label>
                  <div className="space-y-2 mt-2">
                    {createForm.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          data-testid={`input-poll-option-${index}`}
                        />
                        {createForm.options.length > 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeOption(index)}
                            data-testid={`button-remove-option-${index}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      data-testid="button-add-option"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowMultiple"
                    checked={createForm.allowMultipleChoices}
                    onCheckedChange={(checked) => 
                      setCreateForm({ ...createForm, allowMultipleChoices: checked as boolean })
                    }
                    data-testid="checkbox-allow-multiple"
                  />
                  <Label htmlFor="allowMultiple">Allow multiple choices</Label>
                </div>
                <div>
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    data-testid="input-poll-end-date"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendNotifications"
                    checked={createForm.sendNotifications}
                    onCheckedChange={(checked) => 
                      setCreateForm({ ...createForm, sendNotifications: checked as boolean })
                    }
                    data-testid="checkbox-send-notifications"
                  />
                  <Label htmlFor="sendNotifications">Send poll notification emails</Label>
                </div>
                {createForm.sendNotifications && (
                  <div>
                    <Label>Notify Guest Lists</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between mt-2"
                          data-testid="button-select-guest-lists"
                        >
                          {createForm.notifyGuestLists.length > 0
                            ? `${createForm.notifyGuestLists.length} guest list${createForm.notifyGuestLists.length !== 1 ? 's' : ''} selected`
                            : "Select guest lists..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search guest lists..." />
                          <CommandList>
                            <CommandEmpty>No guest lists found.</CommandEmpty>
                            <CommandGroup>
                              {guestLists.map((guestList) => (
                                <CommandItem
                                  key={guestList.id}
                                  value={guestList.name}
                                  onSelect={() => {
                                    const isSelected = createForm.notifyGuestLists.includes(guestList.id);
                                    if (isSelected) {
                                      setCreateForm({
                                        ...createForm,
                                        notifyGuestLists: createForm.notifyGuestLists.filter(id => id !== guestList.id)
                                      });
                                    } else {
                                      setCreateForm({
                                        ...createForm,
                                        notifyGuestLists: [...createForm.notifyGuestLists, guestList.id]
                                      });
                                    }
                                  }}
                                  data-testid={`command-item-${guestList.id}`}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      createForm.notifyGuestLists.includes(guestList.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{guestList.name}</span>
                                    {guestList.description && (
                                      <span className="text-xs text-muted-foreground">
                                        {guestList.description}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {createForm.notifyGuestLists.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {createForm.notifyGuestLists.map(listId => {
                          const guestList = guestLists.find(list => list.id === listId);
                          return guestList ? (
                            <div key={listId} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-xs">
                              <span>{guestList.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCreateForm({
                                    ...createForm,
                                    notifyGuestLists: createForm.notifyGuestLists.filter(id => id !== listId)
                                  });
                                }}
                                className="hover:bg-secondary-foreground/10 rounded-full p-0.5"
                                data-testid={`remove-guestlist-${listId}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePoll} data-testid="button-confirm-create-poll">
                  Create Poll
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {polls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No polls yet</p>
            <p className="text-sm">Create polls to gauge interest before creating events</p>
          </div>
        ) : (
          <div className="space-y-4">
            {polls.map((poll) => (
              <div key={poll.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg" data-testid={`text-poll-title-${poll.id}`}>
                      {poll.title}
                    </h3>
                    {poll.description && (
                      <p className="text-muted-foreground text-sm mt-1" data-testid={`text-poll-description-${poll.id}`}>
                        {poll.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {poll.status === 'active' && !isPollExpired(poll.endDate) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openVoteDialog(poll)}
                        data-testid={`button-vote-${poll.id}`}
                      >
                        Vote
                      </Button>
                    )}
                    {poll.status === 'active' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(poll)}
                          data-testid={`button-edit-${poll.id}`}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEndPoll(poll)}
                          data-testid={`button-end-${poll.id}`}
                        >
                          <Square className="h-3 w-3 mr-1" />
                          End
                        </Button>
                      </>
                    )}
                    {(poll.status === 'ended' || (poll.status === 'active' && isPollExpired(poll.endDate))) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConvertDialog(poll)}
                        data-testid={`button-convert-${poll.id}`}
                      >
                        <CalendarPlus className="h-3 w-3 mr-1" />
                        Convert to Event
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePoll(poll)}
                      data-testid={`button-delete-poll-${poll.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <Badge className={getStatusColor(poll.status)} data-testid={`badge-status-${poll.id}`}>
                    {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Ends {formatDate(poll.endDate)}
                  </span>
                  {isPollExpired(poll.endDate) && poll.status === 'active' && (
                    <Badge variant="destructive">Expired</Badge>
                  )}
                </div>

                {/* Poll Results Preview */}
                {poll.voteCounts && poll.totalVotes !== undefined && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {poll.totalVotes} total vote{poll.totalVotes !== 1 ? 's' : ''}
                    </p>
                    {poll.options.map((option, index) => {
                      const voteCount = poll.voteCounts![index] || 0;
                      const percentage = poll.totalVotes! > 0 ? (voteCount / poll.totalVotes!) * 100 : 0;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{option}</span>
                            <span>{voteCount} votes ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Vote Dialog */}
      <Dialog open={isVoteDialogOpen} onOpenChange={setIsVoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vote on Poll</DialogTitle>
            <DialogDescription>
              {selectedPoll?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedPoll && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="voterName">Your Name (optional)</Label>
                <Input
                  id="voterName"
                  value={voteForm.voterName}
                  onChange={(e) => setVoteForm({ ...voteForm, voterName: e.target.value })}
                  placeholder="Enter your name"
                  data-testid="input-voter-name"
                />
              </div>
              <div>
                <Label htmlFor="voterEmail">Your Email (optional)</Label>
                <Input
                  id="voterEmail"
                  type="email"
                  value={voteForm.voterEmail}
                  onChange={(e) => setVoteForm({ ...voteForm, voterEmail: e.target.value })}
                  placeholder="Enter your email"
                  data-testid="input-voter-email"
                />
              </div>
              <div>
                <Label>
                  Choose your option{selectedPoll.allowMultipleChoices ? 's' : ''} 
                  {selectedPoll.allowMultipleChoices && ' (multiple choices allowed)'}
                </Label>
                <div className="space-y-2 mt-2">
                  {selectedPoll.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`option-${index}`}
                        checked={voteForm.selectedOptions.includes(index.toString())}
                        onCheckedChange={() => toggleVoteOption(index.toString())}
                        data-testid={`checkbox-vote-option-${index}`}
                      />
                      <Label htmlFor={`option-${index}`}>
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVote} data-testid="button-confirm-vote">
              Submit Vote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Poll Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Poll</DialogTitle>
            <DialogDescription>
              Update poll details and optionally resend notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Poll Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Enter poll title"
                data-testid="input-edit-poll-title"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Enter poll description"
                rows={3}
                data-testid="textarea-edit-poll-description"
              />
            </div>
            <div>
              <Label>Poll Options</Label>
              <div className="space-y-2">
                {editForm.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateEditOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      data-testid={`input-edit-option-${index}`}
                    />
                    {editForm.options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEditOption(index)}
                        data-testid={`button-remove-edit-option-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEditOption}
                  data-testid="button-add-edit-option"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-endDate">End Date & Time</Label>
              <Input
                id="edit-endDate"
                type="datetime-local"
                value={editForm.endDate}
                onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                data-testid="input-edit-end-date"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-allowMultipleChoices"
                checked={editForm.allowMultipleChoices}
                onCheckedChange={(checked) => 
                  setEditForm({ ...editForm, allowMultipleChoices: checked as boolean })
                }
                data-testid="checkbox-edit-multiple-choices"
              />
              <Label htmlFor="edit-allowMultipleChoices">Allow multiple choices</Label>
            </div>
            
            {/* Email notification section */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="edit-sendNotifications"
                  checked={editForm.sendNotifications}
                  onCheckedChange={(checked) => 
                    setEditForm({ ...editForm, sendNotifications: checked as boolean })
                  }
                  data-testid="checkbox-edit-send-notifications"
                />
                <Label htmlFor="edit-sendNotifications">Resend email notifications after update</Label>
              </div>
              
              {editForm.sendNotifications && (
                <div>
                  <Label>Select guest lists to notify:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between mt-2"
                        data-testid="button-edit-select-guest-lists"
                      >
                        {editForm.notifyGuestLists.length === 0
                          ? "Select guest lists..."
                          : `${editForm.notifyGuestLists.length} list${editForm.notifyGuestLists.length !== 1 ? 's' : ''} selected`}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search guest lists..." />
                        <CommandEmpty>No guest lists found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {guestLists.map((list) => (
                              <CommandItem
                                key={list.id}
                                onSelect={() => {
                                  setEditForm(prev => ({
                                    ...prev,
                                    notifyGuestLists: prev.notifyGuestLists.includes(list.id)
                                      ? prev.notifyGuestLists.filter(id => id !== list.id)
                                      : [...prev.notifyGuestLists, list.id]
                                  }));
                                }}
                                data-testid={`command-item-edit-guest-list-${list.id}`}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editForm.notifyGuestLists.includes(list.id) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {list.name}
                                {list.description && (
                                  <span className="text-muted-foreground ml-2">
                                    - {list.description}
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPoll} data-testid="button-confirm-edit-poll">
              Update Poll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Event Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Convert Poll to Event</DialogTitle>
            <DialogDescription>
              Convert "{selectedPoll?.title}" into an actual event
            </DialogDescription>
          </DialogHeader>
          {selectedPoll && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="convert-title">Event Title</Label>
                <Input
                  id="convert-title"
                  value={convertForm.title}
                  onChange={(e) => setConvertForm({ ...convertForm, title: e.target.value })}
                  placeholder="Enter event title"
                  data-testid="input-convert-event-title"
                />
              </div>
              <div>
                <Label htmlFor="convert-description">Event Description</Label>
                <Textarea
                  id="convert-description"
                  value={convertForm.description}
                  onChange={(e) => setConvertForm({ ...convertForm, description: e.target.value })}
                  placeholder="Enter event description"
                  rows={3}
                  data-testid="textarea-convert-event-description"
                />
              </div>
              <div>
                <Label htmlFor="convert-startDateTime">Start Date & Time</Label>
                <Input
                  id="convert-startDateTime"
                  type="datetime-local"
                  value={convertForm.startDateTime}
                  onChange={(e) => setConvertForm({ ...convertForm, startDateTime: e.target.value })}
                  data-testid="input-convert-start-date"
                />
              </div>
              <div>
                <Label htmlFor="convert-endDateTime">End Date & Time (optional)</Label>
                <Input
                  id="convert-endDateTime"
                  type="datetime-local"
                  value={convertForm.endDateTime}
                  onChange={(e) => setConvertForm({ ...convertForm, endDateTime: e.target.value })}
                  data-testid="input-convert-end-date"
                />
              </div>
              <div>
                <Label htmlFor="convert-location">Location (optional)</Label>
                <Input
                  id="convert-location"
                  value={convertForm.location}
                  onChange={(e) => setConvertForm({ ...convertForm, location: e.target.value })}
                  placeholder="Enter event location"
                  data-testid="input-convert-location"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="convert-isAllDay"
                  checked={convertForm.isAllDay}
                  onCheckedChange={(checked) => 
                    setConvertForm({ ...convertForm, isAllDay: checked as boolean })
                  }
                  data-testid="checkbox-convert-all-day"
                />
                <Label htmlFor="convert-isAllDay">All-day event</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConvertToEvent} data-testid="button-confirm-convert">
              Convert to Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}