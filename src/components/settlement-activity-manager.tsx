/**
 * Settlement Activity Manager (Future Enhancement)
 * 
 * This would allow you to manage activity events through a UI
 * rather than editing config files directly.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { ACTIVITY_EVENTS, ActivityEventConfig } from '@/lib/settlement/activity-events-config';

export function SettlementActivityManager() {
  const [events, setEvents] = useState<ActivityEventConfig[]>(ACTIVITY_EVENTS);
  const [editingEvent, setEditingEvent] = useState<ActivityEventConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = () => {
    setEditingEvent({
      id: '',
      type: 'skill_milestone',
      name: '',
      description: '',
      condition: {
        trigger: 'skill_change',
        criteria: {
          levelThresholds: []
        }
      },
      priority: 'medium'
    });
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!editingEvent) return;
    
    if (isCreating) {
      setEvents([...events, editingEvent]);
    } else {
      setEvents(events.map(e => e.id === editingEvent.id ? editingEvent : e));
    }
    
    setEditingEvent(null);
    setIsCreating(false);
  };

  const handleDelete = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800'; 
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'skill_milestone': return 'bg-blue-100 text-blue-800';
      case 'skill_first': return 'bg-purple-100 text-purple-800';
      case 'member_achievement': return 'bg-orange-100 text-orange-800';
      case 'skill_level_up': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Activity Events Manager</h2>
          <p className="text-muted-foreground">Configure member achievements and milestones</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Event Editor */}
      {editingEvent && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{isCreating ? 'Create New Event' : 'Edit Event'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-id">Event ID</Label>
                <Input
                  id="event-id"
                  value={editingEvent.id}
                  onChange={(e) => setEditingEvent({...editingEvent, id: e.target.value})}
                  placeholder="unique_event_id"
                />
              </div>
              <div>
                <Label htmlFor="event-name">Display Name</Label>
                <Input
                  id="event-name"
                  value={editingEvent.name}
                  onChange={(e) => setEditingEvent({...editingEvent, name: e.target.value})}
                  placeholder="Master Craftsman"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="event-description">Description</Label>
              <Input
                id="event-description" 
                value={editingEvent.description || ''}
                onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                placeholder="Reached level 50 in a crafting skill"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="event-type">Type</Label>
                <Select 
                  value={editingEvent.type} 
                  onValueChange={(value) => setEditingEvent({...editingEvent, type: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skill_milestone">Skill Milestone</SelectItem>
                    <SelectItem value="skill_first">Settlement First</SelectItem>
                    <SelectItem value="member_achievement">Member Achievement</SelectItem>
                    <SelectItem value="skill_level_up">Level Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="event-priority">Priority</Label>
                <Select 
                  value={editingEvent.priority} 
                  onValueChange={(value) => setEditingEvent({...editingEvent, priority: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem> 
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="event-icon">Icon</Label>
                <Input
                  id="event-icon"
                  value={editingEvent.icon || ''}
                  onChange={(e) => setEditingEvent({...editingEvent, icon: e.target.value})}
                  placeholder="🏆"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Event
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {setEditingEvent(null); setIsCreating(false);}}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{event.icon || '🎯'}</span>
                    <h3 className="font-semibold">{event.name}</h3>
                    <Badge className={getTypeColor(event.type)}>
                      {event.type.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(event.priority)}>
                      {event.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {event.description || 'No description'}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    ID: {event.id}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {setEditingEvent(event); setIsCreating(false);}}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{events.length}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{events.filter(e => e.type === 'skill_milestone').length}</div>
              <div className="text-sm text-muted-foreground">Milestones</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{events.filter(e => e.type === 'skill_first').length}</div>
              <div className="text-sm text-muted-foreground">Settlement Firsts</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{events.filter(e => e.priority === 'high').length}</div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}