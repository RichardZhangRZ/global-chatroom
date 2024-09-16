import mongoose from "mongoose";

const connectToMongoDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const clientOptions = {
    serverApi: { version: "1" as const, strict: true, deprecationErrors: true },
  };

  try {
    await mongoose.connect(process.env.MONGODB_URI, clientOptions);
    console.log("MongoDB connected...");
  } catch (err) {
    console.error("Cannot connect to MongoDB", err);
    process.exit(1);
  }
};

export { connectToMongoDB };
