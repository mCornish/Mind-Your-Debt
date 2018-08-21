import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const budgetModel = new Schema({
  name: { type: String },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: 'You must include an owner'
  },
  accounts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  }],
  ynabId: { type: String },
  created: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Budget', budgetModel);