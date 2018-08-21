import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const accountModel = new Schema({
  name: { type: String },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: 'You must include an owner'
  },
  interestRate: { type: Number },
  principal: { type: Number },
  ynabId: { type: String },
  created: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Account', accountModel);