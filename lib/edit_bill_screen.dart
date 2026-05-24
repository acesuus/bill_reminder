import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'bill_model.dart';

class EditBillScreen extends StatefulWidget {
  final Bill bill;

  // FIX 1: Cleaned up the key parameter
  const EditBillScreen({super.key, required this.bill});

  @override
  // FIX 2: Changed return type to a public API (State<EditBillScreen>)
  State<EditBillScreen> createState() => _EditBillScreenState();
}

class _EditBillScreenState extends State<EditBillScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _amountController;
  
  late DateTime _selectedDate;
  late bool _remindersEnabled;
  late bool _alarmEnabled;
  late bool _isPaid;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.bill.title);
    _amountController = TextEditingController(text: widget.bill.amount.toString());
    _selectedDate = widget.bill.dueDate;
    _remindersEnabled = widget.bill.remindersEnabled;
    _alarmEnabled = widget.bill.alarmEnabled;
    _isPaid = widget.bill.isPaid;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _presentDatePicker() async {
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000), 
      lastDate: DateTime(2100),
    );
    if (pickedDate != null) {
      setState(() => _selectedDate = pickedDate);
    }
  }

  Future<void> _updateBill() async {
    if (!_formKey.currentState!.validate()) return;
    if (widget.bill.id == null) return;

    setState(() => _isLoading = true);

    try {
      final updatedData = {
        'title': _titleController.text.trim(),
        'amount': double.parse(_amountController.text.trim()),
        'dueDate': Timestamp.fromDate(_selectedDate),
        'remindersEnabled': _remindersEnabled,
        'alarmEnabled': _alarmEnabled,
        'isPaid': _isPaid,
      };

      await FirebaseFirestore.instance
          .collection('bills')
          .doc(widget.bill.id)
          .update(updatedData);

      // FIX 3: Ensure the context is still mounted after an async gap
      if (!mounted) return; 
      Navigator.pop(context); 
      
    } catch (e) {
      // FIX 3: Ensure the context is still mounted here as well
      if (!mounted) return; 
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error updating: $e')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _confirmDelete() async {
    final bool? confirm = await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Bill?'),
        content: const Text('Are you sure you want to permanently delete this bill?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true && widget.bill.id != null) {
      setState(() => _isLoading = true);
      
      await FirebaseFirestore.instance.collection('bills').doc(widget.bill.id).delete();
      
      // FIX 3: Check mounted status before popping
      if (!mounted) return;
      Navigator.pop(context); 
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Bill'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
            onPressed: _isLoading ? null : _confirmDelete,
            tooltip: 'Delete Bill',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: ListView(
                  children: [
                    SwitchListTile(
                      title: const Text('Mark as Paid', style: TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: const Text('Removes from active alerts'),
                      value: _isPaid,
                      // FIX 4: Updated to activeThumbColor to replace the deprecated activeColor
                      activeThumbColor: Colors.green, 
                      onChanged: (val) => setState(() => _isPaid = val),
                    ),
                    const Divider(),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _titleController,
                      decoration: const InputDecoration(labelText: 'Bill Name'),
                      validator: (value) => value!.isEmpty ? 'Please enter a name' : null,
                    ),
                    const SizedBox(height: 15),
                    TextFormField(
                      controller: _amountController,
                      decoration: const InputDecoration(labelText: 'Amount'),
                      keyboardType: TextInputType.number,
                      validator: (value) => double.tryParse(value ?? '') == null ? 'Enter a valid amount' : null,
                    ),
                    const SizedBox(height: 20),
                    ListTile(
                      title: Text("Due Date: ${_selectedDate.toLocal()}".split(' ')[0]),
                      trailing: const Icon(Icons.calendar_today),
                      onTap: _presentDatePicker,
                    ),
                    SwitchListTile(
                      title: const Text('Enable Notifications'),
                      value: _remindersEnabled,
                      onChanged: (val) => setState(() => _remindersEnabled = val),
                    ),
                    SwitchListTile(
                      title: const Text('Enable Alarm'),
                      value: _alarmEnabled,
                      onChanged: (val) => setState(() => _alarmEnabled = val),
                    ),
                    const SizedBox(height: 30),
                    ElevatedButton(
                      onPressed: _updateBill,
                      child: const Text('Update Bill Details'),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}