# Deployment Guide

## 1. Prerequisites
- Node.js (v18+)
- MongoDB (running instance)
- Git

## 2. Directory Structure
- `/frontend`: React + Vite application
- `/backend`: Express + Mongoose API

## 3. Environment Setup
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
```

## 4. Local Development (Monorepo Mode)
From the root directory:
1. `npm run install:all` (Installs both frontend and backend dependencies)
2. `npm run dev` (Starts both servers concurrently)

## 5. Production Deployment
### Building the Frontend
```bash
cd frontend
npm run build
```
This will generate the `dist` folder inside `frontend/`.

### Running in Production
1. Serve the `frontend/dist` folder using a static file server (e.g., Nginx).
2. Run the Node.js backend using a process manager like **PM2**:
```bash
cd backend
pm2 start index.js --name "KairiX-api"
```

## 6. Docker Deployment (Recommended)
You can use the included `docker-compose.yml` to spin up the entire stack:
```bash
docker-compose up --build
```

## 7. CI/CD Pipeline
- Use **GitHub Actions** for automated testing and deployment.
- Deploy backend to **AWS/Render/Railway**.
- Deploy frontend to **Vercel/Netlify**.
