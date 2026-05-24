import 'package:cloud_firestore/cloud_firestore.dart';

class Bill {
  String? id;
  String title;
  double amount;
  DateTime dueDate;
  bool isPaid;
  String? frontImageUrl;
  String? backImageUrl;
  bool remindersEnabled;
  bool alarmEnabled;
  String userId;

  Bill({
    this.id,
    required this.title,
    required this.amount,
    required this.dueDate,
    this.isPaid = false,
    this.frontImageUrl,
    this.backImageUrl,
    this.remindersEnabled = true,
    this.alarmEnabled = true,
    required this.userId,
  });

  factory Bill.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>?; 

    if (data == null) {
      throw StateError('Missing data for bill document: ${doc.id}');
    }

    return Bill(
      id: doc.id,
      title: data['title'] ?? 'Unknown Bill',
      amount: (data['amount'] ?? 0).toDouble(),
      dueDate: (data['dueDate'] as Timestamp).toDate(),
      isPaid: data['isPaid'] ?? false,
      frontImageUrl: data['frontImageUrl'],
      backImageUrl: data['backImageUrl'],
      remindersEnabled: data['remindersEnabled'] ?? true,
      alarmEnabled: data['alarmEnabled'] ?? true,
      userId: data['userId'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'amount': amount,
      'dueDate': Timestamp.fromDate(dueDate),
      'isPaid': isPaid,
      'frontImageUrl': frontImageUrl,
      'backImageUrl': backImageUrl,
      'remindersEnabled': remindersEnabled,
      'alarmEnabled': alarmEnabled,
      'userId': userId,
    };
  }
}