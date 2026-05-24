import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'auth_service.dart';
import 'bill_model.dart';
import 'database_helper.dart';
import 'notification_service.dart';

class AddBillScreen extends StatefulWidget {
  const AddBillScreen({super.key});

  @override
  State<AddBillScreen> createState() => _AddBillScreenState();
}

class _AddBillScreenState extends State<AddBillScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _amountController = TextEditingController();
  final DatabaseHelper _db = DatabaseHelper();
  final AuthService _authService = AuthService();

  DateTime _selectedDate = DateTime.now();
  bool _remindersEnabled = true;
  bool _alarmEnabled = true;
  bool _isLoading = false;

  File? _frontImageFile;
  File? _backImageFile;
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImage(bool isFront) async {
    final pickedFile = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 70,
    );

    if (pickedFile != null) {
      setState(() {
        if (isFront) {
          _frontImageFile = File(pickedFile.path);
        } else {
          _backImageFile = File(pickedFile.path);
        }
      });
    }
  }

  /// Save an image to the app's local documents directory and return its path
  Future<String?> _saveImageLocally(File? imageFile, String billId, String side) async {
    if (imageFile == null) return null;

    try {
      final appDir = await getApplicationDocumentsDirectory();
      final imagesDir = Directory('${appDir.path}/bill_images');
      if (!await imagesDir.exists()) {
        await imagesDir.create(recursive: true);
      }

      final extension = p.extension(imageFile.path);
      final newPath = '${imagesDir.path}/${billId}_$side$extension';
      final savedFile = await imageFile.copy(newPath);
      return savedFile.path;
    } catch (e) {
      debugPrint('Error saving image locally: $e');
      return null;
    }
  }

  Future<void> _presentDatePicker() async {
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime(2100),
    );
    if (pickedDate != null) {
      setState(() => _selectedDate = pickedDate);
    }
  }

  Future<void> _saveBill() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      final user = _authService.currentUser;
      if (user == null) return;

      // Use a timestamp as a unique identifier for image naming
      final uniqueId = DateTime.now().millisecondsSinceEpoch.toString();

      // Save images locally
      String? frontPath = await _saveImageLocally(_frontImageFile, uniqueId, 'front');
      String? backPath = await _saveImageLocally(_backImageFile, uniqueId, 'back');

      // Create the bill object
      final newBill = Bill(
        title: _titleController.text.trim(),
        amount: double.parse(_amountController.text.trim()),
        dueDate: _selectedDate,
        userId: user.id,
        remindersEnabled: _remindersEnabled,
        alarmEnabled: _alarmEnabled,
        frontImagePath: frontPath,
        backImagePath: backPath,
      );

      // Save to SQLite
      final billId = await _db.insertBill(newBill);

      // Schedule notification
      if (_remindersEnabled || _alarmEnabled) {
        int notificationId = billId;

        DateTime scheduleTime = DateTime(
          _selectedDate.year,
          _selectedDate.month,
          _selectedDate.day,
          9, 0, 0,
        );

        if (scheduleTime.isBefore(DateTime.now())) {
          scheduleTime = DateTime.now().add(const Duration(minutes: 2));
        }

        await NotificationService().scheduleBillReminder(
          id: notificationId,
          title: 'Bill Reminder: ${newBill.title}',
          body: 'Your bill of \$${newBill.amount.toStringAsFixed(2)} is due today!',
          scheduledDate: scheduleTime,
          isHighPriorityAlarm: _alarmEnabled,
        );
      }

      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving bill: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add New Bill')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: ListView(
                  children: [
                    TextFormField(
                      controller: _titleController,
                      decoration: const InputDecoration(
                        labelText: 'Bill Name (e.g., Electric)',
                      ),
                      validator: (value) =>
                          value!.isEmpty ? 'Please enter a name' : null,
                    ),
                    const SizedBox(height: 15),
                    TextFormField(
                      controller: _amountController,
                      decoration: const InputDecoration(labelText: 'Amount'),
                      keyboardType: TextInputType.number,
                      validator: (value) => double.tryParse(value ?? '') == null
                          ? 'Enter a valid amount'
                          : null,
                    ),
                    const SizedBox(height: 20),
                    ListTile(
                      title: Text(
                        "Due Date: ${_selectedDate.toLocal()}".split(' ')[0],
                      ),
                      trailing: const Icon(Icons.calendar_today),
                      onTap: _presentDatePicker,
                    ),
                    SwitchListTile(
                      title: const Text('Enable Notifications'),
                      value: _remindersEnabled,
                      onChanged: (val) =>
                          setState(() => _remindersEnabled = val),
                    ),
                    SwitchListTile(
                      title: const Text('Enable Alarm'),
                      value: _alarmEnabled,
                      onChanged: (val) => setState(() => _alarmEnabled = val),
                    ),
                    const SizedBox(height: 20),

                    // Photo Upload Previews
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        // Front Image Picker
                        GestureDetector(
                          onTap: () => _pickImage(true),
                          child: Container(
                            height: 100,
                            width: 100,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade200,
                              border: Border.all(color: Colors.grey),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: _frontImageFile != null
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.file(_frontImageFile!, fit: BoxFit.cover),
                                  )
                                : const Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.camera_alt, color: Colors.grey),
                                      Text('Front', style: TextStyle(color: Colors.grey)),
                                    ],
                                  ),
                          ),
                        ),

                        // Back Image Picker
                        GestureDetector(
                          onTap: () => _pickImage(false),
                          child: Container(
                            height: 100,
                            width: 100,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade200,
                              border: Border.all(color: Colors.grey),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: _backImageFile != null
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.file(_backImageFile!, fit: BoxFit.cover),
                                  )
                                : const Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.camera_alt, color: Colors.grey),
                                      Text('Back', style: TextStyle(color: Colors.grey)),
                                    ],
                                  ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 30),
                    ElevatedButton(
                      onPressed: _saveBill,
                      child: const Text('Save Bill'),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
