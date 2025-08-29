import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { BarChart3, Clock, Users } from 'lucide-react';

interface Poll {
  id: string;
  title: string;
  description?: string;
  options: string[];
  allowMultipleChoices: boolean;
  endDate: string;
  status: "active" | "ended" | "converted";
  convertedEventId?: string;
  voteCounts?: number[];
  totalVotes?: number;
}

export default function PollView() {
  const [match, params] = useRoute('/polls/:id');
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteForm, setVoteForm] = useState({
    voterName: '',
    voterEmail: '',
    selectedOptions: [] as string[],
  });

  useEffect(() => {
    if (match && params?.id) {
      fetchPoll(params.id);
      
      // Check if user just voted from email
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('voted') === 'true') {
        setHasVoted(true);
        toast({
          title: "Vote Recorded",
          description: "Thank you for participating in this poll!",
        });
      }
    }
  }, [match, params?.id]);

  const fetchPoll = async (pollId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}`);

      if (response.ok) {
        const data = await response.json();
        setPoll(data);
      } else {
        toast({
          title: "Error",
          description: "Poll not found or no longer available",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load poll details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!poll) return;

    if (!voteForm.voterEmail.trim()) {
      toast({
        title: "Error",
        description: "Please provide your email address",
        variant: "destructive",
      });
      return;
    }

    if (voteForm.selectedOptions.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one option",
        variant: "destructive",
      });
      return;
    }

    setVoting(true);

    try {
      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterName: voteForm.voterName || undefined,
          voterEmail: voteForm.voterEmail,
          selectedOptions: voteForm.selectedOptions,
        }),
      });

      if (response.ok) {
        setHasVoted(true);
        await fetchPoll(poll.id); // Refresh poll data
        toast({
          title: "Vote Recorded",
          description: "Thank you for participating in this poll!",
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
    } finally {
      setVoting(false);
    }
  };

  const handleOptionChange = (optionIndex: string, checked: boolean) => {
    if (!poll) return;

    setVoteForm(prev => {
      let newSelected = [...prev.selectedOptions];
      
      if (poll.allowMultipleChoices) {
        if (checked) {
          newSelected.push(optionIndex);
        } else {
          newSelected = newSelected.filter(idx => idx !== optionIndex);
        }
      } else {
        // Single choice - replace selection
        newSelected = checked ? [optionIndex] : [];
      }
      
      return { ...prev, selectedOptions: newSelected };
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'ended': return 'bg-red-500';
      case 'converted': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p>Loading poll...</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Poll Not Found</h2>
            <p className="text-muted-foreground">This poll may have been removed or is no longer available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date() > new Date(poll.endDate);
  const canVote = poll.status === 'active' && !isExpired && !hasVoted;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                <CardTitle>{poll.title}</CardTitle>
              </div>
              <Badge className={getStatusColor(poll.status)}>
                {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
              </Badge>
            </div>
            {poll.description && (
              <CardDescription>{poll.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Poll Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Ends: {formatDate(poll.endDate)}</span>
              </div>
              {poll.totalVotes !== undefined && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{poll.totalVotes} votes</span>
                </div>
              )}
            </div>

            {/* Voting Section */}
            {canVote && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cast Your Vote</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="voter-name">Name (Optional)</Label>
                    <Input
                      id="voter-name"
                      value={voteForm.voterName}
                      onChange={(e) => setVoteForm(prev => ({ ...prev, voterName: e.target.value }))}
                      placeholder="Your name"
                      data-testid="input-voter-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="voter-email">Email *</Label>
                    <Input
                      id="voter-email"
                      type="email"
                      value={voteForm.voterEmail}
                      onChange={(e) => setVoteForm(prev => ({ ...prev, voterEmail: e.target.value }))}
                      placeholder="your@email.com"
                      required
                      data-testid="input-voter-email"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>
                    Choose your option{poll.allowMultipleChoices ? 's' : ''}: 
                    {poll.allowMultipleChoices && <span className="text-sm text-muted-foreground ml-1">(Multiple selections allowed)</span>}
                  </Label>
                  
                  {poll.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2" data-testid={`option-${index}`}>
                      <Checkbox
                        id={`option-${index}`}
                        checked={voteForm.selectedOptions.includes(index.toString())}
                        onCheckedChange={(checked) => handleOptionChange(index.toString(), checked as boolean)}
                        data-testid={`checkbox-option-${index}`}
                      />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleVote} 
                  disabled={voting || voteForm.selectedOptions.length === 0}
                  className="w-full"
                  data-testid="button-submit-vote"
                >
                  {voting ? 'Recording Vote...' : 'Submit Vote'}
                </Button>
              </div>
            )}

            {/* Results Section */}
            {(poll.voteCounts && poll.totalVotes !== undefined) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Results</h3>
                
                {poll.options.map((option, index) => {
                  const voteCount = poll.voteCounts![index] || 0;
                  const percentage = poll.totalVotes! > 0 ? (voteCount / poll.totalVotes!) * 100 : 0;
                  
                  return (
                    <div key={index} className="space-y-2" data-testid={`result-${index}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{option}</span>
                        <span className="text-sm text-muted-foreground">
                          {voteCount} vote{voteCount !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Status Messages */}
            {!canVote && (
              <div className="text-center py-4">
                {hasVoted && (
                  <p className="text-green-600 font-medium">✓ Thank you for voting!</p>
                )}
                {isExpired && (
                  <p className="text-red-600 font-medium">⏰ This poll has ended</p>
                )}
                {poll.status === 'ended' && (
                  <p className="text-red-600 font-medium">📊 Poll has been closed by the host</p>
                )}
                {poll.status === 'converted' && (
                  <p className="text-blue-600 font-medium">🎉 This poll has been converted to an event!</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}