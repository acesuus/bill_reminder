// Local notification scheduling, mirroring the Flutter `NotificationService`.
// Uses expo-notifications. Everything runs locally / offline.

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const ANDROID_CHANNEL_ID = 'bill_reminders_channel';

// Show notifications even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Stable per-bill notification identifier so we can cancel/replace it. */
function notificationIdFor(billId: number): string {
  return `bill_${billId}`;
}

/** Initialise channels and request OS permissions (call once at startup). */
export async function initNotifications(): Promise<void> {
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
}

/** Cancel the reminder associated with a bill (used on delete / mark paid). */
export async function cancelBillReminder(billId: number): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationIdFor(billId));
  } catch {
    // No scheduled notification with that id; safe to ignore.
  }
}
