/**
 * Settlement Push Notification Service
 * Handles browser notifications for important settlement events
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationOptions {
  silent?: boolean;
  requireInteraction?: boolean;
}

/**
 * Settlement notification types with default configurations
 */
export const NotificationTypes = {
  MEMBER_JOINED: {
    title: 'New Settlement Member',
    icon: '/icons/member-join.png',
    tag: 'member-activity',
    requireInteraction: false
  },
  MEMBER_LEFT: {
    title: 'Member Left Settlement',
    icon: '/icons/member-leave.png',
    tag: 'member-activity',
    requireInteraction: false
  },
  PROJECT_COMPLETED: {
    title: 'Project Completed! 🎉',
    icon: '/icons/project-complete.png',
    tag: 'project-milestone',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View Project', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  },
  TREASURY_MILESTONE: {
    title: 'Treasury Milestone Reached!',
    icon: '/icons/treasury.png',
    tag: 'treasury-milestone',
    requireInteraction: true
  },
  LARGE_TRANSACTION: {
    title: 'Large Treasury Transaction',
    icon: '/icons/treasury-alert.png',
    tag: 'treasury-alert',
    requireInteraction: false
  },
  MEMBER_ACHIEVEMENT: {
    title: 'Member Achievement',
    icon: '/icons/achievement.png',
    tag: 'member-achievement',
    requireInteraction: false
  },
  SETTLEMENT_LEVEL_UP: {
    title: 'Settlement Level Up! 🌟',
    icon: '/icons/level-up.png',
    tag: 'settlement-milestone',
    requireInteraction: true,
    actions: [
      { action: 'celebrate', title: 'Celebrate!', icon: '/icons/celebrate.png' },
      { action: 'view', title: 'View Details', icon: '/icons/view.png' }
    ]
  }
} as const;

export type NotificationType = keyof typeof NotificationTypes;

/**
 * Settlement Notification Service
 * Manages browser push notifications for settlement events
 */
export class SettlementNotificationService {
  private isSupported = false;
  private permission: NotificationPermission = 'default';
  private isEnabled = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the notification service
   */
  private initialize(): void {
    if (typeof window === 'undefined') {
      return; // Server-side rendering
    }

    this.isSupported = 'Notification' in window;
    
    if (this.isSupported) {
      this.permission = Notification.permission;
      this.isEnabled = this.permission === 'granted';
      this.setupMessageHandlers();
    }
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      this.isEnabled = true;
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      this.isEnabled = permission === 'granted';
      
      if (this.isEnabled) {
        console.log('✅ Notification permission granted');
        this.showWelcomeNotification();
      } else {
        console.log('❌ Notification permission denied');
      }

      return this.isEnabled;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show a welcome notification when permissions are first granted
   */
  private showWelcomeNotification(): void {
    this.show({
      title: 'Settlement Notifications Enabled',
      body: 'You\'ll now receive updates about important settlement events',
      icon: '/icons/settlement.png',
      tag: 'welcome'
    }, {
      silent: true
    });
  }

  /**
   * Show a notification with the given payload
   */
  async show(payload: NotificationPayload, options: NotificationOptions = {}): Promise<boolean> {
    if (!this.canShow()) {
      return false;
    }

    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/default-notification.png',
        badge: payload.badge || '/icons/badge.png',
        tag: payload.tag,
        data: payload.data,
                          silent: options.silent || false,
         requireInteraction: options.requireInteraction || false,
         actions: payload.actions || []
      });

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus(); // Focus the window
        notification.close();
        
        // Handle custom data or navigation
        if (payload.data?.url) {
          window.location.href = payload.data.url;
        }
      };

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  /**
   * Show a pre-configured notification type
   */
  async showTyped(
    type: NotificationType, 
    customBody: string, 
    data?: any, 
    options?: NotificationOptions
  ): Promise<boolean> {
    const config = NotificationTypes[type];
    
         const payload: NotificationPayload = {
       title: config.title,
       body: customBody,
       icon: config.icon,
       tag: config.tag,
       data,
       actions: 'actions' in config ? [...(config.actions || [])] : undefined
     };

    const mergedOptions: NotificationOptions = {
      requireInteraction: config.requireInteraction,
      ...options
    };

    return this.show(payload, mergedOptions);
  }

  /**
   * Show member-related notifications
   */
  async notifyMemberJoined(memberName: string, profession: string): Promise<boolean> {
    return this.showTyped(
      'MEMBER_JOINED',
      `${memberName} (${profession}) has joined your settlement`,
      { memberName, profession, url: '/settlement/members' }
    );
  }

  async notifyMemberLeft(memberName: string): Promise<boolean> {
    return this.showTyped(
      'MEMBER_LEFT',
      `${memberName} has left the settlement`,
      { memberName, url: '/settlement/members' }
    );
  }

  /**
   * Show project-related notifications
   */
  async notifyProjectCompleted(projectName: string, projectId: string): Promise<boolean> {
    return this.showTyped(
      'PROJECT_COMPLETED',
      `"${projectName}" has been completed!`,
      { projectName, projectId, url: `/settlement/projects/${projectId}` }
    );
  }

  /**
   * Show treasury-related notifications
   */
  async notifyTreasuryMilestone(amount: number, milestone: string): Promise<boolean> {
    return this.showTyped(
      'TREASURY_MILESTONE',
      `Settlement treasury reached ${amount.toLocaleString()} gold - ${milestone}`,
      { amount, milestone, url: '/settlement/treasury' }
    );
  }

  async notifyLargeTransaction(amount: number, type: string, description: string): Promise<boolean> {
    const action = type === 'Income' ? 'received' : 'spent';
    return this.showTyped(
      'LARGE_TRANSACTION',
      `Settlement ${action} ${Math.abs(amount).toLocaleString()} gold: ${description}`,
      { amount, type, description, url: '/settlement/treasury' }
    );
  }

  /**
   * Show achievement notifications
   */
  async notifyMemberAchievement(memberName: string, achievement: string): Promise<boolean> {
    return this.showTyped(
      'MEMBER_ACHIEVEMENT',
      `${memberName} achieved: ${achievement}`,
      { memberName, achievement, url: '/settlement/members' }
    );
  }

  async notifySettlementLevelUp(newLevel: number, benefits: string): Promise<boolean> {
    return this.showTyped(
      'SETTLEMENT_LEVEL_UP',
      `Settlement reached Level ${newLevel}! ${benefits}`,
      { newLevel, benefits, url: '/settlement' }
    );
  }

  /**
   * Setup message handlers for notification actions
   */
  private setupMessageHandlers(): void {
    // Handle service worker messages (for notification actions)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'NOTIFICATION_CLICKED':
            this.handleNotificationAction(data.action, data.notificationData);
            break;
          case 'NOTIFICATION_CLOSED':
            console.log('Notification was closed:', data);
            break;
        }
      });
    }
  }

  /**
   * Handle notification action clicks
   */
  private handleNotificationAction(action: string, data: any): void {
    switch (action) {
      case 'view':
        if (data.url) {
          window.open(data.url, '_blank');
        }
        break;
      case 'celebrate':
        // Could trigger some UI celebration animation
        console.log('🎉 Celebration triggered!');
        if (data.url) {
          window.open(data.url, '_blank');
        }
        break;
      case 'dismiss':
        // Just dismiss, no action needed
        break;
      default:
        console.log('Unknown notification action:', action);
    }
  }

  /**
   * Check if notifications can be shown
   */
  canShow(): boolean {
    return this.isSupported && this.isEnabled && this.permission === 'granted';
  }

  /**
   * Get current notification status
   */
  getStatus(): {
    supported: boolean;
    permission: NotificationPermission;
    enabled: boolean;
  } {
    return {
      supported: this.isSupported,
      permission: this.permission,
      enabled: this.isEnabled
    };
  }

  /**
   * Enable/disable notifications
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled && this.permission === 'granted';
  }

  /**
   * Clear all notifications with a specific tag
   */
  clearByTag(tag: string): void {
    // This would require service worker implementation for full control
    console.log(`Clearing notifications with tag: ${tag}`);
  }

  /**
   * Check if notification type should be shown based on user preferences
   */
  shouldNotify(type: NotificationType): boolean {
    if (!this.canShow()) return false;

    // Could implement user preference checks here
    // For now, allow all notification types
    return true;
  }
}

// Singleton instance
export const settlementNotificationService = new SettlementNotificationService(); 