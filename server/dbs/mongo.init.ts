import mongoose from "mongoose";
require("dotenv").config();

const dbURL: string = process.env.MONGO_URI || "";

const connectDB = async () => {
  try {
    await mongoose.connect(dbURL);

    console.log(`MongoDB connected`);
  } catch (error : any) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Thử kết nối lại sau một khoảng thời gian
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
