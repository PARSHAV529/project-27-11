import mongoose from 'mongoose';
import { env } from './env.js';

let listenersRegistered = false;

/** Connect to MongoDB using the validated MONGODB_URI connection string. */
export async function connectDB(): Promise<typeof mongoose> {
  if (!listenersRegistered) {
    mongoose.connection.on('connected', () => {
      console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    listenersRegistered = true;
  }

  return mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
}

/** Close the active MongoDB connection cleanly during shutdown. */
export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}
