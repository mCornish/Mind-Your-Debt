import axios from 'axios';
import {
  castArray as _castArray,
  map as _map
} from 'lodash';

export async function addBudgetAccounts(budgetId, accounts) {
  const newAccounts = await Promise.all(_castArray(accounts).map(createAccount));
  const ids = _map(newAccounts, '_id');
  const budget = (await axios.post(`/api/budgets/${budgetId}/accounts`, { ids })).data;
  return { newAccounts, budget };
}

export async function addUserBudgets(userId, budgets) {
  const userBudgets = _castArray(budgets).map((budget) => Object.assign({}, budget, {
    owner: userId,
    ynabId: budget.ynabId || budget.id
  }));
  const newBudgets = await Promise.all(userBudgets.map(createBudget));
  const ids = _map(newBudgets, '_id');
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
  return (await axios.delete(`/api/budgets/${budgetId}/accounts`, { data: { ids: _castArray(ids) }})).data;
}

export async function updateAccount(account) {
  if (!account._id) throw new Error('_id undefined: Account ID is required.');
  return (await axios.put(`/api/accounts/${account._id}`, account)).data;
}

export async function upsertBudgetAccounts(budget, accounts) {
  // Create new Accounts as needed
  const unsavedAccounts = _castArray(accounts).filter((account) => !account._id);
  const newAccountsPromise = Promise.all(unsavedAccounts.map(createAccount)).catch((err) => { throw err });

  // Update existing Accounts
  const savedAccounts = _castArray(accounts).filter((account) => account._id);
  const updateAccountsPromise = Promise.all(savedAccounts.map((account) => updateAccount(account))).catch((err) => { throw err });

  const [newAccounts, updatedAccounts] = await Promise.all([newAccountsPromise, updateAccountsPromise]);
  const allAccounts = [...newAccounts, ...updatedAccounts];

  // Update Budget Accounts
  const ids = _map(allAccounts, '_id');
  const updatedBudget = (await axios.put(`/api/budgets/${budget._id}/accounts`, { ids })).data;
  return { accounts: allAccounts, budget: updatedBudget };
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
  upsertBudgetAccounts,
  user,
  userBudgets,
  removeBudgetAccounts,
  ynabAccounts,
  ynabBudgets,
  ynabCategories,
  ynabMonth,
  ynabTransactions
}