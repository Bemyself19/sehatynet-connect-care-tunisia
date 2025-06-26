# SehatyNet+ Telehealth Platform

A comprehensive telehealth platform built with React, TypeScript, and Node.js, featuring user authentication, appointment scheduling, medical records management, and tele-expertise capabilities.

## 🚀 Quick Start (Windows)

### Option 1: One-Command Setup (Recommended)
```bash
# Run the automated setup script
start.bat
```

This will:
- Install all dependencies (frontend + backend)
- Build the backend
- Start both servers concurrently

### Option 2: Manual Setup
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Build backend
cd backend
npm run build
cd ..

# Start both servers
npm run start
```

## 🛠️ Development

### Available Scripts

**Frontend (Root directory):**
- `npm run dev` - Start frontend development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Backend (backend/ directory):**
- `npm run dev` - Start backend with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

**Concurrent (Root directory):**
- `npm run start` - Start both frontend and backend servers
- `npm run backend` - Start only backend server

## 🌐 Access Points

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 📋 Prerequisites

- Node.js 16+ 
- npm 8+
- MongoDB (local or cloud)

## ⚙️ Environment Setup

1. Copy the example environment file:
   ```bash
   cd backend
   copy env.example .env
   ```

2. Update `backend/.env` with your MongoDB connection string:
   ```
   MONGODB_URI=mongodb://localhost:27017/sehaty
   JWT_SECRET=your-secret-key
   PORT=5000
   ```

## 🏗️ Project Structure

```
sehatynet-connect-care-tunisia/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and API client
│   ├── backend/            # Node.js/Express API
│   │   ├── src/
│   │   │   ├── controllers/ # Request handlers
│   │   │   ├── models/      # MongoDB schemas
│   │   │   ├── routes/      # API routes
│   │   │   └── middleware/  # Authentication & validation
│   │   └── uploads/         # File uploads
│   └── public/             # Static assets
└── public/                # Static assets
```

## 🔐 Authentication & Roles

The platform supports multiple user roles:
- **Patient** - Book appointments, view medical records
- **Doctor** - Manage appointments, create prescriptions
- **Admin** - User management, system administration
- **Lab** - Lab results management
- **Pharmacy** - Prescription management
- **Provider** - Service provider management
- **Radiologist** - Imaging results management

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Medical Records
- `GET /api/medical-records` - List medical records
- `POST /api/medical-records` - Create medical record
- `GET /api/medical-records/:id` - Get specific record

### Prescriptions
- `GET /api/prescriptions` - List prescriptions
- `POST /api/prescriptions` - Create prescription
- `PUT /api/prescriptions/:id` - Update prescription

## 🛡️ Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Helmet security headers

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend linting
npm run lint
```

## 🚀 Deployment

### Frontend
```bash
npm run build
```

### Backend
```bash
cd backend
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions, please contact the development team.
