import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const budgetModel = new Schema({
  accounts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  }],
  created: {
    type: Date,
    default: Date.now
  },
  modified: {
    type: Date,
    default: Date.now
  },
  name: { type: String, trim: true },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: 'You must include an owner'
  },
  ynabId: { type: String, lowercase: true, trim: true },
}, { timestamps: true });

export default mongoose.model('Budget', budgetModel);