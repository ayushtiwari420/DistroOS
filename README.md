# DistroOS — B2B Distribution Management SaaS

A full-stack MERN application for managing wholesale distribution networks.

## Roles
- **Admin** — approves wholesalers, views platform stats
- **Wholesaler** — manages products, orders, retailers, salesmen, credit
- **Salesman** — places orders on behalf of retailers
- **Retailer** — browses catalog, places orders, tracks deliveries

## Tech Stack
- **Frontend:** React, Vite, React Router
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas, Mongoose
- **Auth:** JWT (access token in memory + refresh token in httpOnly cookie)

## Features
- Role-based authentication and protected routes
- Full order lifecycle (pending → approved → dispatched → delivered)
- Credit management system with per-retailer limits
- Real-time inventory with low stock alerts
- Retailer linking system (search by email)
