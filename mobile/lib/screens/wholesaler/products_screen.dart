import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  final TextEditingController searchController =
      TextEditingController();

  XFile? selectedImage;

  String search = '';

  final List<Map<String, dynamic>> products = [
    {
      'name': 'Tata Salt',
      'category': 'Grocery',
      'price': 28.0,
      'costPrice': 22.0,
      'stock': 120,
      'unit': 'piece',
      'lowStockAt': 10,
    },
    {
      'name': 'Aashirvaad Atta',
      'category': 'Grocery',
      'price': 245.0,
      'costPrice': 210.0,
      'stock': 45,
      'unit': 'bag',
      'lowStockAt': 10,
    },
    {
      'name': 'Parle-G Biscuits',
      'category': 'Biscuits',
      'price': 10.0,
      'costPrice': 8.0,
      'stock': 250,
      'unit': 'pack',
      'lowStockAt': 20,
    },
    {
      'name': 'Surf Excel',
      'category': 'Household',
      'price': 185.0,
      'costPrice': 160.0,
      'stock': 18,
      'unit': 'pack',
      'lowStockAt': 10,
    },
    {
      'name': 'Coca Cola',
      'category': 'Beverages',
      'price': 40.0,
      'costPrice': 32.0,
      'stock': 8,
      'unit': 'piece',
      'lowStockAt': 10,
    },
  ];

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filteredProducts = products.where((product) {
      return product['name']
          .toString()
          .toLowerCase()
          .contains(search.toLowerCase());
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),

      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Products',
          style: TextStyle(
            color: Color(0xFF111827),
            fontSize: 22,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(
              Icons.filter_list_rounded,
              color: Color(0xFF374151),
            ),
          ),
        ],
      ),

      body: Column(
        children: [
          // Search
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(
              20,
              4,
              20,
              18,
            ),
            child: TextField(
              controller: searchController,
              onChanged: (value) {
                setState(() {
                  search = value;
                });
              },
              decoration: InputDecoration(
                hintText: 'Search products...',
                prefixIcon: const Icon(
                  Icons.search,
                  color: Color(0xFF6B7280),
                ),
                filled: true,
                fillColor: const Color(0xFFF5F6FA),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(13),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // Count
          Padding(
            padding: const EdgeInsets.fromLTRB(
              20,
              18,
              20,
              10,
            ),
            child: Row(
              children: [
                Text(
                  '${filteredProducts.length} Products',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF374151),
                  ),
                ),
              ],
            ),
          ),

          // Products
          Expanded(
            child: filteredProducts.isEmpty
                ? const Center(
                    child: Text(
                      'No products found',
                      style: TextStyle(
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(
                      20,
                      0,
                      20,
                      100,
                    ),
                    itemCount: filteredProducts.length,
                    itemBuilder: (context, index) {
                      return _productCard(
                        filteredProducts[index],
                      );
                    },
                  ),
          ),
        ],
      ),

      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddProduct,
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text(
          'Add Product',
          style: TextStyle(
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  // =========================================================
  // PRODUCT CARD
  // =========================================================

  Widget _productCard(Map<String, dynamic> product) {
    final int stock = product['stock'];

    final bool lowStock = stock <= product['lowStockAt'];
    final bool outOfStock = stock == 0;

    Color stockColor;
    Color stockBackground;

    if (outOfStock) {
      stockColor = const Color(0xFFDC2626);
      stockBackground = const Color(0xFFFEF2F2);
    } else if (lowStock) {
      stockColor = const Color(0xFFD97706);
      stockBackground = const Color(0xFFFFFBEB);
    } else {
      stockColor = const Color(0xFF16A34A);
      stockBackground = const Color(0xFFF0FDF4);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: const Color(0xFFEFF4FF),
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Icon(
              Icons.inventory_2_outlined,
              color: Color(0xFF2563EB),
              size: 25,
            ),
          ),

          const SizedBox(width: 13),

          Expanded(
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                Text(
                  product['name'],
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF111827),
                  ),
                ),

                const SizedBox(height: 5),

                Text(
                  product['category'],
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),

                const SizedBox(height: 6),

                Text(
                  '₹${product['price']} / ${product['unit']}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF374151),
                  ),
                ),
              ],
            ),
          ),

          Column(
            crossAxisAlignment:
                CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 9,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: stockBackground,
                  borderRadius:
                      BorderRadius.circular(20),
                ),
                child: Text(
                  '$stock left',
                  style: TextStyle(
                    color: stockColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),

              const SizedBox(height: 6),

              PopupMenuButton<String>(
                padding: EdgeInsets.zero,
                icon: const Icon(
                  Icons.more_vert,
                  size: 20,
                  color: Color(0xFF6B7280),
                ),
                onSelected: (value) {
                  if (value == 'edit') {
                    _editProduct(product);
                  }

                  if (value == 'stock') {
                    _adjustStock(product);
                  }

                  if (value == 'delete') {
                    _deleteProduct(product);
                  }
                },
                itemBuilder: (context) => const [
                  PopupMenuItem(
                    value: 'edit',
                    child: Text('Edit Product'),
                  ),
                  PopupMenuItem(
                    value: 'stock',
                    child: Text('Adjust Stock'),
                  ),
                  PopupMenuItem(
                    value: 'delete',
                    child: Text('Delete Product'),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // =========================================================
  // ADD PRODUCT
  // =========================================================

  Future<void> _showAddProduct() async {
  selectedImage = null;

  final nameController = TextEditingController();
  final categoryController = TextEditingController();
  final priceController = TextEditingController();
  final costPriceController = TextEditingController();
  final stockController = TextEditingController();
  final lowStockController =
      TextEditingController(text: '10');

  String selectedUnit = 'piece';

  await showDialog(
    context: context,
    builder: (dialogContext) {
      return StatefulBuilder(
        builder: (context, setDialogState) {
          return Dialog(
            backgroundColor: Colors.white,
            insetPadding: const EdgeInsets.symmetric(
              horizontal: 18,
              vertical: 24,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Add Product',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF111827),
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () {
                          Navigator.of(dialogContext).pop();
                        },
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),

                  const SizedBox(height: 18),

                  // Image
                  _fieldLabel('Product Image'),

                  GestureDetector(
                    onTap: () async {
                      final picker = ImagePicker();

                      final image =
                          await picker.pickImage(
                        source: ImageSource.gallery,
                        imageQuality: 80,
                      );

                      if (image != null &&
                          mounted) {
                        setDialogState(() {
                          selectedImage = image;
                        });
                      }
                    },
                    child: Container(
                      width: double.infinity,
                      height: 130,
                      decoration: BoxDecoration(
                        color:
                            const Color(0xFFF9FAFB),
                        borderRadius:
                            BorderRadius.circular(12),
                        border: Border.all(
                          color:
                              const Color(0xFFE5E7EB),
                        ),
                      ),
                      child: selectedImage == null
                          ? const Column(
                              mainAxisAlignment:
                                  MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons
                                      .cloud_upload_outlined,
                                  size: 32,
                                  color:
                                      Color(0xFF6B7280),
                                ),
                                SizedBox(height: 8),
                                Text(
                                  'Tap to select product image',
                                  style: TextStyle(
                                    color:
                                        Color(0xFF6B7280),
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            )
                          : ClipRRect(
                              borderRadius:
                                  BorderRadius.circular(
                                      12),
                              child: Image.file(
                                File(
                                  selectedImage!.path,
                                ),
                                width: double.infinity,
                                height: 130,
                                fit: BoxFit.cover,
                              ),
                            ),
                    ),
                  ),

                  const SizedBox(height: 18),

                  // Product name
                  _fieldLabel('Product Name'),

                  _productInput(
                    controller: nameController,
                    hint: 'e.g. Surf Excel 1kg',
                  ),

                  const SizedBox(height: 16),

                  // Category
                  _fieldLabel('Category'),

                  _productInput(
                    controller: categoryController,
                    hint: 'e.g. FMCG',
                  ),

                  const SizedBox(height: 16),

                  // Unit
                  _fieldLabel('Unit'),

                  DropdownButtonFormField<String>(
                    initialValue: selectedUnit,
                    decoration: _inputDecoration(),
                    items: const [
                      'piece',
                      'kg',
                      'litre',
                      'bag',
                      'box',
                      'dozen',
                      'pack',
                    ].map((unit) {
                      return DropdownMenuItem(
                        value: unit,
                        child: Text(unit),
                      );
                    }).toList(),
                    onChanged: (value) {
                      if (value != null) {
                        setDialogState(() {
                          selectedUnit = value;
                        });
                      }
                    },
                  ),

                  const SizedBox(height: 16),

                  // Selling price
                  _fieldLabel('Selling Price (₹)'),

                  _productInput(
                    controller: priceController,
                    hint: '0',
                    keyboardType:
                        TextInputType.number,
                  ),

                  const SizedBox(height: 16),

                  // Cost price
                  _fieldLabel('Cost Price (₹)'),

                  _productInput(
                    controller: costPriceController,
                    hint: '0',
                    keyboardType:
                        TextInputType.number,
                  ),

                  const SizedBox(height: 16),

                  // Stock
                  _fieldLabel('Opening Stock'),

                  _productInput(
                    controller: stockController,
                    hint: '0',
                    keyboardType:
                        TextInputType.number,
                  ),

                  const SizedBox(height: 16),

                  // Low stock
                  _fieldLabel(
                    'Low Stock Alert At',
                  ),

                  _productInput(
                    controller: lowStockController,
                    hint: '10',
                    keyboardType:
                        TextInputType.number,
                  ),

                  const SizedBox(height: 24),

                  // Buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.of(
                              dialogContext,
                            ).pop();
                          },
                          style:
                              OutlinedButton.styleFrom(
                            minimumSize:
                                const Size.fromHeight(
                                    50),
                            shape:
                                RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(
                                      12),
                            ),
                          ),
                          child:
                              const Text('Cancel'),
                        ),
                      ),

                      const SizedBox(width: 12),

                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            final name =
                                nameController.text
                                    .trim();

                            if (name.isEmpty) {
                              ScaffoldMessenger.of(
                                this.context,
                              ).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Product name is required',
                                  ),
                                ),
                              );
                              return;
                            }

                            final product = {
                              'name': name,
                              'category':
                                  categoryController
                                      .text
                                      .trim(),
                              'price':
                                  double.tryParse(
                                        priceController
                                            .text,
                                      ) ??
                                      0,
                              'costPrice':
                                  double.tryParse(
                                        costPriceController
                                            .text,
                                      ) ??
                                      0,
                              'stock':
                                  int.tryParse(
                                        stockController
                                            .text,
                                      ) ??
                                      0,
                              'unit': selectedUnit,
                              'lowStockAt':
                                  int.tryParse(
                                        lowStockController
                                            .text,
                                      ) ??
                                      10,
                            };

                            setState(() {
                              products.insert(
                                0,
                                product,
                              );
                            });

                            Navigator.of(
                              dialogContext,
                            ).pop();
                          },
                          style:
                              ElevatedButton.styleFrom(
                            minimumSize:
                                const Size.fromHeight(
                                    50),
                            backgroundColor:
                                const Color(0xFF2563EB),
                            foregroundColor:
                                Colors.white,
                            elevation: 0,
                            shape:
                                RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(
                                      12),
                            ),
                          ),
                          child: const Text(
                            'Add Product',
                            style: TextStyle(
                              fontWeight:
                                  FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      );
    },
  );

  nameController.dispose();
  categoryController.dispose();
  priceController.dispose();
  costPriceController.dispose();
  stockController.dispose();
  lowStockController.dispose();
}

  // =========================================================
  // FORM HELPERS
  // =========================================================

  Widget _fieldLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 7),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: Color(0xFF374151),
        ),
      ),
    );
  }

  Widget _productInput({
    required TextEditingController controller,
    required String hint,
    TextInputType? keyboardType,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: _inputDecoration().copyWith(
        hintText: hint,
      ),
    );
  }

  InputDecoration _inputDecoration() {
    return InputDecoration(
      filled: true,
      fillColor: const Color(0xFFF9FAFB),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 14,
        vertical: 14,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(11),
        borderSide: const BorderSide(
          color: Color(0xFFE5E7EB),
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(11),
        borderSide: const BorderSide(
          color: Color(0xFFE5E7EB),
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(11),
        borderSide: const BorderSide(
          color: Color(0xFF2563EB),
          width: 1.5,
        ),
      ),
    );
  }

  Widget _buildImagePicker(
    StateSetter setModalState,
  ) {
    return GestureDetector(
      onTap: () async {
        final picker = ImagePicker();

        final image = await picker.pickImage(
          source: ImageSource.gallery,
          imageQuality: 80,
        );

        if (image != null) {
          setModalState(() {
            selectedImage = image;
          });
        }
      },
      child: Container(
        width: double.infinity,
        height: 130,
        decoration: BoxDecoration(
          color: const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: const Color(0xFFE5E7EB),
          ),
        ),
        child: selectedImage == null
            ? const Column(
                mainAxisAlignment:
                    MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.cloud_upload_outlined,
                    size: 32,
                    color: Color(0xFF6B7280),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Tap to select product image',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 13,
                    ),
                  ),
                ],
              )
            : ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.file(
                  File(selectedImage!.path),
                  width: double.infinity,
                  height: 130,
                  fit: BoxFit.cover,
                ),
              ),
      ),
    );
  }

  // =========================================================
  // EDIT / STOCK / DELETE
  // =========================================================

  void _editProduct(
    Map<String, dynamic> product,
  ) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Edit ${product['name']} will be added next.',
        ),
      ),
    );
  }

  void _adjustStock(
    Map<String, dynamic> product,
  ) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Stock adjustment for ${product['name']} will be added next.',
        ),
      ),
    );
  }

  void _deleteProduct(
    Map<String, dynamic> product,
  ) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Delete Product?'),
          content: Text(
            'Are you sure you want to delete ${product['name']}?',
          ),
          actions: [
            TextButton(
              onPressed: () =>
                  Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                setState(() {
                  products.remove(product);
                });

                Navigator.pop(dialogContext);
              },
              child: const Text(
                'Delete',
                style: TextStyle(
                  color: Color(0xFFDC2626),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}