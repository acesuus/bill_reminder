import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

class NotificationService {
  // Singleton pattern so we only ever have one instance of the service
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    // Initialize timezone data securely
    tz_data.initializeTimeZones();

    // Android initialization settings
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS initialization settings
    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
          requestSoundPermission: true,
          requestBadgePermission: true,
          requestAlertPermission: true,
        );

    const InitializationSettings initializationSettings =
        InitializationSettings(
          android: initializationSettingsAndroid,
          iOS: initializationSettingsIOS,
        );

    await flutterLocalNotificationsPlugin.initialize(
      settings: initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        // Use debugPrint instead of print for production safety
        debugPrint('Notification clicked: ${response.payload}');
      },
    );
  }

  // Request explicit permissions for Android 13+ and Android 14+
  Future<void> requestPermissions() async {
    if (Platform.isAndroid) {
      final androidImplementation = flutterLocalNotificationsPlugin
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >();

      if (androidImplementation != null) {
        // Required for Android 13+ (Push Notifications)
        await androidImplementation.requestNotificationsPermission();

        // Required for Android 14+ (Scheduling Exact Alarms for specific dates)
        await androidImplementation.requestExactAlarmsPermission();
      }
    }
  }

  // Method to schedule a notification
  Future<void> scheduleBillReminder({
    required int id, // Unique ID for the notification
    required String title,
    required String body,
    required DateTime scheduledDate,
    required bool isHighPriorityAlarm,
  }) async {
    // Safety check: Do not try to schedule a notification in the past, or the app will crash
    if (scheduledDate.isBefore(DateTime.now())) {
      debugPrint('Cannot schedule alarm in the past.');
      return;
    }

    // Android-specific notification details
    AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
          'bill_reminders_channel',
          'Bill Reminders',
          channelDescription: 'Notifications for upcoming bill due dates',
          importance: isHighPriorityAlarm
              ? Importance.max
              : Importance.defaultImportance,
          priority: isHighPriorityAlarm
              ? Priority.high
              : Priority.defaultPriority,
          // If it's an alarm, we can make it bypass Do Not Disturb
          fullScreenIntent: isHighPriorityAlarm,
        );

    NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: const DarwinNotificationDetails(),
    );

    // Schedule the exact notification using the timezone package
    await flutterLocalNotificationsPlugin.zonedSchedule(
      id: id,
      title: title,
      body: body,
      scheduledDate: tz.TZDateTime.from(scheduledDate, tz.local),
      notificationDetails: platformChannelSpecifics,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      payload: 'bill_payload_$id',
    );
  }

  // Method to cancel a specific notification (used when a bill is deleted or marked paid)
  Future<void> cancelNotification(int id) async {
    await flutterLocalNotificationsPlugin.cancel(id: id);
  }
}
