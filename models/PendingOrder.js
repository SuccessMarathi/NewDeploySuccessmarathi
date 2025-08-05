// models/PendingOrder.js
import mongoose from "mongoose";

const pendingOrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: String,
  email: String,
  contact: String,
  referrerName: String,
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  courseName: String,
  transactionId: { type: String, required: true },
  status: { type: String, default: "pending" }, // "pending", "accepted", "rejected"
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("PendingOrder", pendingOrderSchema);
