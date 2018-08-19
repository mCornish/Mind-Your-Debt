import axios from 'axios';
import { YNAB_BASE } from '../config';

export async function getBudgets(req, res) {
  const token = req.query.token;
  const budgets = (await axios(`${YNAB_BASE}/budgets?access_token=${token}`)).data.data.budgets;
  res.json(budgets);
}