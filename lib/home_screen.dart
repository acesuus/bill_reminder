import 'package:flutter/material.dart';
import 'auth_service.dart';
import 'bill_model.dart';
import 'database_helper.dart';
import 'add_bill_screen.dart';
import 'edit_bill_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final DatabaseHelper _db = DatabaseHelper();
  final AuthService _authService = AuthService();

  String _selectedFilter = 'All';
  final List<String> _filters = ['All', 'This Month', 'This Year', 'Expired'];

  List<Bill> _allBills = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBills();
  }

  Future<void> _loadBills() async {
    setState(() => _isLoading = true);
    try {
      final user = _authService.currentUser;
      if (user != null) {
        _allBills = await _db.getBillsByUserId(user.id);
      }
    } catch (e) {
      debugPrint('Error loading bills: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<Bill> get _filteredBills {
    final now = DateTime.now();
    return _allBills.where((bill) {
      if (_selectedFilter == 'All') return true;

      if (_selectedFilter == 'This Month') {
        return bill.dueDate.year == now.year && bill.dueDate.month == now.month;
      }

      if (_selectedFilter == 'This Year') {
        return bill.dueDate.year == now.year;
      }

      if (_selectedFilter == 'Expired') {
        return bill.dueDate.isBefore(now) && !bill.isPaid;
      }

      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE5F6FD),
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
              await _authService.signOut();
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
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredBills.isEmpty
                    ? Center(
                        child: Text(
                          'No bills found for "$_selectedFilter".',
                          style: const TextStyle(color: Colors.grey, fontSize: 16),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadBills,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16.0),
                          itemCount: _filteredBills.length,
                          itemBuilder: (context, index) {
                            final bill = _filteredBills[index];
                            final now = DateTime.now();
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
                                  '\u20B1${bill.amount.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF6C8CB0),
                                  ),
                                ),
                                isThreeLine: true,
                                onTap: () async {
                                  await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => EditBillScreen(bill: bill),
                                    ),
                                  );
                                  // Reload bills when returning from edit screen
                                  _loadBills();
                                },
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF6C8CB0),
        onPressed: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const AddBillScreen()),
          );
          // Reload bills when returning from add screen
          _loadBills();
        },
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
