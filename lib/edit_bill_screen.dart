import 'package:flutter/material.dart';
import 'bill_model.dart';
import 'database_helper.dart';

class EditBillScreen extends StatefulWidget {
  final Bill bill;

  const EditBillScreen({super.key, required this.bill});

  @override
  State<EditBillScreen> createState() => _EditBillScreenState();
}

class _EditBillScreenState extends State<EditBillScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _amountController;
  final DatabaseHelper _db = DatabaseHelper();

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
      final updatedBill = Bill(
        id: widget.bill.id,
        title: _titleController.text.trim(),
        amount: double.parse(_amountController.text.trim()),
        dueDate: _selectedDate,
        isPaid: _isPaid,
        remindersEnabled: _remindersEnabled,
        alarmEnabled: _alarmEnabled,
        userId: widget.bill.userId,
        frontImagePath: widget.bill.frontImagePath,
        backImagePath: widget.bill.backImagePath,
      );

      await _db.updateBill(updatedBill);

      if (!mounted) return;
      Navigator.pop(context);
    } catch (e) {
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

      await _db.deleteBill(widget.bill.id!);

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
                      activeTrackColor: Colors.green.shade200,
                      activeColor: Colors.green,
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
