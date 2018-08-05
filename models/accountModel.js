import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const accountModel = new Schema({
  name: { type: String }
});

export default mongoose.model('accounts', accountModel);