import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
