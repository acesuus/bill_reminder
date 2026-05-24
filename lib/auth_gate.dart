import 'package:flutter/material.dart';
import 'auth_service.dart';
import 'auth_screen.dart';
import 'home_screen.dart';

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  final AuthService _authService = AuthService();

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<LocalUser?>(
      stream: _authService.authStateChanges,
      builder: (context, snapshot) {
        // Check if the user is already logged in (from singleton state)
        if (_authService.currentUser != null) {
          return const HomeScreen();
        }

        // If we get data from the stream, navigate accordingly
        if (snapshot.hasData && snapshot.data != null) {
          return const HomeScreen();
        }

        // Otherwise, show the login/register screen
        return const AuthScreen();
      },
    );
  }
}
