import 'dart:async';
import 'package:flutter/foundation.dart';
import 'database_helper.dart';

class LocalUser {
  final int id;
  final String username;

  LocalUser({required this.id, required this.username});
}

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final DatabaseHelper _db = DatabaseHelper();

  final StreamController<LocalUser?> _authStateController =
      StreamController<LocalUser?>.broadcast();

  Stream<LocalUser?> get authStateChanges => _authStateController.stream;

  LocalUser? _currentUser;
  LocalUser? get currentUser => _currentUser;

  /// Sign in with just a name. If the name doesn't exist, create it automatically.
  Future<LocalUser?> signInWithName(String name) async {
    try {
      // Check if user already exists by username
      final existingUser = await _db.getUserByUsername(name);

      if (existingUser != null) {
        _currentUser = LocalUser(
          id: existingUser['id'] as int,
          username: existingUser['username'] as String,
        );
      } else {
        // Auto-create the user
        final userId = await _db.insertUser({
          'username': name,
          'email': '',
          'password': '',
        });
        _currentUser = LocalUser(id: userId, username: name);
      }

      _authStateController.add(_currentUser);
      return _currentUser;
    } catch (e) {
      debugPrint('Sign in error: $e');
      rethrow;
    }
  }

  Future<void> signOut() async {
    _currentUser = null;
    _authStateController.add(null);
  }

  void dispose() {
    _authStateController.close();
  }
}
