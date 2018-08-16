import User from '../models/userModel';
import axios from 'axios';
import '../models/accountModel';
import { YNAB_BASE } from '../config';

export async function addAccount(req, res, next) {
  if (!req.body.accountId) next(new Error('Must include an account ID to add.'));
  const user = await User.findById(req.params.id);
  if (user.accounts.some((id) => id.equals(req.body.accountId))) return res.json(user);

  const accounts = user.accounts.concat(req.body.accountId);
  user.set({ accounts });
  const updatedUser = await user.save();
  res.json(updatedUser);
}

export async function createUser(req, res) {
  const user = await (new User(req.body)).save();
  res.json(user);
}

export async function getUser(req, res) {
  const user = await User.findOne({ _id: req.params.id }).populate('accounts');
  res.json(user);
}

export async function getYnabUser(req, res) {
    const ynabUserRes = await axios(`${YNAB_BASE}/user?access_token=${req.params.token}`);
    const ynabId = ynabUserRes.data.data.user.id;
    const user = await User.findOne({ ynabId }).populate('accounts');
    if (user) return res.json(user);

    const newUser = await (new User({ ynabId })).save();
    res.json(newUser);
}