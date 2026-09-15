# DistroOS - Product Transport Platform

A modern logistics platform connecting wholesalers and retailers for efficient product distribution and transport management. DistroOS streamlines the supply chain for better efficiency and transparency.

## 🚚 Features

- **Wholesaler Portal**: Manage inventory and list products for transport
- **Retailer Portal**: Browse available products and place transport requests
- **Real-time Tracking**: Track shipments in real-time
- **Order Management**: Complete order lifecycle management
- **Payment Integration**: Secure payment processing
- **Analytics Dashboard**: Performance metrics and insights
- **User Authentication**: Secure login and registration
- **Route Optimization**: Efficient delivery route planning
- **Ratings & Reviews**: Quality feedback system

## 🛠️ Tech Stack

### Frontend
- **React**: Modern UI framework
- **JavaScript/ES6+**: Programming language
- **HTML5 & CSS3**: Markup and styling
- **Redux/Context API**: State management
- **Axios**: HTTP client

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database
- **REST API**: API architecture

## 📦 Installation

### Prerequisites
- Node.js and npm installed
- MongoDB installed and running
- Git installed

### Clone and Setup

```bash
# Clone the repository
git clone https://github.com/ayushtiwari420/DistroOS.git

# Navigate to the project directory
cd DistroOS

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## 🚀 Getting Started

### Start MongoDB
```bash
mongod
```

### Start Backend Server
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

### Start Frontend Application
```bash
cd frontend
npm start
# Application opens at http://localhost:3000
```

## 📋 Key Features Explained

### For Wholesalers
1. **Product Management**: Add and manage inventory
2. **List for Transport**: Create transport requests
3. **Order Tracking**: Monitor active orders
4. **Revenue Analytics**: View business metrics

### For Retailers
1. **Product Discovery**: Browse available products
2. **Order Placement**: Request product transport
3. **Real-time Updates**: Track shipment status
4. **Payment Management**: Handle transactions

## 🔗 API Endpoints

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status
- `GET /api/orders/:id/track` - Track order

### Users
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/users/profile` - Get user profile

## 💾 Database Schema

### Product Model
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category: String,
  price: Number,
  quantity: Number,
  wholesalerId: ObjectId,
  createdAt: Date
}
```

### Order Model
```javascript
{
  _id: ObjectId,
  productId: ObjectId,
  retailerId: ObjectId,
  quantity: Number,
  status: String,
  pickupLocation: String,
  deliveryLocation: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 User Interface

- **Dashboard**: Overview of platform activity
- **Product Listings**: Browse and filter products
- **Order Management**: Create and track orders
- **User Profile**: Manage account information
- **Analytics**: Business metrics and insights

## 🔐 Security Features

- JWT authentication
- Password encryption
- Input validation
- Secure API endpoints
- Role-based access control

## 📊 Tracking System

Real-time shipment tracking with:
- GPS location updates
- Delivery status notifications
- Estimated arrival times
- Driver contact information

## 🤝 Contributing

Contributions are welcome! Help us improve the platform:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Express.js and Node.js communities
- React documentation
- MongoDB for reliable database solutions

---

**Transforming logistics with technology! 🚚📦**