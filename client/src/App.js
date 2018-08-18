import React, { Component } from 'react';
import _ from 'lodash';
import axios from 'axios';
import moment from 'moment';
import './App.css';

import Login from './components/Login/Login';

function averageTransaction(transactions) {
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

function getAverage(collection, property) {
  const values = _.filter(collection, (item) => !!item[property]);
  // if (!values.length) return null;
  return _.meanBy(values, property);
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
  const value = Math.abs(milliunits / 1000).toFixed(2);
  return isNaN(value) ? null : `${sign} $${value}`;
}

class App extends Component {
  state = {
    accounts: [],
    allAccounts: [],
    allCategories: [],
    authUrl: '',
    budgets: [],
    budget: null,
    categories: [],
    payoffBudget: null,
    month: null,
    payoffDate: moment(),
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
            {this.state.budget ? (
              <div>
                {/* Budget Selection */}
                <select
                  defaultValue={_.find(this.state.budgets, { id: this.state.user.budgetId })}
                  onChange={(e) => this.selectBudget(e.target.value)}
                >
                  {this.state.budgets.map((budget) => (
                    <option
                      key={budget.id}
                      value={budget.id}
                    >{budget.name}</option>
                  ))}
                </select>

                {/* TODO: Make account selection collapsable */}
                <ul>
                  {this.state.allAccounts.map((account) => (
                    <li key={account.id}>
                      <label htmlFor={`acc-${account.id}`}>
                        <input
                          id={`acc-${account.id}`}
                          type="checkbox"
                          onChange={(e) => this.toggleAccount(account, e.target.checked)}
                          checked={_.map(this.state.accounts, 'ynabId').includes(account.id)}
                        />
                        {account.name}
                      </label>
                    </li>
                  ))}
                </ul>

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
                  // TODO: Make table sortable
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
                              onBlur={(e) => this.setPrincipal(account, e.target.value)}
                              defaultValue={account.principal ? account.principal / 1000 : null}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              onBlur={(e) => this.setInterest(account, e.target.value)}
                              defaultValue={account.interestRate ? account.interestRate * 100 : 0}
                            />
                          </td>
                          <td>{toDollars(this.averagePayment(account))}</td>
                          <td>{this.accountPayoffDate(account).format('MMM YYYY')}</td>
                        </tr>
                      ))}
                      <tr>
                        <td>Total</td>
                        <td>{toDollars(_.sumBy(accounts, 'balance'))}</td>
                        <td>{toDollars(getAverage(accounts, 'principal')) || '--'}</td>
                        <td>{getAverage(accounts, 'interestRate') * 100 || '--'}</td>
                        <td>{toDollars(_.sumBy(accounts, this.averagePayment))}</td>
                        <td>{this.state.payoffDate.format('MMM YYYY')}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
        
                {this.state.payoffDate && (
                  <h2>
                    Payoff Date: {this.state.payoffDate.format('MMM YYYY')} ({this.state.payoffDate.fromNow()})
                    <br/>
                    Monthly Payment: {
                      toDollars(_.sumBy(_.filter(accounts, 'balance'), (account) => this.averagePayment(account)))
                    }
                  </h2>
                )}
              </div>
            ) : (
              <ul>
                {this.state.budgets.map((budget) => (
                  <li key={budget.id}>
                    <button
                      onClick={() => this.selectBudget(budget)}
                    >{budget.name}</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <Login url={this.state.authUrl}/>
        )}
      </div>
    );
  }

  init = async () => {
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        const urlRes = await axios('/api/authUrl');
        return this.setState({ authUrl: urlRes.data.authUrl });
      };
      const user = await fetchUser(authToken);
      
      const budgets = await fetchBudgets(authToken);
      if (!budgets.length) return undefined;
      const budget = user.budgetId ? _.find(budgets, { id: user.budgetId }) : budgets[0];
      if (budget) this.fetchBudgetInfo({ authToken, budgetId: budget.id, user });

      this.setState({
        authToken,
        budget,
        budgets,
        user
      });
    } catch (err) {
      throw err;
    }
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
    if (!mostRecentMonth) return 0;
    return account.averagePayments[mostRecentMonth.format('MM-YY')];
  }

  fetchBudgetInfo = async ({ authToken, budgetId, user }) => {
    if (!authToken) throw new Error('authToken undefined: YNAB authorization token is required.');
    if (!budgetId) throw new Error('budgetId undefined: Budget ID is required.');
    if (!user) throw new Error('user undefined: User is required.');

    const accountsPromise = fetchAccounts(budgetId, authToken);
    const categoriesPromise = fetchCategories(budgetId, authToken);
    const monthPromise = fetchMonth(budgetId, authToken);
    const [ allAccounts, allCategories, month ] = await Promise.all([ accountsPromise, categoriesPromise, monthPromise ]);

    // Add YNAB data to saved accounts and initialize them
    const combinedAccounts = user.accounts.map(toCombined);
    const accounts = await Promise.all(combinedAccounts.map((account) => this.initAccount(account, budgetId, authToken, user._id)));

    this.setState({
      accounts,
      allAccounts,
      allCategories,
      month,
      payoffDate: this.payoffDate(accounts, this.state.payoffBudget)
    });

    function toCombined(account) {
      const ynabAccount = _.find(allAccounts, { id: account.ynabId }) || {};
      return _.assign({}, account, ynabAccount);
    }
  } 

  initAccount = async (account, budgetId = this.state.budget.id, token = this.state.authToken, userId = this.state.user._id) => {
    const transactions =
    // this.state.transactions[account.id] ||
    await fetchTransactions(budgetId, account.id, token);
    // const transactions = accountTransactions ?
    // _.assign({}, this.state.transactions, { [account.id]: accountTransactions}) :
    // this.state.transactions;

    return _.assign({}, account, {
      averagePayments: await averageTransaction(transactions),
      owner: userId,
      ynabId: account.ynabId || account.id
    });
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
    
    const newAccount = await this.initAccount(account);
    const accounts = this.state.accounts.concat(newAccount);

    this.setState({
      accounts,
      payoffDate: this.payoffDate(accounts, this.state.payoffBudget),
      // transactions
    });

    const accountRes = await axios.post(`/api/accounts/`, newAccount);
    axios.post(`/api/users/${this.state.user._id}/accounts`, { accountId: accountRes.data._id });
  }

  setAccountInactive = async (account) => {
    const accountId = _.find(this.state.accounts, { ynabId: account.id })._id;
    const accounts = _.reject(this.state.accounts, { ynabId: account.id });
    // const transactions = _.omit(this.state.transactions, account.id);
    
    this.setState({
      accounts,
      payoffDate: this.payoffDate(accounts, this.state.payoffBudget),
      // transactions
    });

    axios.delete(`/api/accounts/${accountId}`)
      .catch((err) => { throw err });
  }

  /**
   * Set active budget
   * @param {String | Object} budgetVal - Budget (or ID of Budget) to select
   */
  selectBudget = async (budgetVal) => {
    // TODO: Organize accounts beneath a Budget model to fetch accounts for a budget after selection
    try {
      const budget = _.isString(budgetVal) ? _.find(this.state.budgets, { id: budgetVal }) : budgetVal;

      this.fetchBudgetInfo({
        authToken: this.state.authToken,
        budgetId: budget.id,
        user: this.state.user
      });

      const { data: user } = await axios.put(`/api/users/${this.state.user._id}`, { budgetId: budget.id });

      this.setState({ budget, user });
    } catch (err) {
      throw err;
    }
  }

  setBudget = (newBudget) => {
    const payoffBudget = newBudget * 1000;
    this.setState({
      payoffBudget,
      payoffDate: this.payoffDate(this.state.accounts, payoffBudget)
    });
  }

  setInterest = (account, rate) => {
    if (rate === account.interestRate) return undefined;
    this.updateAccount(account, { interestRate: rate / 100 });
  }

  setPrincipal = (account, principal) => {
    if (principal === account.principal) return undefined;
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

    axios.put(`/api/accounts/${account._id}`, accountInfo)
      .catch((err) => { throw err });
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
