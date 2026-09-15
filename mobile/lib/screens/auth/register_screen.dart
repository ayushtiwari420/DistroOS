import 'package:flutter/material.dart';
import '../../widgets/distro_logo.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final businessController = TextEditingController();
  final phoneController = TextEditingController();
  final cityController = TextEditingController();

  bool obscurePassword = true;
  String selectedRole = 'wholesaler';

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    businessController.dispose();
    phoneController.dispose();
    cityController.dispose();
    super.dispose();
  }

  void handleRegister() {
    print('REGISTER BUTTON PRESSED');
    print('NAME: ${nameController.text}');
    print('EMAIL: ${emailController.text}');
    print('ROLE: $selectedRole');
  }

  InputDecoration inputDecoration({
    required String hint,
    required IconData icon,
  }) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(
          color: Color(0xFFE5E7EB),
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(
          color: Color(0xFF2563EB),
          width: 1.5,
        ),
      ),
    );
  }

  Widget fieldLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Color(0xFF111827),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 28,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Back button
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back),
                padding: EdgeInsets.zero,
              ),

              const SizedBox(height: 18),

              // Logo
              
              const Center(child: DistroLogo(size:100,)),
              const SizedBox(height: 32),
              const Text(
                'Create account',
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF111827),
                ),
              ),

              const SizedBox(height: 8),

              const Text(
                'Create your DistroOS business account',
                style: TextStyle(
                  fontSize: 15,
                  color: Color(0xFF6B7280),
                ),
              ),

              const SizedBox(height: 32),

              // Name
              fieldLabel('Full Name'),
              TextField(
                controller: nameController,
                textCapitalization: TextCapitalization.words,
                decoration: inputDecoration(
                  hint: 'Enter your name',
                  icon: Icons.person_outline,
                ),
              ),

              const SizedBox(height: 18),

              // Email
              fieldLabel('Email'),
              TextField(
                controller: emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: inputDecoration(
                  hint: 'Enter your email',
                  icon: Icons.email_outlined,
                ),
              ),

              const SizedBox(height: 18),

              // Password
              fieldLabel('Password'),
              TextField(
                controller: passwordController,
                obscureText: obscurePassword,
                decoration: inputDecoration(
                  hint: 'Create a password',
                  icon: Icons.lock_outline,
                ).copyWith(
                  suffixIcon: IconButton(
                    onPressed: () {
                      setState(() {
                        obscurePassword = !obscurePassword;
                      });
                    },
                    icon: Icon(
                      obscurePassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 18),

              // Role
              fieldLabel('Account Type'),
              DropdownButtonFormField<String>(
                initialValue: selectedRole,
                decoration: inputDecoration(
                  hint: 'Select account type',
                  icon: Icons.business_center_outlined,
                ),
                items: const [
                  DropdownMenuItem(
                    value: 'wholesaler',
                    child: Text('Wholesaler'),
                  ),
                  DropdownMenuItem(
                    value: 'salesman',
                    child: Text('Salesman'),
                  ),
                  DropdownMenuItem(
                    value: 'retailer',
                    child: Text('Retailer'),
                  ),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      selectedRole = value;
                    });
                  }
                },
              ),

              const SizedBox(height: 18),

              // Business
              fieldLabel('Business Name'),
              TextField(
                controller: businessController,
                decoration: inputDecoration(
                  hint: 'Enter business name',
                  icon: Icons.store_outlined,
                ),
              ),

              const SizedBox(height: 18),

              // Phone
              fieldLabel('Phone'),
              TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                decoration: inputDecoration(
                  hint: 'Enter phone number',
                  icon: Icons.phone_outlined,
                ),
              ),

              const SizedBox(height: 18),

              // City
              fieldLabel('City'),
              TextField(
                controller: cityController,
                textCapitalization: TextCapitalization.words,
                decoration: inputDecoration(
                  hint: 'Enter your city',
                  icon: Icons.location_city_outlined,
                ),
              ),

              const SizedBox(height: 28),

              // Register button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: handleRegister,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Create Account',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Login link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Already have an account? ',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: const Text(
                      'Sign in',
                      style: TextStyle(
                        color: Color(0xFF2563EB),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}