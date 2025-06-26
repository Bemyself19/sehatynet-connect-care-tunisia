# SehatyNet+ Backend API

A comprehensive backend API for the SehatyNet+ telehealth platform, built with Node.js, Express, TypeScript, and MongoDB.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with role-based access control
- 👥 **User Management**: Patient, provider, and admin user management
- 📅 **Appointment Scheduling**: Complete appointment booking and management system
- 📋 **Medical Records**: Electronic Health Records (EHR) storage and retrieval
- 💊 **Prescription Management**: Digital prescriptions with QR code verification
- 🏥 **Provider Management**: Doctor, pharmacy, lab, and radiologist management
- 🔒 **Security**: Input validation, rate limiting, and secure authentication flows

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, helmet, express-rate-limit
- **Validation**: express-validator

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sehatynet-connect-care-tunisia/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/sehatynet
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ADMIN_CODE=ADMIN2024
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start MongoDB**
   ```bash
   # Start MongoDB service
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/stats` - Get dashboard stats (admin only)
- `GET /api/users/providers` - Get all providers
- `GET /api/users/patients` - Get all patients
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/status` - Update user status (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - Get user appointments
- `GET /api/appointments/slots` - Get available time slots
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Medical Records
- `POST /api/medical-records` - Create medical record
- `GET /api/medical-records` - Get user medical records
- `GET /api/medical-records/patient/:patientId` - Get patient medical history
- `GET /api/medical-records/:id` - Get medical record by ID
- `PUT /api/medical-records/:id` - Update medical record
- `DELETE /api/medical-records/:id` - Delete medical record

### Prescriptions
- `POST /api/prescriptions` - Create prescription
- `GET /api/prescriptions` - Get user prescriptions
- `GET /api/prescriptions/providers` - Get available providers
- `GET /api/prescriptions/verify/:qrCode` - Verify prescription QR code
- `GET /api/prescriptions/:id` - Get prescription by ID
- `PUT /api/prescriptions/:id/fulfill` - Fulfill prescription

## User Roles

- **patient**: Can book appointments, view medical records, manage profile
- **doctor**: Can manage appointments, create medical records, write prescriptions
- **pharmacy**: Can fulfill medication prescriptions
- **lab**: Can fulfill lab test prescriptions
- **radiologist**: Can fulfill radiology prescriptions
- **admin**: Full system access and user management

## Data Models

### User Model
```typescript
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor' | 'pharmacy' | 'lab' | 'radiologist' | 'admin';
  phone?: string;
  dateOfBirth?: string;
  profileImage?: string;
  isVerified: boolean;
  cnamId?: string;
  
  // Patient-specific fields
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  currentMedications?: string[];
  
  // Provider-specific fields
  licenseNumber?: string;
  specialization?: string;
  address?: string;
  workingHours?: Map<string, { start: string; end: string }>;
  rating?: number;
  reviewCount?: number;
  consultationFee?: number;
  isActive: boolean;
}
```

### Appointment Model
```typescript
{
  patientId: ObjectId;
  providerId: ObjectId;
  type: 'consultation' | 'follow-up' | 'emergency' | 'lab-test' | 'imaging';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  consultationFee?: number;
  notes?: string;
  symptoms?: string;
  diagnosis?: string;
  prescription?: string;
  appointmentType: 'in-person' | 'video';
  reason?: string;
}
```

### Medical Record Model
```typescript
{
  patientId: ObjectId;
  providerId: ObjectId;
  title: string;
  type: 'lab_result' | 'consultation' | 'imaging' | 'prescription' | 'vaccination' | 'surgery';
  date: string;
  details: any;
  fileUrl?: string;
  isPrivate: boolean;
  tags?: string[];
}
```

### Prescription Model
```typescript
{
  patientId: ObjectId;
  doctorId: ObjectId;
  type: 'medication' | 'lab_test' | 'radiology';
  details: string;
  qrCode: string;
  isFulfilled: boolean;
  fulfilledBy?: ObjectId;
  fulfilledAt?: Date;
  notes?: string;
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for different user roles
- **Input Validation**: Request data validation using express-validator
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Configuration**: Secure cross-origin resource sharing
- **Password Hashing**: bcryptjs for secure password storage
- **Helmet**: Security headers for Express applications

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Project Structure
```
src/
├── controllers/     # Request handlers
├── middleware/      # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── utils/          # Utility functions
└── index.ts        # Application entry point
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGO_URI` | MongoDB connection string | mongodb://localhost:27017/sehatynet |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 1d |
| `ADMIN_CODE` | Admin login code | ADMIN2024 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |

## API Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## Testing the API

### Health Check
```bash
curl http://localhost:5000/health
```

### Register a Patient
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient",
    "phone": "+21612345678"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password123"
  }'
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please contact the development team.
