import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const accountModel = new Schema({
  averagePayments: {
    type: Map,
    of: { type: Number, min: 0 },
    required: 'You must include average payments'
  },
  balance: {
    type: Number,
    min: 0,
    required: 'You must include a balance'
  },
  balanceHistory: {
    type: Map,
    of: { type: Number },
    required: 'You must include balance history'
  },
  interestRate: {
    type: Number,
    min: 0,
    max: 1,
    required: 'You must include an interest rate'
  },
  isActive: {
    type: Boolean,
    required: 'You must specify whether the account is active'
  },
  name: {
    type: String,
    trim: true,
    required: 'You must include a name'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: 'You must include an owner'
  },
  principal: {
    type: Number,
    required: 'You must include a principal balance',
    min: 0
  },
  ynabId: { type: String, lowercase: true, trim: true },
}, { timestamps: true });

export default mongoose.model('Account', accountModel);