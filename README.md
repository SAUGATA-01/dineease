# DineEase - Restaurant Table Reservation System

A full-stack web app where customers can book tables at restaurants, owners can manage their bookings and menus, and admins can control the entire platform.

**Live:** https://dineease-pink.vercel.app

## Tech Stack
- Next.js (App Router) + React + Tailwind CSS
- Next.js API Routes (Backend)
- PostgreSQL (Neon) + Prisma ORM
- bcrypt (Password Hashing), JWT in httpOnly Cookie (Session)
- Zod (Input Validation)
- Cloudinary (Photo Upload)
- Vercel (Hosting)

## Features

### Customer
- Sign up and log in using phone number, password, and OTP
- Select a city and browse restaurants, with search by name or cuisine
- View restaurant details, including menu, photos, timings, reviews, and ratings
- Book a table by selecting a date, number of guests, and time slot
- View live availability of tables for each time slot
- View and cancel bookings, and write reviews after booking

### Restaurant Owner
- Register a restaurant (goes live after admin approval)
- Manage date-wise bookings, including customer details, number of guests, assigned table, and phone number
- Mark bookings as Arrived, No-show, or Cancelled
- Add, edit, and delete menu items, and mark items as unavailable
- Manage tables and time slots
- Set holidays and restaurant closure dates
- Upload photos and edit restaurant details

### Admin
- Overview analytics with users, bookings, a 7-day graph, and top restaurants
- Approve, reject, block, or unblock restaurants
- Search, block, and unblock users
- View and filter all bookings
- Hide or delete reviews for moderation
- Manage support tickets submitted through the contact form, including notes and closure
- Add, rename, and delete cities

## Security
- Passwords are hashed using bcrypt
- Account locked for 15 minutes after 5 incorrect password attempts
- OTP expires after 5 minutes, with a limit of 3 attempts and restricted resends
- Role-based access control at the page level and database checks in every API
- Double bookings prevented using a database unique constraint
- Input validation using Zod and security headers

## Run Locally
```bash
npm install
# Create a .env file with DATABASE_URL, DIRECT_URL, JWT_SECRET, OTP_MODE, and CLOUDINARY_*
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Known Limitations
- OTP is sent to the user's email address via Gmail SMTP. Phone numbers are not verified; only email addresses are verified.
- Online payments are not supported
- The first request may be slightly slow on free hosting
