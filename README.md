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

# HTTPS & Reverse Proxy Strategy

## HTTPS Handling
SehatyNet backend no longer manages HTTPS/TLS directly. All HTTPS traffic should be terminated at a reverse proxy (e.g., Nginx, Caddy, or a cloud load balancer). The Express app listens on HTTP (e.g., port 3000 or 8000) and should not be exposed directly to the public internet.

## Environment Variables
- `HTTPS_ENABLED`: (boolean) If true, backend will attempt to use HTTPS (not recommended; use a proxy instead). Default: `false`.
- `SSL_CERT_PATH`, `SSL_KEY_PATH`: Paths to certificate and key files (used only if HTTPS_ENABLED is true).

These are provided for flexibility but are not recommended for production. Use a reverse proxy for TLS termination.

## Nginx Reverse Proxy Example
```
server {
    listen 443 ssl;
    server_name sehatynet.example.com;

    ssl_certificate /etc/letsencrypt/live/sehatynet.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sehatynet.example.com/privkey.pem;

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        proxy_pass http://localhost:5173/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name sehatynet.example.com;
    return 301 https://$host$request_uri;
}
```
- Replace `sehatynet.example.com` and certificate paths as needed.
- WebSocket support is enabled for `/api/`.
- Frontend (port 5173) and backend (port 3000) can coexist.

## .env File Tracking
If your `.env` file is not tracked or shows a disabled icon in your editor, ensure it is not listed in `.gitignore` if you want it versioned (not recommended for secrets in production). For local development, copy `env.example` to `.env` and adjust values as needed.

## Deployment Notes
- Deploy the backend behind a reverse proxy for HTTPS.
- Do not expose the Express HTTP port directly.
- Use the provided Nginx config as a template for secure deployment.
