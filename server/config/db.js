import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cleancity';
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500, // Quick fallback if local mongod is not started
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[MongoDB] Warning: Could not connect to MongoDB at ${mongoURI}. Running with resilient in-memory data store for hackathon environment.`);
    return false;
  }
};
