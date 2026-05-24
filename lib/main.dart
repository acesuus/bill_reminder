import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart'; 
import 'auth_gate.dart';
import 'notification_service.dart';

void main() async {
  // Ensure Flutter bindings are initialized before calling native Firebase code
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  final notificationService = NotificationService();
  await notificationService.init();
  await notificationService.requestPermissions();

  runApp(const BillReminderApp());
}

class BillReminderApp extends StatelessWidget {
  const BillReminderApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Bill Reminder',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        // Optional: Modern material 3 design
        useMaterial3: true, 
      ),
      // Set the AuthGate as the first screen the app loads
      home: const AuthGate(),
      // Hide the debug banner in the top right
      debugShowCheckedModeBanner: false, 
    );
  }
}