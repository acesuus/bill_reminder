import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'auth_screen.dart';
import 'home_screen.dart'; // We will create a placeholder for this next

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      // Listen to the Firebase Auth state
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        // Show a loading spinner while waiting for Firebase to respond
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        // If the snapshot has data, the user is logged in [cite: 15]
        if (snapshot.hasData) {
          return const HomeScreen(); 
        }

        // Otherwise, they are NOT logged in. Show the login/register screen.
        return const AuthScreen();
      },
    );
  }
}