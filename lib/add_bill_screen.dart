import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'bill_model.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
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

  DateTime _selectedDate = DateTime.now();
  bool _remindersEnabled = true;
  bool _alarmEnabled = true;
  bool _isLoading = false;

  // Variables to hold the local files before uploading
  File? _frontImageFile;
  File? _backImageFile;
  final ImagePicker _picker = ImagePicker();

  // Method to pick an image
  Future<void> _pickImage(bool isFront) async {
    final pickedFile = await _picker.pickImage(
      source: ImageSource.camera, // Can change to ImageSource.gallery if needed
      imageQuality: 70, // Compresses the image to save Firebase Storage space
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

  // Method to upload an image and return the download URL
  Future<String?> _uploadImage(File? imageFile, String billId, String side) async {
    if (imageFile == null) return null;

    try {
      final storageRef = FirebaseStorage.instance
          .ref()
          .child('bill_images')
          .child(FirebaseAuth.instance.currentUser!.uid)
          .child('${billId}_$side.jpg');

      final uploadTask = await storageRef.putFile(imageFile);
      return await uploadTask.ref.getDownloadURL();
    } catch (e) {
      debugPrint('Error uploading image: $e');
      return null;
    }
  }

  // Function to show the Date Picker
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
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;

      // 1. Generate a unique ID for the new bill document
      final docRef = FirebaseFirestore.instance.collection('bills').doc();

      // 2. Upload images using that new ID
      String? frontUrl = await _uploadImage(_frontImageFile, docRef.id, 'front');
      String? backUrl = await _uploadImage(_backImageFile, docRef.id, 'back');

      // 3. Create the bill object
      final newBill = Bill(
        id: docRef.id,
        title: _titleController.text.trim(),
        amount: double.parse(_amountController.text.trim()),
        dueDate: _selectedDate,
        userId: user.uid,
        remindersEnabled: _remindersEnabled,
        alarmEnabled: _alarmEnabled,
        frontImageUrl: frontUrl,
        backImageUrl: backUrl,
      );

      // 4. Save to Firestore
      await docRef.set(newBill.toMap());

      // 5. --- SCHEDULE THE NOTIFICATION ---
      if (_remindersEnabled || _alarmEnabled) {
        // Convert the Firestore string ID into an integer for the notification system
        int notificationId = docRef.id.hashCode;

        // Schedule the alarm for 9:00 AM on the due date
        DateTime scheduleTime = DateTime(
          _selectedDate.year,
          _selectedDate.month,
          _selectedDate.day,
          9, 0, 0, // 9:00 AM
        );

        // Safety check: If the user sets the bill due "Today" and it is already past 9:00 AM,
        // we will schedule the alarm for 2 minutes from now so it doesn't fail.
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
      // -------------------------------------

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
                    
                    // --- THE MISSING UI: Photo Upload Previews ---
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
                    // ---------------------------------------------
                    
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