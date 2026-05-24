class Bill {
  int? id;
  String title;
  double amount;
  DateTime dueDate;
  bool isPaid;
  String? frontImagePath;
  String? backImagePath;
  bool remindersEnabled;
  bool alarmEnabled;
  int userId;

  Bill({
    this.id,
    required this.title,
    required this.amount,
    required this.dueDate,
    this.isPaid = false,
    this.frontImagePath,
    this.backImagePath,
    this.remindersEnabled = true,
    this.alarmEnabled = true,
    required this.userId,
  });

  factory Bill.fromMap(Map<String, dynamic> map) {
    return Bill(
      id: map['id'] as int?,
      title: map['title'] as String? ?? 'Unknown Bill',
      amount: (map['amount'] as num?)?.toDouble() ?? 0.0,
      dueDate: DateTime.parse(map['dueDate'] as String),
      isPaid: (map['isPaid'] as int?) == 1,
      frontImagePath: map['frontImagePath'] as String?,
      backImagePath: map['backImagePath'] as String?,
      remindersEnabled: (map['remindersEnabled'] as int?) == 1,
      alarmEnabled: (map['alarmEnabled'] as int?) == 1,
      userId: map['userId'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    final map = <String, dynamic>{
      'title': title,
      'amount': amount,
      'dueDate': dueDate.toIso8601String(),
      'isPaid': isPaid ? 1 : 0,
      'frontImagePath': frontImagePath,
      'backImagePath': backImagePath,
      'remindersEnabled': remindersEnabled ? 1 : 0,
      'alarmEnabled': alarmEnabled ? 1 : 0,
      'userId': userId,
    };
    if (id != null) {
      map['id'] = id;
    }
    return map;
  }
}
