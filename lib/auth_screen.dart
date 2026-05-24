import 'package:flutter/material.dart';
import 'auth_service.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _usernameController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final AuthService _authService = AuthService();

  bool _isLogin = true;
  bool _isLoading = false;
  String _errorMessage = '';
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _usernameController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    if (!_isLogin &&
        _passwordController.text != _confirmPasswordController.text) {
      setState(() {
        _errorMessage = 'Passwords do not match';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      if (_isLogin) {
        await _authService.signInWithEmailAndPassword(
          _emailController.text.trim(),
          _passwordController.text.trim(),
        );
      } else {
        await _authService.registerWithEmailAndPassword(
          _emailController.text.trim(),
          _passwordController.text.trim(),
          _usernameController.text.trim(),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const bgColor = Color(0xFFE5F6FD);
    const primaryBlue = Color(0xFF6C8CB0);
    const gradientStart = Color(0xFF7A9BBF);
    const gradientEnd = Color(0xFFB1C6D9);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // --- CUSTOM HEADER SECTION ---
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(right: 50, bottom: 20),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 35,
                        vertical: 35,
                      ),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [
                            Color(0xFF91B8D1),
                            Color.fromARGB(255, 179, 208, 227),
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.25),
                            blurRadius: 15,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "RICHMOND'S",
                            style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.w900,
                              color: Colors.black,
                              letterSpacing: 1.0,
                            ),
                          ),
                          const SizedBox(height: 5),
                          const Text(
                            "BILL\nREMINDER\nAPP",
                            style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.w300,
                              height: 1.15,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                SizedBox(height: _isLogin ? 50 : 20),

                // --- INPUT FIELDS ---
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Username Field (Sign Up Only)
                      if (!_isLogin) ...[
                        TextFormField(
                          controller: _usernameController,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'USERNAME',
                            hintStyle: TextStyle(
                              color: Colors.grey.shade400,
                              fontSize: 12,
                              letterSpacing: 1.2,
                            ),
                            filled: true,
                            fillColor: Colors.white,
                            contentPadding: const EdgeInsets.symmetric(
                              vertical: 18,
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(
                                color: primaryBlue.withValues(alpha: 0.5),
                                width: 1.5,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: primaryBlue,
                                width: 2,
                              ),
                            ),
                            errorBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: Colors.red,
                                width: 1.5,
                              ),
                            ),
                            focusedErrorBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: Colors.red,
                                width: 2,
                              ),
                            ),
                          ),
                          validator: (value) =>
                              value!.isEmpty ? 'Enter a username' : null,
                        ),
                        const SizedBox(height: 20),
                      ],

                      // Email Field
                      TextFormField(
                        controller: _emailController,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 14),
                        decoration: InputDecoration(
                          hintText: _isLogin ? 'EMAIL' : 'EMAIL',
                          hintStyle: TextStyle(
                            color: Colors.grey.shade400,
                            fontSize: 12,
                            letterSpacing: 1.2,
                          ),
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding: const EdgeInsets.symmetric(
                            vertical: 18,
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: primaryBlue.withValues(alpha: 0.5),
                              width: 1.5,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: primaryBlue,
                              width: 2,
                            ),
                          ),
                          errorBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Colors.red,
                              width: 1.5,
                            ),
                          ),
                          focusedErrorBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Colors.red,
                              width: 2,
                            ),
                          ),
                        ),
                        validator: (value) {
                          if (value!.isEmpty) {
                            return 'Enter a valid email';
                          }
                          if (!value.contains('@')) {
                            return 'Enter a valid email';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 20),

                      // Password Field
                      TextFormField(
                        controller: _passwordController,
                        textAlign: TextAlign.center,
                        obscureText: _obscurePassword,
                        style: const TextStyle(fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'PASSWORD',
                          hintStyle: TextStyle(
                            color: Colors.grey.shade400,
                            fontSize: 12,
                            letterSpacing: 1.2,
                          ),
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding: const EdgeInsets.symmetric(
                            vertical: 18,
                          ),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_off
                                  : Icons.visibility,
                              color: Colors.grey,
                            ),
                            onPressed: () {
                              setState(() {
                                _obscurePassword = !_obscurePassword;
                              });
                            },
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: primaryBlue.withValues(alpha: 0.5),
                              width: 1.5,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: primaryBlue,
                              width: 2,
                            ),
                          ),
                          errorBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Colors.red,
                              width: 1.5,
                            ),
                          ),
                          focusedErrorBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Colors.red,
                              width: 2,
                            ),
                          ),
                        ),
                        validator: (value) =>
                            value!.length < 6 ? 'Min 6 characters' : null,
                      ),

                      // Confirm Password Field (Sign Up Only)
                      if (!_isLogin) ...[
                        const SizedBox(height: 20),
                        TextFormField(
                          controller: _confirmPasswordController,
                          textAlign: TextAlign.center,
                          obscureText: _obscureConfirmPassword,
                          style: const TextStyle(fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'CONFIRM PASSWORD',
                            hintStyle: TextStyle(
                              color: Colors.grey.shade400,
                              fontSize: 12,
                              letterSpacing: 1.2,
                            ),
                            filled: true,
                            fillColor: Colors.white,
                            contentPadding: const EdgeInsets.symmetric(
                              vertical: 18,
                            ),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscureConfirmPassword
                                    ? Icons.visibility_off
                                    : Icons.visibility,
                                color: Colors.grey,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscureConfirmPassword =
                                      !_obscureConfirmPassword;
                                });
                              },
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(
                                color: primaryBlue.withValues(alpha: 0.5),
                                width: 1.5,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: primaryBlue,
                                width: 2,
                              ),
                            ),
                            errorBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: Colors.red,
                                width: 1.5,
                              ),
                            ),
                            focusedErrorBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: Colors.red,
                                width: 2,
                              ),
                            ),
                          ),
                          validator: (value) {
                            if (value!.isEmpty) {
                              return 'Confirm your password';
                            }
                            if (value != _passwordController.text) {
                              return 'Passwords do not match';
                            }
                            return null;
                          },
                        ),
                      ],

                      const SizedBox(height: 8),

                      // Forgot Password Link
                      if (_isLogin)
                        Text(
                          'FORGOT PASSWORD?',
                          style: TextStyle(
                            color: primaryBlue.withValues(alpha: 0.8),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                    ],
                  ),
                ),

                const SizedBox(height: 30),

                // Error Message Display
                if (_errorMessage.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 40.0,
                      vertical: 10,
                    ),
                    child: Text(
                      _errorMessage,
                      style: const TextStyle(
                        color: Colors.red,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),

                // --- LOG IN / SIGN UP BUTTON ---
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 50),
                  height: 55,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(30),
                    gradient: const LinearGradient(
                      colors: [gradientStart, gradientEnd],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: gradientStart.withValues(alpha: 0.5),
                        blurRadius: 15,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submitForm,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
                    child: Center(
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : Text(
                              _isLogin ? 'LOG IN' : 'REGISTER',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: 1.5,
                              ),
                            ),
                    ),
                  ),
                ),

                const SizedBox(height: 30),

                // --- TOGGLE STATE ---
                GestureDetector(
                  onTap: () {
                    setState(() {
                      _isLogin = !_isLogin;
                      _errorMessage = '';
                    });
                  },
                  child: Text(
                    _isLogin ? 'SIGN UP' : 'BACK TO LOG IN',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),

                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
