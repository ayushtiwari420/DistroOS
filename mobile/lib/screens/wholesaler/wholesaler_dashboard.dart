import 'package:flutter/material.dart';
import 'products_screen.dart';

class WholesalerDashboard extends StatefulWidget {
  const WholesalerDashboard({super.key});

  @override
  State<WholesalerDashboard> createState() =>
      _WholesalerDashboardState();
}

class _WholesalerDashboardState
    extends State<WholesalerDashboard> {

  int selectedIndex = 0;

  final List<Map<String, dynamic>> recentOrders = [
    {
      'id': '#ORD1024',
      'retailer': 'Shree General Store',
      'amount': '₹4,250',
      'status': 'Delivered',
    },
    {
      'id': '#ORD1023',
      'retailer': 'Maharashtra Mart',
      'amount': '₹2,800',
      'status': 'Pending',
    },
    {
      'id': '#ORD1022',
      'retailer': 'Virar Wholesale',
      'amount': '₹6,450',
      'status': 'Dispatched',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),

      body: SafeArea(
        child: IndexedStack(
          index: selectedIndex,
          children: [
            _buildDashboard(),
            _buildPlaceholder('Orders'),
            const ProductsScreen(),
            _buildPlaceholder('Profile'),
          ],
        ),
      ),

      bottomNavigationBar: _buildBottomNavigation(),
    );
  }

  // ─────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────

  Widget _buildDashboard() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 30),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          // Header
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'Good morning,',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Ayush',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF111827),
                      ),
                    ),
                  ],
                ),
              ),

              // Notification
              _circleButton(
                icon: Icons.notifications_none_rounded,
              ),

              const SizedBox(width: 10),

              // Profile
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB),
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: const Text(
                  'AT',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 26),

          // Sales summary
          _buildSalesCard(),

          const SizedBox(height: 28),

          // Quick actions
          const Text(
            'Quick Actions',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF111827),
            ),
          ),

          const SizedBox(height: 14),

          Row(
            children: [
              Expanded(
                child: _quickAction(
                  icon: Icons.inventory_2_outlined,
                  title: 'Products',
                  subtitle: '128 items',
                  iconColor: const Color(0xFF2563EB),
                  onTap: () {},
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _quickAction(
                  icon: Icons.store_outlined,
                  title: 'Retailers',
                  subtitle: '42 retailers',
                  iconColor: const Color(0xFF7C3AED),
                  onTap: () {},
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _quickAction(
                  icon: Icons.people_outline,
                  title: 'Salesmen',
                  subtitle: '8 salesmen',
                  iconColor: const Color(0xFF16A34A),
                  onTap: () {},
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _quickAction(
                  icon: Icons.credit_card_outlined,
                  title: 'Credit',
                  subtitle: '₹18,500 due',
                  iconColor: const Color(0xFFD97706),
                  onTap: () {},
                ),
              ),
            ],
          ),

          const SizedBox(height: 30),

          // Recent orders
          Row(
            mainAxisAlignment:
                MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recent Orders',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF111827),
                ),
              ),

              TextButton(
                onPressed: () {
                  setState(() {
                    selectedIndex = 1;
                  });
                },
                child: const Text(
                  'View all',
                  style: TextStyle(
                    color: Color(0xFF2563EB),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          ...recentOrders.map(
            (order) => _orderCard(order),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────
  // SALES CARD
  // ─────────────────────────────────────────────

  Widget _buildSalesCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF2563EB),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [

          Row(
            mainAxisAlignment:
                MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "Today's Overview",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),

              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Today',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 22),

          Row(
            children: [
              Expanded(
                child: _summaryItem(
                  '₹48,250',
                  'Total Sales',
                ),
              ),

              Container(
                width: 1,
                height: 48,
                color: Colors.white.withValues(alpha: 0.25),
              ),

              Expanded(
                child: _summaryItem(
                  '24',
                  'Orders',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _summaryItem(
    String value,
    String label,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: 12,
      ),
      child: Column(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 25,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.75),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────
  // QUICK ACTION
  // ─────────────────────────────────────────────

  Widget _quickAction({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: const Color(0xFFE5E7EB),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: iconColor,
                size: 21,
              ),
            ),

            const SizedBox(width: 11),

            Expanded(
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────
  // ORDER CARD
  // ─────────────────────────────────────────────

  Widget _orderCard(
    Map<String, dynamic> order,
  ) {
    Color statusColor;
    Color statusBackground;

    switch (order['status']) {
      case 'Delivered':
        statusColor = const Color(0xFF16A34A);
        statusBackground = const Color(0xFFF0FDF4);
        break;

      case 'Pending':
        statusColor = const Color(0xFFD97706);
        statusBackground = const Color(0xFFFFFBEB);
        break;

      default:
        statusColor = const Color(0xFF2563EB);
        statusBackground = const Color(0xFFEFF4FF);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: const Color(0xFFE5E7EB),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFFEFF4FF),
              borderRadius: BorderRadius.circular(11),
            ),
            child: const Icon(
              Icons.shopping_bag_outlined,
              color: Color(0xFF2563EB),
              size: 20,
            ),
          ),

          const SizedBox(width: 12),

          Expanded(
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                Text(
                  order['id'],
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: Color(0xFF111827),
                  ),
                ),

                const SizedBox(height: 4),

                Text(
                  order['retailer'],
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),

          Column(
            crossAxisAlignment:
                CrossAxisAlignment.end,
            children: [
              Text(
                order['amount'],
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  color: Color(0xFF111827),
                ),
              ),

              const SizedBox(height: 5),

              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: statusBackground,
                  borderRadius:
                      BorderRadius.circular(20),
                ),
                child: Text(
                  order['status'],
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────
  // BOTTOM NAVIGATION
  // ─────────────────────────────────────────────

  Widget _buildBottomNavigation() {
    return NavigationBar(
      selectedIndex: selectedIndex,
      onDestinationSelected: (index) {
        setState(() {
          selectedIndex = index;
        });
      },
      backgroundColor: Colors.white,
      indicatorColor: const Color(0xFFEFF4FF),
      elevation: 3,
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.dashboard_outlined),
          selectedIcon: Icon(Icons.dashboard),
          label: 'Home',
        ),
        NavigationDestination(
          icon: Icon(Icons.shopping_cart_outlined),
          selectedIcon: Icon(Icons.shopping_cart),
          label: 'Orders',
        ),
        NavigationDestination(
          icon: Icon(Icons.inventory_2_outlined),
          selectedIcon: Icon(Icons.inventory_2),
          label: 'Products',
        ),
        NavigationDestination(
          icon: Icon(Icons.person_outline),
          selectedIcon: Icon(Icons.person),
          label: 'Profile',
        ),
      ],
    );
  }

  // ─────────────────────────────────────────────
  // PLACEHOLDER
  // ─────────────────────────────────────────────

  Widget _buildPlaceholder(String title) {
    return Center(
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w700,
          color: Color(0xFF111827),
        ),
      ),
    );
  }

  static Widget _circleButton({
    required IconData icon,
  }) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFE5E7EB),
        ),
      ),
      child: Icon(
        icon,
        color: const Color(0xFF374151),
        size: 21,
      ),
    );
  }
}