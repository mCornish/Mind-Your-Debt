import React, { Component } from 'react';
import _ from 'lodash';
import axios from 'axios';
import moment from 'moment';
import './App.css';

const YNAB_ID = process.env.REACT_APP_YNAB_CLIENT_ID;
const YNAB_URI = process.env.REACT_APP_YNAB_REDIRECT_URI;
const authUrl = `https://app.youneedabudget.com/oauth/authorize?client_id=${YNAB_ID}&redirect_uri=${YNAB_URI}&response_type=token`;

function averagePayments(transactions) {
  const monthPayments = transactions.reduce(toMonths, {});
  return _.toPairs(monthPayments).reduce(toAverages, {});

  function toMonths(payments, transaction) {
    if (transaction.amount < 0) return payments;
    const month = moment(transaction.date).format('MM-YY');
    const currentPayments = payments[month] || [];
    return _.assign({}, payments, {
      [month]: currentPayments.concat(transaction.amount)
    });
  }

  function toAverages(averages, paymentPair) {
    return _.assign({}, averages, {
      [paymentPair[0]]: _.mean(paymentPair[1])
    });
  }
}

async function fetchAccounts(budgetId, token) {
  return await axios(`/api/budgets/${budgetId}/accounts?token=${token}`)
    .then((res) => res.data)
    .catch((err) => { throw err });
}

async function fetchBudget(budgetId, token) {
  return await axios(`/api/budgets/${budgetId}?token=${token}`)
  .then((res) => res.data)
  .catch((err) => { throw err });
}

async function fetchBudgets(token) {
  return await axios(`/api/budgets?token=${token}`)
    .then((res) => res.data)
    .catch((err) => { throw err });
}

async function fetchCategories(budgetId, token) {
  return await axios(`/api/budgets/${budgetId}/categories?token=${token}`)
    .then((res) => res.data)
    .catch((err) => { throw err });
}

async function fetchMonth(budgetId, token) {
  return await axios(`/api/budgets/${budgetId}/months/current?token=${token}`)
    .then((res) => res.data)
    .catch((err) => { throw err });
}

async function fetchTransactions(budgetId, accountId, token) {
  return await axios(`/api/budgets/${budgetId}/accounts/${accountId}/transactions?token=${token}`)
    .then((res) => res.data)
    .catch((err) => { throw err });
}

async function fetchUser(token) {
  const userRes = await axios(`/api/users/ynab-user/${token}`);
  return userRes.data;
}

function leastRecentDate(dates, format='MM-YY') {
  const moments = dates.map((date) => moment(date, format));
  return sortMoments(moments)[dates.length - 1];
}

function mostRecentDate(dates, format='MM-YY') {
  const moments = dates.map((date) => moment(date, format));
  return sortMoments(moments)[0];
}

function payoffMonths({ payment, principal, rate = .0000001 }) {
  const monthRate = rate / 12;
  const calc1 = Math.log(1 - ((Math.abs(principal) / payment) * monthRate));
  const calc2 = Math.log(1 + monthRate);
  return Math.ceil(-(calc1 / calc2)); 
}

function sortMoments(moments) {
  return moments.sort((a, b) => {
    if (a.isBefore(b)) return -1;
    if (b.isBefore(a)) return 1;
    return 0;
  });
}

function toDollars(milliunits) {
  const sign = milliunits < 0 ? '-' : '';
  return `${sign} $${Math.abs(milliunits / 1000).toFixed(2)}`;
}

class App extends Component {
  state = {
    accounts: [],
    allAccounts: [],
    allCategories: [],
    budgets: [],
    budget: null,
    categories: [],
    payoffBudget: null,
    month: null,
    payoffDate: null,
    transactions: {},
    user: null,
    Ynab: null
  };

  componentDidMount() {
    this.init();
  }

  render() {
    const accounts = this.state.accounts;
    const authorized = this.state.user;

    return (
      <div className="App">
        <h1>Mind Your Debt</h1>
        {authorized ? (
          <div>
            {this.state.budget && (
              <ul>
                {this.state.allAccounts.map((account) => (
                  <li key={account.id}>
                    <label htmlFor={`acc-${account.id}`}>
                      <input
                        id={`acc-${account.id}`}
                        type="checkbox"
                        onChange={(e) => this.toggleAccount(account, e.target.checked)}
                      />
                      {account.name}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            
            <h2>
              <label htmlFor="budget">
              Payoff Budget:
              <input
                id="budget"
                onChange={(e) => this.setBudget(e.target.value)}
              />
              </label>
            </h2>
            {this.state.month && (
              <h2>To Be Budgeted: {toDollars(this.state.month.to_be_budgeted)}</h2>
            )}
            <h2>Debts</h2>
            {!!accounts.length && (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Balance</th>
                    <th>Principal</th>
                    <th>Interest Rate (%)</th>
                    <th>Average Payment</th>
                    <th>Payoff Date</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={`active-${account.id}`}>
                      <td>{account.name}</td>
                      <td>{toDollars(account.balance)}</td>
                      <td>
                        <input
                          type="number"
                          onChange={(e) => this.setPrincipal(account, e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          onChange={(e) => this.setInterest(account, e.target.value)}
                        />
                      </td>
                      <td>{toDollars(this.averagePayment(account))}</td>
                      <td>{this.accountPayoffDate(account).format('MMM YYYY')}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>Total</td>
                    <td>{toDollars(_.sumBy(accounts, 'balance'))}</td>
                    <td>{toDollars(_.meanBy(accounts, 'principal'))}</td>
                    <td>{_.meanBy(accounts, 'interestRate') * 100}</td>
                    <td>{toDollars(_.sumBy(accounts, this.averagePayment))}</td>
                    <td>{this.state.payoffDate.format('MMM YYYY')}</td>
                  </tr>
                </tbody>
              </table>
            )}
    
            {this.state.payoffDate && (
              <h2>
              Payoff Date: {this.state.payoffDate.format('MMM YYYY')} ({this.state.payoffDate.fromNow()})
              </h2>
            )}
          </div>
        ) : (
          <a href={authUrl}>Sign In</a>
        )}
      </div>
    );
  }

  init = async () => {
    const authToken = getAuthToken();
    if (!authToken) return undefined;
    const user = await fetchUser(authToken);

    const budgets = await fetchBudgets(authToken);
    const budget = budgets.length === 1 ? budgets[0] : null;
    const allAccounts = budget ? await fetchAccounts(budget.id, authToken) : [];
    const allCategories = budget ? await fetchCategories(budget.id, authToken) : [];
    const month = budget ? await fetchMonth(budget.id, authToken) : [];

    this.setState({
      allAccounts,
      allCategories,
      authToken,
      budget,
      budgets,
      month,
      user
    });
  }

  accountPayoffDate = (account) => {
    if (!account) throw new Error('Must include an account');
    if (!account.averagePayments) throw new Error('No average payments found');
    const payment = this.averagePayment(account);
    const principal = account.principal || account.balance;
    const rate = account.interestRate;
    const monthsRemaining = payoffMonths({ payment, principal, rate });
    return moment().add(monthsRemaining, 'months');
  }

  averagePayment = (account) => {
    const mostRecentMonth = mostRecentDate(_.keys(account.averagePayments));
    return account.averagePayments[mostRecentMonth.format('MM-YY')];
  }

  payoffDate = (accounts, monthlyPayment) => {
    const balances = _.map(accounts, 'balance');
    const totalBalance = Math.abs(_.sum(balances));
    if (monthlyPayment) {
      const monthsRemaining = Math.ceil(totalBalance / monthlyPayment);
      return moment().add(monthsRemaining, 'months');
    }
    const payoffDates = accounts.map(this.accountPayoffDate);
    return leastRecentDate(payoffDates);
  }

  setAccountActive = async (account) => {
    if (this.state.accounts.includes(account)) return undefined;
    const accountTransactions = this.state.transactions[account.id] || await fetchTransactions(this.state.budget.id, account.id, this.state.authToken);
    const transactions = accountTransactions ?
      _.assign({}, this.state.transactions, { [account.id]: accountTransactions}) :
      this.state.transactions;

    const newAccount = _.assign({}, account, {
      averagePayments: averagePayments(accountTransactions),
      owner: this.state.user._id,
      ynabId: account.id
    });
    const accounts = this.state.accounts.concat(newAccount);

    this.setState({
      accounts,
      payoffDate: this.payoffDate(accounts, this.state.payoffBudget),
      transactions
    });

    const accountRes = await axios.post(`/api/accounts/`, newAccount);
    axios.post(`/api/users/${this.state.user._id}/accounts`, { accountId: accountRes.data._id });
  }

  setAccountInactive = async (account) => {
    const accounts = _.reject(this.state.accounts, { id: account.id });
    const transactions = _.omit(this.state.transactions, account.id);
    
    axios.delete(`/api/accounts/:id`);

    this.setState({
      accounts,
      payoffDate: this.payoffDate(accounts, this.state.payoffBudget),
      transactions
    });
  }

  setBudget = (newBudget) => {
    const payoffBudget = newBudget * 1000;
    this.setState({
      payoffBudget,
      payoffDate: this.payoffDate(this.state.accounts, payoffBudget)
    });
  }

  setInterest = (account, rate) => {
    this.updateAccount(account, { interestRate: rate / 100 });
  }

  setPrincipal = (account, principal) => {
    this.updateAccount(account, { principal: principal * 1000 });
  }

  toggleAccount = async (account, willBeActive) => {
    willBeActive ? this.setAccountActive(account) : this.setAccountInactive(account);
  }

  toggleCategory = (category, willBeActive) => {
    const currentCategories = this.state.categories;
    const categories = willBeActive ?
      currentCategories.concat(category) :
      _.reject(currentCategories, { id: category.id });
    this.setState({ categories });
  }

  updateAccount = (account, accountInfo) => {
    const accountIndex = _.findIndex(this.state.accounts, { id: account.id });
    const accounts = this.state.accounts;
    const newAccount = _.assign({}, accounts[accountIndex], accountInfo);
    accounts[accountIndex] = newAccount;

    this.setState({
      accounts,
      payoffDate: this.payoffDate(this.state.accounts, this.state.payoffBudget)
    });
  }
}

function getAuthToken() {
  const search = window.location.hash ?
    window.location.hash.replace('#', '?') :
    window.location.search;
  const params = new URLSearchParams(search);
  return params.get('access_token');
}

export default App;
