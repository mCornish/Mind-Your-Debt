import React, { Component } from 'react';
import _ from 'lodash';
import axios from 'axios';
import moment from 'moment';
import { API as ynabAPI } from 'ynab';
import './App.css';

// TODO: Use server-side Code Grant Flow instead (https://api.youneedabudget.com/#outh-applications)
const YNAB_ID = process.env.YNAB_CLIENT_ID;
const YNAB_URI = process.env.YNAB_REDIRECT_URI;
const authUrl = `https://app.youneedabudget.com/oauth/authorize?client_id=${YNAB_ID}&redirect_uri=${YNAB_URI}&response_type=token`;
const Ynab = new ynabAPI(process.env.YNAB_TOKEN);

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

async function fetchAccounts(budgetId) {
  return await axios('/api/accounts').then(checkStatus).then(parseJSON);
  // return await Ynab.accounts.getAccounts(budgetId).then((res) => res.data.accounts);
}

async function fetchBudgets() {
  return await Ynab.budgets.getBudgets().then((res) => res.data.budgets);
}

async function fetchCategories(budgetId) {
  // const budgetId = givenBudgetId || await fetchBudgets().then((budgets) => budgets[0].id);
  const groups = await Ynab.categories.getCategories(budgetId).then((res) => res.data.category_groups);
  const categories = _.flatten(_.map(groups, 'categories'));
  return categories;
}

async function fetchMonth(budgetId) {
  const month = await Ynab.months.getBudgetMonth(budgetId, 'current').then((res) => res.data.month);
  return month
}

async function fetchTransactions(budgetId, accountId) {
  const transactions = await Ynab.transactions.getTransactionsByAccount(budgetId, accountId).then((res) => res.data.transactions);
  return transactions;
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
    transactions: {}
  };

  componentDidMount() {
    this.init();
  }

  render() {
    const authorized = _.get(this.state, 'user.authToken');

    return (
      <div className="App">
        <h1>Mind Your Debt</h1>
        {!authorized && (
          <a href={authUrl}>Sign In</a>
        )}
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
        {!!this.state.accounts.length && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Balance</th>
                <th>Interest Rate (%)</th>
                <th>Average Payment</th>
                <th>Payoff Date</th>
              </tr>
            </thead>
            <tbody>
              {this.state.accounts.map((account) => (
                <tr key={`active-${account.id}`}>
                  <td>{account.name}</td>
                  <td>{toDollars(account.balance)}</td>
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
            </tbody>
          </table>
        )}

        {this.state.payoffDate && (
          <h2>
          Payoff Date: {this.state.payoffDate.format('MMM YYYY')} ({this.state.payoffDate.fromNow()})
          </h2>
        )}
      </div>
    );
  }

  init = async () => {
    const budgets = await fetchBudgets();
    const budget = budgets.length === 1 ? budgets[0] : null;
    const allAccounts = budget ? await fetchAccounts(budget.id) : [];
    const allCategories = budget ? await fetchCategories(budget.id) : [];
    const month = budget ? await fetchMonth(budget.id) : [];

    this.setState({
      allAccounts,
      allCategories,
      budget,
      budgets,
      month
    });
  }

  accountPayoffDate = (account) => {
    if (!account) throw new Error('Must include an account');
    if (!account.averagePayments) throw new Error('No average payments found');
    const payment = this.averagePayment(account);
    const principal = account.principal || account.balance;
    const rate = account.interestRate;
    const monthsRemaining = payoffMonths({ payment, principal, rate });
    console.log(payment, principal, rate, monthsRemaining)
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

  setBudget = (newBudget) => {
    const payoffBudget = newBudget * 1000;
    this.setState({
      payoffBudget,
      payoffDate: this.payoffDate(this.state.accounts, payoffBudget)
    });
  }

  setInterest = (account, rate) => {
    const newAccount = _.assign({}, account, {
      interestRate: rate / 100
    });
    const accountIndex = _.findIndex(this.state.accounts, { id: account.id });
    const accounts = this.state.accounts;
    accounts[accountIndex] = newAccount;

    this.setState({
      accounts,
      payoffDate: this.payoffDate(this.state.accounts, this.state.payoffBudget)
    });
  }

  toggleAccount = async (account, willBeActive) => {
    const accountTransactions = this.state.transactions[account.id] || await fetchTransactions(this.state.budget.id, account.id);
    const transactions = accountTransactions ?
      _.assign({}, this.state.transactions, { [account.id]: accountTransactions}) :
      this.state.transactions;

    const newAccount = _.assign({}, account, {
      averagePayments: averagePayments(accountTransactions)
    });
    const currentAccounts = this.state.accounts;
    const accounts = willBeActive ?
      currentAccounts.concat(newAccount) :
      _.reject(currentAccounts, { id: account.id });  

    this.setState({
      accounts,
      payoffDate: this.payoffDate(accounts, this.state.payoffBudget),
      transactions
    });
  }

  toggleCategory = (category, willBeActive) => {
    const currentCategories = this.state.categories;
    const categories = willBeActive ?
      currentCategories.concat(category) :
      _.reject(currentCategories, { id: category.id });
    this.setState({ categories });
  }
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error = new Error(`HTTP Error ${response.statusText}`);
  error.status = response.statusText;
  error.response = response;
  console.log(error); // eslint-disable-line no-console
  throw error;
}

function parseJSON(response) {
  return response.json();
}

export default App;
