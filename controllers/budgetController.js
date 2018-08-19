import Budget from '../models/budgetModel';
import { difference } from 'lodash';

export async function addAccounts(req, res, next) {
  if (!req.body.ids) next(new Error('Must include Account IDs to add.'));
  const budget = await Budget.findById(req.params.id);
  const newIds = difference(req.body.ids, budget.accounts);
  if (!newIds.length) return res.json(budget);

  const accounts = budget.accounts.concat(newIds);
  budget.set({ accounts });
  const updatedBudget = await budget.save();
  res.json(updatedBudget);
}

export async function createBudget(req, res) {
  const existingBudget = await Budget.findOne({ ynabId: req.body.ynabId || req.body.id });
  if (existingBudget) return res.json(existingBudget);
  const budget = await (new Budget(req.body)).save();
  res.json(budget);
}

export async function getBudget(req, res) {
  const budget = await Budget.findOne({ _id: req.params.id }).populate('accounts');
  res.json(budget);
}

export async function updateBudget(req, res) {
  const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).exec();
  res.json(budget);
}