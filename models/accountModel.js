import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const accountModel = new Schema({
  name: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  interestRate: { type: Number },
  principal: { type: Number },
  ynabId: { type: String }
});

export default mongoose.model('Account', accountModel);