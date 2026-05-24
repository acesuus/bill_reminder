import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'bill_model.dart';
import 'add_bill_screen.dart';
import 'edit_bill_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // The currently selected filter. We default to 'All' so the dashboard isn't empty.
  String _selectedFilter = 'All'; 
  
  // The exact filter options required by the system description
  final List<String> _filters = ['All', 'This Month', 'This Year', 'Expired'];

  @override
  Widget build(BuildContext context) {
    final currentUser = FirebaseAuth.instance.currentUser;

    return Scaffold(
      backgroundColor: const Color(0xFFE5F6FD), // Matching your login screen's background
      appBar: AppBar(
        title: const Text('Dashboard', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: const Color(0xFF6C8CB0),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
            },
          )
        ],
      ),
      body: Column(
        children: [
          // --- FILTER SECTION ---
          Container(
            height: 60,
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _filters.length,
              itemBuilder: (context, index) {
                final filter = _filters[index];
                final isSelected = _selectedFilter == filter;
                
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: FilterChip(
                    label: Text(
                      filter,
                      style: TextStyle(
                        color: isSelected ? Colors.white : const Color(0xFF6C8CB0),
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    selected: isSelected,
                    showCheckmark: false,
                    selectedColor: const Color(0xFF6C8CB0),
                    backgroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(
                        color: isSelected ? Colors.transparent : const Color(0xFF6C8CB0).withValues(alpha: 0.5),
                      ),
                    ),
                    onSelected: (bool selected) {
                      setState(() {
                        _selectedFilter = filter;
                      });
                    },
                  ),
                );
              },
            ),
          ),
          
          // --- BILLS LIST SECTION ---
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('bills')
                  .where('userId', isEqualTo: currentUser?.uid)
                  .orderBy('dueDate') 
                  .snapshots(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }

                final docs = snapshot.data?.docs ?? [];
                final now = DateTime.now();

                // 1. Convert Firestore docs to Bill objects
                List<Bill> allBills = docs.map((doc) => Bill.fromFirestore(doc)).toList();

                // 2. Apply the specific filter logic 
                List<Bill> filteredBills = allBills.where((bill) {
                  if (_selectedFilter == 'All') return true;
                  
                  if (_selectedFilter == 'This Month') {
                    return bill.dueDate.year == now.year && bill.dueDate.month == now.month;
                  }
                  
                  if (_selectedFilter == 'This Year') {
                    return bill.dueDate.year == now.year;
                  }
                  
                  if (_selectedFilter == 'Expired') {
                    // An expired bill is one where the date has passed AND it is not yet paid [cite: 13, 15]
                    return bill.dueDate.isBefore(now) && !bill.isPaid;
                  }
                  
                  return true;
                }).toList();

                if (filteredBills.isEmpty) {
                  return Center(
                    child: Text(
                      'No bills found for "$snapshot".',
                      style: const TextStyle(color: Colors.grey, fontSize: 16),
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16.0),
                  itemCount: filteredBills.length,
                  itemBuilder: (context, index) {
                    final bill = filteredBills[index];
                    final isExpired = bill.dueDate.isBefore(now) && !bill.isPaid;

                    return Card(
                      elevation: 0,
                      color: Colors.white,
                      margin: const EdgeInsets.only(bottom: 12.0),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(
                          color: isExpired ? Colors.red.withValues(alpha: 0.5) : Colors.transparent,
                          width: 2,
                        ),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        leading: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isExpired ? Colors.red.shade50 : const Color(0xFFE5F6FD),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            isExpired ? Icons.warning_rounded : Icons.receipt_long_rounded,
                            color: isExpired ? Colors.red : const Color(0xFF6C8CB0),
                          ),
                        ),
                        title: Text(
                          bill.title,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 8.0),
                          child: Text(
                            'Due: ${bill.dueDate.toLocal().toString().split(' ')[0]}\n'
                            'Status: ${bill.isPaid ? "Paid" : "Pending"}',
                            style: TextStyle(
                              color: isExpired ? Colors.red : Colors.grey.shade600,
                              height: 1.4,
                            ),
                          ),
                        ),
                        trailing: Text(
                          '₱${bill.amount.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF6C8CB0),
                          ),
                        ),
                        isThreeLine: true,
                        onTap: () {
                          // The user can tap to examine whatever bill they want and update it [cite: 10, 13]
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => EditBillScreen(bill: bill),
                            ),
                          );
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF6C8CB0),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const AddBillScreen()),
          );
        },
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}