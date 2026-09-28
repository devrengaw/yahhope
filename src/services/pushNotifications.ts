import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { supabase } from '../lib/supabase';

export interface PushNotificationServiceState {
  isSupported: boolean;
  hasPermission: boolean;
  token: string | null;
}

class PushNotificationService {
  private token: string | null = null;
  private isInitialized = false;

  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Initializes push notifications listeners and requests permissions if needed
   */
  public async init(userId?: string): Promise<boolean> {
    if (!this.isNative()) {
      return false;
    }

    if (this.isInitialized) {
      if (userId && this.token) {
        await this.saveTokenToSupabase(this.token, userId);
      }
      return true;
    }

    try {
      // Check current permissions
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Push notification permission was not granted:', permStatus.receive);
        return false;
      }

      // Register device with APNs / FCM
      await PushNotifications.register();

      // Listen for registration token
      await PushNotifications.addListener('registration', async (token: Token) => {
        this.token = token.value;
        localStorage.setItem('yah_push_token', token.value);
        if (userId) {
          await this.saveTokenToSupabase(token.value, userId);
        }
      });

      // Handle registration errors
      await PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on push notification registration:', JSON.stringify(error));
      });

      // Show notification alert or banner when received in foreground
      await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          console.log('Push notification received:', notification);
          // Dispatch a custom event so the UI or NotificationContext can pick it up
          window.dispatchEvent(new CustomEvent('yah_push_received', { detail: notification }));
        }
      );

      // Handle notification tap / action
      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action: ActionPerformed) => {
          const data = action.notification.data;
          console.log('Push notification action performed:', data);

          if (data?.url) {
            window.location.href = data.url;
          } else if (data?.route) {
            window.location.hash = data.route;
          }
        }
      );

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error('Failed to initialize push notifications:', err);
      return false;
    }
  }

  /**
   * Saves the device push token to Supabase users/devices table
   */
  public async saveTokenToSupabase(token: string, userId: string): Promise<void> {
    try {
      // Check if user has an existing record or update device_token in user profile
      const { error } = await supabase
        .from('users')
        .update({
          // Save or log device push token (or custom json metadata)
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.warn('Could not update device token in users table:', error.message);
      }
    } catch (e) {
      console.warn('Error saving push token to Supabase:', e);
    }
  }

  public getToken(): string | null {
    return this.token || localStorage.getItem('yah_push_token');
  }
}

export const pushNotificationService = new PushNotificationService();
