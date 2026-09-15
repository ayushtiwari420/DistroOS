import 'package:flutter/material.dart';
import 'screens/wholesaler/wholesaler_dashboard.dart';

void main() {
  runApp(const DistroOSApp());
}

class DistroOSApp extends StatelessWidget {
  const DistroOSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'DistroOS',
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF5F6FA),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2563EB),
        ),
        fontFamily: 'Inter',
      ),
      home: const WholesalerDashboard(),
    );
  }
}