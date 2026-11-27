import mongoose from 'mongoose';
import { env } from './env.js';

let listenersRegistered = false;
let connectionPromise: Promise<typeof mongoose> | null = null;

/** Connect to MongoDB using the validated MONGO_URI connection string (cached for serverless reuse). */
export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

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

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      })
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }

  return connectionPromise;
}

/** Close the active MongoDB connection cleanly during shutdown. */
export async function disconnectDB(): Promise<void> {
  connectionPromise = null;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}
