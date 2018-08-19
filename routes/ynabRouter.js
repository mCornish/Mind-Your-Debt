import express from 'express';
import axios from 'axios';
import { flatten, map } from 'lodash';
import { YNAB_BASE } from '../config';
import { catchErrors } from '../helpers';
import {
  getBudgets
} from '../controllers/ynabController';
const ynabRouter = express.Router();

// TODO: Move logic to controller and implement catchErrors()
ynabRouter.route('/budgets')
  .get(catchErrors(getBudgets));

ynabRouter.route('/budgets/:id')
  .get(async (req, res, next) => {
    try {
      const token = req.query.token;
      const budget = await fetchBudget(req.params.id, token);
      res.json(budget);
    } catch (err) {
      next(err);
    }
  });

ynabRouter.route('/budgets/:id/accounts')
  .get(async (req, res, next) => {
    try {
      const token = req.query.token;
      const accounts = await fetchAccounts(req.params.id, token);
      res.json(accounts);
    } catch (err) {
      next(err);
    }
  });


ynabRouter.route('/budgets/:id/accounts/:accountId/transactions')
  .get(async (req, res, next) => {
    try {
      const token = req.query.token;
      const transactions = await fetchTransactions(req.params.id, req.params.accountId, token);
      res.json(transactions);
    } catch (err) {
      next(err);
    }
  });

ynabRouter.route('/budgets/:id/categories')
  .get(async (req, res, next) => {
    try {
      const token = req.query.token;
      const groups = await fetchCategories(req.params.id, token);
      const categories = flatten(map(groups, 'categories'));
      res.json(categories);
    } catch (err) {
      next(err);
    }
  });

ynabRouter.route('/budgets/:id/months/:month')
  .get(async (req, res, next) => {
    try {
      const token = req.query.token;
      const month = await fetchMonth(req.params.id, req.params.month, token);
      res.json(month);
    } catch (err) {
      next(err);
    }
  });

async function fetchAccounts(budgetId, token) {
  return await axios(`${YNAB_BASE}/budgets/${budgetId}/accounts?access_token=${token}`)
    .then((res) => res.data.data.accounts)
    .catch((err) => { throw err });
}

async function fetchBudget(budgetId, token) {
  return await axios(`${YNAB_BASE}/budgets/${budgetId}?access_token=${token}`)
    .then((res) => res.data.data.budget)
    .catch((err) => { throw err });
}

async function fetchCategories(budgetId, token) {
  return await axios(`${YNAB_BASE}/budgets/${budgetId}/categories?access_token=${token}`)
    .then((res) => res.data.data.category_groups)
    .catch((err) => { throw err });
}

async function fetchMonth(budgetId, month, token) {
  return await axios(`${YNAB_BASE}/budgets/${budgetId}/months/${month}?access_token=${token}`)
    .then((res) => res.data.data.month)
    .catch((err) => { throw err });
}

async function fetchTransactions(budgetId, accountId, token) {
  return await axios(`${YNAB_BASE}/budgets/${budgetId}/accounts/${accountId}/transactions?access_token=${token}`)
    .then((res) => res.data.data.transactions)
    .catch((err) => { throw err });
}

export default ynabRouter;