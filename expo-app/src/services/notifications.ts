// Local notification scheduling, mirroring the Flutter `NotificationService`.
// Uses expo-notifications. Everything runs locally / offline.
//
// IMPORTANT: nothing here runs at import time. expo-notifications has limited
// support in Expo Go (SDK 53+), so all calls are lazy and guarded so a missing
// native capability can never break module evaluation / app startup.

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const ANDROID_CHANNEL_ID = 'bill_reminders_channel';

let handlerConfigured = false;

/** Configure how notifications appear while the app is foregrounded. */
function ensureHandler(): void {
  if (handlerConfigured) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  } catch (e) {
    console.warn('Could not set notification handler', e);
  }
}

/** Stable per-bill notification identifier so we can cancel/replace it. */
function notificationIdFor(billId: number): string {
  return `bill_${billId}`;
}

/** Initialise channels and request OS permissions (call once at startup). */
export async function initNotifications(): Promise<void> {
  try {
    ensureHandler();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Bill Reminders',
        description: 'Notifications for upcoming bill due dates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C8CB0',
      });
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
    }
  } catch (e) {
    // Notifications aren't fully supported in Expo Go; safe to continue.
    console.warn('Notification init skipped', e);
  }
}

interface ScheduleArgs {
  billId: number;
  title: string;
  body: string;
  scheduledDate: Date;
  isHighPriorityAlarm: boolean;
}

/**
 * Schedule (or replace) a reminder for a bill. Mirrors the Flutter behaviour:
 * does nothing if the date is in the past.
 */
export async function scheduleBillReminder({
  billId,
  title,
  body,
  scheduledDate,
  isHighPriorityAlarm,
}: ScheduleArgs): Promise<void> {
  if (scheduledDate.getTime() <= Date.now()) {
    console.warn('Cannot schedule a reminder in the past.');
    return;
  }

  try {
    ensureHandler();
    const identifier = notificationIdFor(billId);
    // Replace any existing reminder for this bill.
    await cancelBillReminder(billId);

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        sound: true,
        priority: isHighPriorityAlarm
          ? Notifications.AndroidNotificationPriority.MAX
          : Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledDate,
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
      },
    });
  } catch (e) {
    console.warn('Could not schedule reminder', e);
  }
}

/** Cancel the reminder associated with a bill (used on delete / mark paid). */
export async function cancelBillReminder(billId: number): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationIdFor(billId));
  } catch {
    // No scheduled notification with that id; safe to ignore.
  }
}
