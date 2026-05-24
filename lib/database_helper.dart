import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'bill_model.dart';

class DatabaseHelper {
  static final DatabaseHelper _instance = DatabaseHelper._internal();
  factory DatabaseHelper() => _instance;
  DatabaseHelper._internal();

  static Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'bill_reminder.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        dueDate TEXT NOT NULL,
        isPaid INTEGER NOT NULL DEFAULT 0,
        frontImagePath TEXT,
        backImagePath TEXT,
        remindersEnabled INTEGER NOT NULL DEFAULT 1,
        alarmEnabled INTEGER NOT NULL DEFAULT 1,
        userId INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    ''');
  }

  // --- User Methods ---

  Future<int> insertUser(Map<String, dynamic> user) async {
    final db = await database;
    return await db.insert('users', user);
  }

  Future<Map<String, dynamic>?> getUserByEmail(String email) async {
    final db = await database;
    final results = await db.query(
      'users',
      where: 'email = ?',
      whereArgs: [email],
    );
    if (results.isNotEmpty) return results.first;
    return null;
  }

  Future<Map<String, dynamic>?> getUserById(int id) async {
    final db = await database;
    final results = await db.query(
      'users',
      where: 'id = ?',
      whereArgs: [id],
    );
    if (results.isNotEmpty) return results.first;
    return null;
  }

  // --- Bill Methods ---

  Future<int> insertBill(Bill bill) async {
    final db = await database;
    return await db.insert('bills', bill.toMap());
  }

  Future<List<Bill>> getBillsByUserId(int userId) async {
    final db = await database;
    final results = await db.query(
      'bills',
      where: 'userId = ?',
      whereArgs: [userId],
      orderBy: 'dueDate ASC',
    );
    return results.map((map) => Bill.fromMap(map)).toList();
  }

  Future<int> updateBill(Bill bill) async {
    final db = await database;
    return await db.update(
      'bills',
      bill.toMap(),
      where: 'id = ?',
      whereArgs: [bill.id],
    );
  }

  Future<int> deleteBill(int id) async {
    final db = await database;
    return await db.delete(
      'bills',
      where: 'id = ?',
      whereArgs: [id],
    );
  }
}
