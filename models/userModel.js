import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const userModel = new Schema({
  ynabId: { type: String },
  // accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' }],
  budgets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Budget' }],
  activeBudget: { type: mongoose.Schema.Types.ObjectId }
});

export default mongoose.model('User', userModel);