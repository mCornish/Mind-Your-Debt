import axios from 'axios';
import {
  castArray,
  map
} from 'lodash';

export async function addBudgetAccounts(budgetId, accounts) {
  const newAccounts = await Promise.all(castArray(accounts).map(createAccount));
  const ids = map(newAccounts, '_id');
  console.log('TCL: addBudgetAccounts -> ids', ids);
  const budget = (await axios.post(`/api/budgets/${budgetId}/accounts`, { ids })).data;
  console.log('TCL: addBudgetAccounts -> budget', budget);
  return { newAccounts, budget };
}

export async function addUserBudgets(userId, budgets) {
  const userBudgets = castArray(budgets).map((budget) => Object.assign({}, budget, {
    owner: userId,
    ynabId: budget.ynabId || budget.id
  }));
  const newBudgets = await Promise.all(userBudgets.map(createBudget));
  const ids = map(newBudgets, '_id');
  const user = (await axios.post(`/api/users/${userId}/budgets`, { ids })).data;
  return { newBudgets, user };
}

export async function authUrl() {
  return (await axios('/api/authUrl')).data.authUrl;
}

export async function createAccount(account) {
  return (await axios.post('/api/accounts', account)).data;
}

export async function createBudget(budget) {
    return (await axios.post('/api/budgets', budget)).data;
}

export async function user(token) {
  return (await axios(`/api/users/ynab-user/${token}`)).data;
}

export async function userBudgets(userId) {
  return (await axios(`/api/users/${userId}/budgets`)).data;
}

export async function removeBudgetAccounts(budgetId, ids) {
  return (await axios.delete(`/api/budgets/${budgetId}/accounts`, { data: { ids: castArray(ids) }})).data;
}

export async function updateAccount(accountId, accountInfo) {
  return (await axios.put(`/api/accounts/${accountId}`, accountInfo)).data;
}

export async function ynabAccounts(budgetId, token) {
  return (await axios(`/api/ynab/budgets/${budgetId}/accounts?token=${token}`)).data;
}

export async function ynabBudgets(token) {
  return (await axios(`/api/ynab/budgets?token=${token}`)).data;
}

export async function ynabCategories(budgetId, token) {
  return (await axios(`/api/ynab/budgets/${budgetId}/categories?token=${token}`)).data;
}

export async function ynabMonth(budgetId, token) {
  return (await axios(`/api/ynab/budgets/${budgetId}/months/current?token=${token}`)).data;
}

export async function ynabTransactions(budgetId, accountId, token) {
  return (await axios(`/api/ynab/budgets/${budgetId}/accounts/${accountId}/transactions?token=${token}`)).data;
}

export default {
  addBudgetAccounts,
  addUserBudgets,
  authUrl,
  createAccount,
  createBudget,
  updateAccount,
  user,
  userBudgets,
  removeBudgetAccounts,
  ynabAccounts,
  ynabBudgets,
  ynabCategories,
  ynabMonth,
  ynabTransactions
}