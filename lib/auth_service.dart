import 'dart:async';
import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'database_helper.dart';

class LocalUser {
  final int id;
  final String username;
  final String email;

  LocalUser({required this.id, required this.username, required this.email});
}

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final DatabaseHelper _db = DatabaseHelper();

  // StreamController to mimic Firebase auth state changes
  final StreamController<LocalUser?> _authStateController =
      StreamController<LocalUser?>.broadcast();

  Stream<LocalUser?> get authStateChanges => _authStateController.stream;

  LocalUser? _currentUser;
  LocalUser? get currentUser => _currentUser;

  String _hashPassword(String password) {
    final bytes = utf8.encode(password);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  Future<LocalUser?> registerWithEmailAndPassword(
    String email,
    String password,
    String username,
  ) async {
    try {
      // Check if user already exists
      final existingUser = await _db.getUserByEmail(email);
      if (existingUser != null) {
        throw Exception('An account with this email already exists');
      }

      final hashedPassword = _hashPassword(password);

      final userId = await _db.insertUser({
        'username': username,
        'email': email,
        'password': hashedPassword,
      });

      _currentUser = LocalUser(id: userId, username: username, email: email);
      _authStateController.add(_currentUser);
      return _currentUser;
    } catch (e) {
      debugPrint('Registration error: $e');
      rethrow;
    }
  }

  Future<LocalUser?> signInWithEmailAndPassword(
    String email,
    String password,
  ) async {
    try {
      final user = await _db.getUserByEmail(email);
      if (user == null) {
        throw Exception('Invalid email or password');
      }

      final hashedPassword = _hashPassword(password);
      if (user['password'] != hashedPassword) {
        throw Exception('Invalid email or password');
      }

      _currentUser = LocalUser(
        id: user['id'] as int,
        username: user['username'] as String,
        email: user['email'] as String,
      );
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
