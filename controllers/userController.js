import User from '../models/userModel';
import Budget from '../models/budgetModel';
import axios from 'axios';
import { difference } from 'lodash';
import { YNAB_BASE } from '../config';


export async function addBudgets(req, res, next) {
  if (!req.body.ids) next(new Error('Must include Budget IDs to add.'));
  const user = await User.findById(req.params.id);
  const newIds = difference(req.body.ids, user.budgets);
  if (!newIds.length) return res.json(user);

  const budgets = user.budgets.concat(newIds);
  user.set({ budgets });
  const updatedUser = await user.save();
  res.json(updatedUser);
}

/**
 * Get User Budgets with the option of including YNAB Budget data if an auth token is included
 */
export async function getBudgets(req, res) {
  const user = await User.findById(req.params.id);
  const budgets = await Budget.find({ '_id': { $in: user.budgets }});
  res.json(budgets);
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
    const user = await User.findOne({ ynabId });
    if (user) return res.json(user);

    const newUser = await (new User({ ynabId })).save();
    res.json(newUser);
}

export async function updateUser(req, res) {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).exec();
  res.json(user);
}