import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
}, { timestamps: true });

// Ensure the model is always registered
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
