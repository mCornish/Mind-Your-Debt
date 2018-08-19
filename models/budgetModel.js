import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const budgetModel = new Schema({
  name: { type: String },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accounts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  }],
  ynabId: { type: String }
});

export default mongoose.model('Budget', budgetModel);