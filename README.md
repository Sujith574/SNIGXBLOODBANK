# Snigx Blood Bank Management System (MERN)

## Tech Stack
- Frontend: React (Vite), Tailwind CSS, React Router, Axios, React Hook Form, Context API, Recharts, React Icons, Framer Motion, React Toastify
- Backend: Node.js, Express.js, MongoDB, Mongoose, JWT Authentication, Bcrypt, Multer (profile images), Nodemailer, dotenv

## Roles
- Admin
- Donor
- Hospital

## Setup
1. Create MongoDB database (name will be from `.env`)
2. Configure environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`

## Run
### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Project Structure
- `frontend/` - React app (Vite)
- `backend/` - Express API with MVC structure

## API Response Format
All endpoints return:
- `success` (boolean)
- `message` (string)
- `data` (object/array)
- `error` (optional)
- `statusCode`


