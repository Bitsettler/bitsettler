'use client';

import { useState } from 'react';
import { useMemberProfile } from '../../hooks/use-member-profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { Container } from '../container';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Loader2, Save, User, Settings, Palette, Bell } from 'lucide-react';
import { getDisplayProfession } from '@/lib/utils/profession-utils';

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16',
  '#EC4899', '#6366F1', '#14B8A6', '#F59E0B'
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
];

export function ProfileManagement() {
  const { member, updateProfile, isLoading, error } = useMemberProfile();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    display_name: member?.display_name || '',
    discord_handle: member?.discord_handle || '',
    bio: member?.bio || '',
    timezone: member?.timezone || '',
    preferred_contact: member?.preferred_contact || 'discord',
    theme: member?.theme || 'system',
    profile_color: member?.profile_color || '#3b82f6',
    default_settlement_view: member?.default_settlement_view || 'dashboard',
    notifications_enabled: member?.notifications_enabled ?? true,
    activity_tracking_enabled: member?.activity_tracking_enabled ?? true
  });

  // Update form data when member loads
  if (member && !formData.display_name && member.display_name) {
    setFormData({
      display_name: member.display_name || '',
      discord_handle: member.discord_handle || '',
      bio: member.bio || '',
      timezone: member.timezone || '',
      preferred_contact: member.preferred_contact || 'discord',
      theme: member.theme || 'system',
      profile_color: member.profile_color || '#3b82f6',
      default_settlement_view: member.default_settlement_view || 'dashboard',
      notifications_enabled: member.notifications_enabled ?? true,
      activity_tracking_enabled: member.activity_tracking_enabled ?? true
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setSaveError(null);
      
      await updateProfile(formData);
      
      // Show success feedback briefly
      setTimeout(() => setSaving(false), 500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to update profile');
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (!member) {
    return (
      <Container>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>No Character Claimed</CardTitle>
            <CardDescription>
              You must claim a character to manage your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/auth/claim-character">Claim Character</a>
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your character profile and app preferences
          </p>
        </div>

        {/* Character Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Character Information
            </CardTitle>
            <CardDescription>
              Your linked settlement member data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback style={{ backgroundColor: member.profile_color }}>
                  {(member.display_name || member.name).substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{getDisplayProfession(member)}</p>
                <div className="flex gap-2">
                  <Badge variant="secondary">Level {member.highest_level}</Badge>
                  <Badge variant="outline">Total: {member.total_level}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    placeholder={member.name}
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use your character name
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discord_handle">Discord Handle</Label>
                  <Input
                    id="discord_handle"
                    placeholder="@username"
                    value={formData.discord_handle}
                    onChange={(e) => setFormData(prev => ({ ...prev, discord_handle: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map(tz => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred_contact">Preferred Contact</Label>
                  <Select value={formData.preferred_contact} onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_contact: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discord">Discord</SelectItem>
                      <SelectItem value="in-game">In-Game</SelectItem>
                      <SelectItem value="app">App Messages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={formData.theme} onValueChange={(value) => setFormData(prev => ({ ...prev, theme: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_view">Default Settlement View</Label>
                  <Select value={formData.default_settlement_view} onValueChange={(value) => setFormData(prev => ({ ...prev, default_settlement_view: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="members">Members</SelectItem>
                      <SelectItem value="projects">Projects</SelectItem>
                      <SelectItem value="skills">Skills</SelectItem>
                      <SelectItem value="treasury">Treasury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Profile Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {DEFAULT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${formData.profile_color === color ? 'border-primary' : 'border-muted'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, profile_color: color }))}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifications"
                    checked={formData.notifications_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notifications_enabled: !!checked }))}
                  />
                  <Label htmlFor="notifications">Enable notifications</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="activity_tracking"
                    checked={formData.activity_tracking_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activity_tracking_enabled: !!checked }))}
                  />
                  <Label htmlFor="activity_tracking">Enable activity tracking</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Card>
            <CardContent className="pt-6">
              {saveError && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {saveError}
                </div>
              )}
              
              {error && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </Container>
  );
} 