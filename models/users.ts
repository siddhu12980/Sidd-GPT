import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);
