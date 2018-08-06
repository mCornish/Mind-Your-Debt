import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const userModel = new Schema({
  id: { type: String }
});

export default mongoose.model('users', userModel);