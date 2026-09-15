import 'package:flutter/material.dart';

class DistroLogo extends StatelessWidget {
  final double size;

  const DistroLogo({
    super.key,
    this.size = 85,
  });

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/logo/distro_logo.png',
      width: size,
      height: size,
      fit: BoxFit.contain,
    );
  }
}