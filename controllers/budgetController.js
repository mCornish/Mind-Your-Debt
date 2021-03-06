import Budget from '../models/budgetModel';
import { difference, intersection, uniq } from 'lodash';

export async function addAccounts(req, res, next) {
  if (!req.body.ids) next(new Error('Must include Account IDs to add.'));
  const budget = await Budget.findById(req.params.id);
  const newIds = difference(req.body.ids, budget.accounts);
  if (!newIds.length) return res.json(budget);

  const accounts = uniq(budget.accounts.concat(newIds).map(String));
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

export async function removeAccounts(req, res, next) {
  if (!req.body.ids) next(new Error('Must include Account IDs to remove.'));
  const budget = await Budget.findById(req.params.id);
  const validIds = intersection(req.body.ids.map(String), budget.accounts.map(String));
  if (!validIds.length) return res.json(budget);

  const accounts = uniq(difference(budget.accounts.map(String), validIds.map(String)));
  budget.set({ accounts });
  const updatedBudget = await budget.save();
  res.json(updatedBudget);
}

export async function updateBudget(req, res) {
  const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).exec();
  res.json(budget);
}

export async function updateAccounts(req, res) {
  const accountIds = req.body.ids;
  if (!accountIds) next(new Error('Must include Account IDs to add.'));
  const budget = await Budget.findById(req.params.id);
  if (!accountIds.length) return res.json(budget);

  budget.set({ accounts: accountIds });
  const updatedBudget = await budget.save();
  res.json(updatedBudget);
}