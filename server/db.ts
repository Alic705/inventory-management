import mongoose from "mongoose";
import dns from "node:dns";

// Fix for Node.js querySrv ECONNREFUSED on local DNS servers (especially on Windows/local router DNS)
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (err) {
  // Ignore if custom DNS server configuration is not supported in the current environment
}

// DATABASE_URL ab MongoDB ki honi chahiye (e.g., mongodb://...)
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL (MongoDB) must be set in your environment variables.",
  );
}

export const connectDB = async () => {
  try {
    const url = process.env.DATABASE_URL;

    // Check agar URL nahi hai (extra safety)
    if (!url) {
      throw new Error("DATABASE_URL is missing!");
    }

    await mongoose.connect(url);
    console.log("✅ MongoDB Connected Successfully!");
  } catch (error: any) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

// Exporting mongoose instance agar zaroorat paray
export const db = mongoose.connection;