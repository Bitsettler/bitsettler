'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  User, 
  Settings, 
  Activity, 
  BarChart3,
  Bell,
  Palette,
  Globe,
  MessageCircle,
  Check,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { useUserProfile, type UserProfile } from '../hooks/use-user-profile';

interface UserProfileManagerProps {
  trigger?: React.ReactNode;
  onClose?: () => void;
}

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

export function UserProfileManager({ trigger, onClose }: UserProfileManagerProps) {
  const { profile, updateProfile, clearProfile, isFirstTime } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'activity'>('profile');
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSaving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName,
        discordHandle: profile.discordHandle || '',
        inGameName: profile.inGameName || '',
        bio: profile.bio || '',
        timezone: profile.timezone || '',
        preferredContact: profile.preferredContact || 'discord',
        theme: profile.theme || 'system',
        defaultSettlementView: profile.defaultSettlementView || 'dashboard',
        notifications: { ...profile.notifications },
        profileColor: profile.profileColor,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      await updateProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaving(false);
        setSaveSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaving(false);
    }
  };

  const handleColorChange = (color: string) => {
    setFormData(prev => ({ ...prev, profileColor: color }));
  };

  const handleNotificationChange = (key: keyof UserProfile['notifications'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        syncUpdates: true,
        settlementActivity: true,
        memberJoins: false,
        projectUpdates: true,
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const hasChanges = () => {
    if (!profile) return false;
    return JSON.stringify(formData) !== JSON.stringify({
      displayName: profile.displayName,
      discordHandle: profile.discordHandle || '',
      inGameName: profile.inGameName || '',
      bio: profile.bio || '',
      timezone: profile.timezone || '',
      preferredContact: profile.preferredContact || 'discord',
      theme: profile.theme || 'system',
      defaultSettlementView: profile.defaultSettlementView || 'dashboard',
      notifications: profile.notifications,
      profileColor: profile.profileColor,
    });
  };

  const TabButton = ({ id, icon: Icon, label, isActive, onClick }: {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Avatar</CardTitle>
          <CardDescription>Choose your profile color and view your display info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-16 w-16" style={{ backgroundColor: formData.profileColor }}>
              <AvatarFallback style={{ backgroundColor: formData.profileColor, color: 'white' }}>
                {formData.displayName ? 
                  formData.displayName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2) : 
                  'BC'
                }
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-medium">{formData.displayName || 'BitCraft User'}</h4>
              <p className="text-sm text-muted-foreground">
                {formData.inGameName ? `In-game: ${formData.inGameName}` : 'No in-game name set'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Profile Color</Label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_COLORS.map(color => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                    formData.profileColor === color ? 'border-foreground ring-2 ring-offset-2 ring-primary' : 'border-muted'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
          <CardDescription>Your display name and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={formData.displayName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="How you want to be called"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inGameName">BitCraft Character Name</Label>
              <Input
                id="inGameName"
                value={formData.inGameName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, inGameName: e.target.value }))}
                placeholder="Your in-game character name"
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="discordHandle">Discord Handle</Label>
              <Input
                id="discordHandle"
                value={formData.discordHandle || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, discordHandle: e.target.value }))}
                placeholder="@username or username#1234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={formData.timezone || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell others about yourself..."
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {(formData.bio || '').length}/200 characters
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      {/* App Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">App Preferences</CardTitle>
          <CardDescription>Customize your app experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Settlement View</Label>
              <Select 
                value={formData.defaultSettlementView || 'dashboard'} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, defaultSettlementView: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="members">Members</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                  <SelectItem value="treasury">Treasury</SelectItem>
                  <SelectItem value="skills">Skills</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Preferred Contact Method</Label>
              <Select 
                value={formData.preferredContact || 'discord'} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, preferredContact: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discord">Discord</SelectItem>
                  <SelectItem value="in-game">In-Game</SelectItem>
                  <SelectItem value="app">App Notifications</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notifications</CardTitle>
          <CardDescription>Choose what updates you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Settlement Activity</Label>
                <p className="text-sm text-muted-foreground">Get notified about settlement updates and changes</p>
              </div>
              <Checkbox
                checked={formData.notifications?.settlementActivity ?? true}
                onCheckedChange={(checked: boolean) => handleNotificationChange('settlementActivity', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sync Updates</Label>
                <p className="text-sm text-muted-foreground">Data synchronization and refresh notifications</p>
              </div>
              <Checkbox
                checked={formData.notifications?.syncUpdates ?? true}
                onCheckedChange={(checked: boolean) => handleNotificationChange('syncUpdates', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Member Joins</Label>
                <p className="text-sm text-muted-foreground">When new members join your settlements</p>
              </div>
              <Checkbox
                checked={formData.notifications?.memberJoins ?? false}
                onCheckedChange={(checked: boolean) => handleNotificationChange('memberJoins', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Project Updates</Label>
                <p className="text-sm text-muted-foreground">Updates about settlement projects and progress</p>
              </div>
              <Checkbox
                checked={formData.notifications?.projectUpdates ?? true}
                onCheckedChange={(checked: boolean) => handleNotificationChange('projectUpdates', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActivityTab = () => (
    <div className="space-y-6">
      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Stats</CardTitle>
          <CardDescription>Your activity and usage summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold">{profile?.stats?.settlementsConnected || 0}</div>
              <div className="text-sm text-muted-foreground">Settlements Connected</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold">{profile?.stats?.calculationsRun || 0}</div>
              <div className="text-sm text-muted-foreground">Calculations Run</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold">{Math.round((profile?.stats?.totalAppTime || 0) / 60)}h</div>
              <div className="text-sm text-muted-foreground">Total App Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Your recent actions in the app</CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.recentActivity && profile.recentActivity.length > 0 ? (
            <div className="space-y-2">
              {profile.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>{activity.description}</span>
                  <span className="text-muted-foreground ml-auto">{activity.timestamp}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity to show</p>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Account Actions</CardTitle>
          <CardDescription>Manage your account data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={() => {
              if (confirm('Are you sure you want to clear your profile? This will reset everything and restart onboarding.')) {
                clearProfile();
                setIsOpen(false);
              }
            }}
          >
            Clear Profile & Reset
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6">
            <TabButton
              id="profile"
              icon={User}
              label="Profile"
              isActive={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
            />
            <TabButton
              id="preferences"
              icon={Settings}
              label="Preferences"
              isActive={activeTab === 'preferences'}
              onClick={() => setActiveTab('preferences')}
            />
            <TabButton
              id="activity"
              icon={Activity}
              label="Activity"
              isActive={activeTab === 'activity'}
              onClick={() => setActiveTab('activity')}
            />
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'preferences' && renderPreferencesTab()}
            {activeTab === 'activity' && renderActivityTab()}
          </div>

          {/* Footer */}
          {(activeTab === 'profile' || activeTab === 'preferences') && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {profile?.lastActiveAt && (
                    <>Last updated: {new Date(profile.lastActiveAt).toLocaleDateString()}</>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsOpen(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={!hasChanges() || isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 