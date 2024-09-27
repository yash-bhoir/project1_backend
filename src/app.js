import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRoute from './routes/user.router.js';
import emailRoute from './routes/email.router.js';
import UserInfo from './routes/userInfo.router.js';
import bloodrequest from "./routes/request.router.js";
import acceptRequest from "./routes/admin.router.js";
import test from "./routes/test.router.js";
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.options('*', cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

app.use('/api/v1/users', userRoute);
app.use('/api/v1/email', emailRoute);
app.use('/api/v1/UserInfo', UserInfo);
app.use('/api/v1/bloodrequest', bloodrequest);
app.use('/api/v1/acceptRequest', acceptRequest);
app.use('/api/v1/test', test);

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
    });
});

export default app;
