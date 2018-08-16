import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const userModel = new Schema({
  ynabId: { type: String },
  accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' }],
});

export default mongoose.model('User', userModel);