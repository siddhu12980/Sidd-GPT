import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
      required: true,
    }, // Add required: true
    content: { type: String, required: true },
    fileName: String,
    fileType: String,
    createdAt: { type: Date, default: Date.now },
    fileUrl: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

delete mongoose.models.Message;
// Ensure the model is always registered
const Message =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);

export default Message;
