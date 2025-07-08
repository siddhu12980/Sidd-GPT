import mongoose from "mongoose";

// Individual attachment schema
const AttachmentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "pdf", "file"],
      required: true,
    },
    url: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true }, // MIME type
    fileSize: { type: Number }, // Size in bytes
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
); // No separate _id for attachments

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    type: {
      type: String,
      enum: ["text", "image", "file", "mixed"], // Added "mixed" for multiple attachments
      default: "text",
      required: true,
    },
    content: { type: String, required: true },

    // Legacy single file fields (for backward compatibility)
    fileName: String,
    fileType: String,
    fileUrl: String,

    // New multiple attachments support
    attachments: [AttachmentSchema], // Array of attachments
    attachmentCount: {
      type: Number,
      default: 0,
      validate: {
        validator: function (v: number) {
          // Max 10 images + 1 PDF
          return v <= 11;
        },
        message: "Maximum 11 attachments allowed (10 images + 1 PDF)",
      },
    },

    // Metadata for attachment summary
    attachmentSummary: {
      imageCount: { type: Number, default: 0, max: 10 },
      pdfCount: { type: Number, default: 0, max: 1 },
      totalSize: { type: Number, default: 0 }, // Total size in bytes
    },

    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save middleware to auto-update attachment counts and summary
MessageSchema.pre("save", function (next) {
  if (this.attachments && this.attachments.length > 0) {
    let imageCount = 0;
    let pdfCount = 0;
    let totalSize = 0;

    this.attachments.forEach((attachment: any) => {
      if (attachment.type === "image") imageCount++;
      if (attachment.type === "pdf") pdfCount++;
      if (attachment.fileSize) totalSize += attachment.fileSize;
    });

    this.attachmentCount = this.attachments.length;
    this.attachmentSummary = {
      imageCount,
      pdfCount,
      totalSize,
    };

    // Auto-set message type based on attachments
    if (imageCount > 0 && pdfCount > 0) {
      this.type = "mixed";
    } else if (imageCount > 0) {
      this.type = "image";
    } else if (pdfCount > 0) {
      this.type = "file";
    }
  }

  // Handle legacy single file backward compatibility
  if (!this.attachments?.length && this.fileUrl) {
    this.attachmentCount = 1;
    if (this.type === "image") {
      this.attachmentSummary = { imageCount: 1, pdfCount: 0, totalSize: 0 };
    } else if (this.type === "file") {
      this.attachmentSummary = { imageCount: 0, pdfCount: 1, totalSize: 0 };
    }
  }

  next();
});

// Virtual for checking if message has multiple attachments
MessageSchema.virtual("hasMultipleAttachments").get(function () {
  return this.attachmentCount > 1;
});

// Virtual for getting primary attachment (for backward compatibility)
MessageSchema.virtual("primaryAttachment").get(function () {
  if (this.attachments?.length > 0) {
    return this.attachments[0];
  }
  // Fallback to legacy fields
  if (this.fileUrl) {
    return {
      type: this.type,
      url: this.fileUrl,
      fileName: this.fileName,
      fileType: this.fileType,
    };
  }
  return null;
});

delete mongoose.models.Message;
// Ensure the model is always registered
const Message =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);

export default Message;
