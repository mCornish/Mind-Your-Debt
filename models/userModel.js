import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const userModel = new Schema({
  activeBudget: { type: mongoose.Schema.Types.ObjectId },
  budgets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Budget' }],
  ynabId: { type: String, lowercase: true, trim: true }
}, { timestamps: true });

export default mongoose.model('User', userModel);