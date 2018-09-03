import React, { Component } from 'react';
import _ from 'lodash';
import axios from 'axios';
import moment from 'moment';
import api from './api';
import {
  accountInterest,
  accountPayoffDate,
  averagePayment,
  averageTransaction,
  getAverage,
  leastRecentDate,
  toDollars
} from './utils';
import './App.css';

import Collapsable from './components/Collapsable/Collapsable';
import Login from './components/Login/Login';

// TODO: Include some kind of visualization for amount of interest paid/accumulated
// TODO: Add and manage modified property on each model
// TODO: Implement Error Boundaries, particularly for failed API calls
class App extends Component {
  state = {
    accounts: [],
    accountSort: 'balance',
    accountSortAsc: true,
    ynabAccounts: [],
    // allCategories: [],
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

  accountFields = [{
    label: 'Name',
    property: 'name'
  }, {
    label: 'Balance',
    property: 'balance',
    transform: (balance) => toDollars(Math.abs(balance))
  }, {
    label: 'Principal',
    property: 'principal',
    input: {
      default: (account) => account.principal ? account.principal / 1000 : null,
      onBlur: (e, account) => this.setPrincipal(account, e.target.value),
      type: 'number'
    }
  }, {
    label: 'Interest Rate (%)',
    property: 'interestRate',
    input: {
      default: (account) => account.interestRate ? account.interestRate * 100 : 0,
      onBlur: (e, account) => this.setInterest(account, e.target.value),
      type: 'number'
    }
  }, {
    label: 'Monthly Interest',
    property: accountInterest,
    transform: toDollars
  }, {
    label: 'Average Payment',
    property: averagePayment,
    transform: toDollars
  }, {
    label: 'Payoff Date',
    property: accountPayoffDate,
    transform: (date) => date.format('MMM YYYY')
  }];

  componentDidMount() {
    this.init();
  }

  render() {
    const accounts = this.state.accounts;
    const authorized = this.state.user;
    const activeAccounts = _.filter(accounts, { isActive: true });

    return (
      <div className="App">
        <h1 className="logo">Mind Your Debt</h1>
        {authorized ? (
          <div>
            {this.state.budget ? (
              <div>
                {/* Budget Selection */}
                {/* Add null state for when there are no Budgets */}
                <select
                  defaultValue={this.state.user.activeBudget && _.find(this.state.budgets, { _id: this.state.user.activeBudget })._id}
                  onChange={(e) => this.selectBudget(e.target.value)}
                >
                  {this.state.budgets.map((budget) => (
                    <option
                      key={budget._id}
                      value={budget._id}
                    >{budget.name}</option>
                  ))}
                </select>

                <button
                  onClick={this.syncYnabData}
                >Sync</button>

                {/* Account Selection */}
                {/* TODO: Add null state for when the Budget has no accounts */}
                <div className="AccountSelect">
                  <Collapsable
                    closeText="Hide Accounts"
                    isHidden={!this.state.accounts.length}
                    open={!this.state.accounts.length}
                    openText="Show Accounts"
                  >
                    <p>Select your debt accounts:</p>
                    <ul>
                      {accounts.map((account) => (
                        <li key={account._id}>
                          <label
                            htmlFor={`acc-${account._id}`}
                            className={account.isActive ? 'is-active' : ''}
                          >
                            <input
                              id={`acc-${account._id}`}
                              type="checkbox"
                              onChange={(e) => this.toggleAccount(account, e.target.checked)}
                              checked={account.isActive}
                            />
                            {account.name}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </Collapsable>
                </div>

                {/* TODO: Decide whether/how to incorporate budget balance */}
                {/* <h2>
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
                )} */}
                {!!accounts.length && (
                  <div>
                    <h2>Debts</h2>
                    {/* TODO: Create editable table component */}
                    <table className="EditableTable">
                      <thead>
                        <tr>
                        {this.accountFields.map((field, index) => (
                          <th
                            key={index}
                            onClick={() => this.sortAccounts(field.property)}
                          >
                            {field.label}
                            {field.property === this.state.accountSort && (
                              <span
                                dangerouslySetInnerHTML={{__html: this.state.accountSortAsc ? '&#9652;' : '&#9662;'}}
                              ></span>
                            )}
                          </th>
                        ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeAccounts.map((account) => (
                          <tr key={`${account._id}`}>
                            {this.accountFields.map((field) => (
                              <td key={field.label}>
                                {field.input ? (
                                  // TODO: Display editable value rather than always displaying an input
                                  <input
                                    defaultValue={field.input.default(account)}
                                    onBlur={(e) => field.input.onBlur(e, account)}
                                    type={field.input.type}
                                  />
                                ) : (
                                  _.isString(field.property) ? (
                                    <span>{field.transform ? field.transform(account[field.property]) : account[field.property]}</span>
                                  ) : (
                                    <span>{field.transform ? field.transform(field.property(account)) : field.property(account)}</span>
                                  )
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr className="EditableTable__total">
                          <td>Total</td>
                          <td>{toDollars(Math.abs(_.sumBy(accounts, 'balance')))}</td>
                          <td>{toDollars(getAverage(accounts, 'principal')) || '--'}</td>
                          <td>{(getAverage(accounts, 'interestRate') * 100).toFixed(2) || '--'}</td>
                          <td>{toDollars(_.sumBy(accounts, accountInterest))}</td>
                          <td>{toDollars(_.sumBy(accounts, averagePayment))}</td>
                          <td>{this.state.payoffDate.format('MMM YYYY')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
        
                {this.state.payoffDate && (
                  <div className="results">
                    <p className="result">
                      Payoff Date: {this.state.payoffDate.format('MMM YYYY')} ({this.state.payoffDate.fromNow()})
                    </p>
                    <p className="result">
                      Monthly Payment: {
                        toDollars(_.sumBy(_.filter(accounts, 'balance'), (account) => averagePayment(account)))
                      }
                    </p>
                  </div>
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
          <div className="Login-container">
            <Login
              disabled={!this.state.authUrl}
              text={this.state.authUrl ?
                'Sign in to You Need a Budget to begin managing your debt' :
                'Preparing sign in...'
              }
              url={this.state.authUrl}
            />
          </div>
        )}
      </div>
    );
  }

  init = async () => {
    try {
      const authToken = getAuthToken();
      if (!authToken) return this.setState({ authUrl: await api.authUrl() });

      const user = await api.user(authToken);

      const budgets = user.budgets.length ?
        await api.userBudgets(user._id) :
        (await this.syncYnabData({ authToken, user })).budgets;

      if (!budgets.length) return undefined;
      
      // Get active Budget and its corresponding data
      const budget = user.activeBudget ? _.find(budgets, { _id: user.activeBudget }) : budgets[0];
      // if (budget) this.fetchBudgetInfo({ authToken, budget, userId: user._id });

      this.setState({
        accounts: budget.accounts,
        authToken,
        budget,
        budgets,
        payoffDate: this.payoffDate(budget.accounts),
        user
      });
    } catch (err) {
      throw err;
    }
  }

  accountIsActive = (account) => {
    return _.map(this.state.accounts, 'ynabId').includes(account.ynabId || account.id);
  }

  fetchBudgetInfo = async ({ authToken, budget, userId }) => {
    if (!authToken) throw new Error('authToken undefined: YNAB authorization token is required.');
    if (!budget) throw new Error('budget undefined: Budget is required.');
    if (!userId) throw new Error('userId undefined: User ID is required.');

    const ynabAccounts = await api.ynabAccounts(budget.ynabId, authToken);
    const savedAccounts = budget.accounts;
    // const categoriesPromise = fetchCategories(budget.ynabId, authToken);
    // const monthPromise = api.ynabMonth(budget.ynabId, authToken);
    // const [ ynabAccounts, month ] = await Promise.all([ accountsPromise, monthPromise ]);

    // Add Accounts to Budget as necessary
    const unsavedAccounts = ynabAccounts.filter((ynabAccount) => !_.find(savedAccounts, { ynabId: ynabAccount.id }));
    const preparedAccounts = await Promise.all(unsavedAccounts.map((account) => this.initAccount({
      account,
      authToken,
      budgetId: budget.ynabId,
      userId
    })));
    const { accounts } = await api.addBudgetAccounts(budget._id, preparedAccounts);

    // Add YNAB data to saved accounts and initialize them
    // const combinedAccounts = budget.accounts.map(toCombined);
    // const accounts = await Promise.all(budget.accounts.map((account) => this.initAccount(account, budget.ynabId, authToken, userId)));

    return {
      accounts: _.sortBy(accounts, this.state.accountSort),
      // allCategories,
      // month,
      ynabAccounts
    };

    // function toCombined(account) {
    //   const ynabAccount = _.find(ynabAccounts, { id: account.ynabId }) || {};
    //   return _.assign({}, account, ynabAccount);
    // }
  } 

  initAccount = async ({ account, budgetId = this.state.budget.ynabId, authToken = this.state.authToken, userId = this.state.user._id }) => {
    if (!account) throw new Error('account undefined: Account is required.');
    const transactions = await api.ynabTransactions(budgetId, account.id, authToken);
    return {
      ...account,
      averagePayments: await averageTransaction(transactions),
      balance: Math.abs(account.balance || 0),
      isActive: false,
      interestRate: 0,
      owner: userId,
      principal: Math.abs(account.balance || 0),
      ynabId: account.ynabId || account.id
    };
  }

  payoffDate = (accounts, monthlyPayment) => {
    console.log('TCL: payoffDate -> accounts', accounts);
    const balances = _.map(accounts, 'balance');
    const totalBalance = Math.abs(_.sum(balances));
    if (monthlyPayment) {
      const monthsRemaining = Math.ceil(totalBalance / monthlyPayment);
      return moment().add(monthsRemaining, 'months');
    }
    const payoffDates = accounts.map(accountPayoffDate);
    return leastRecentDate(payoffDates);
  }

  setAccountActive = async (account) => {
    if (this.state.accounts.includes(account)) return undefined;
    
    const newAccount = await this.initAccount(account);
    const { budget, newAccounts } = await api.addBudgetAccounts(this.state.budget._id, newAccount);
    const accounts = this.state.accounts.concat(Object.assign({}, newAccount, newAccounts[0]));

    this.setState({
      accounts,
      budget,
      payoffDate: this.payoffDate(accounts, this.state.payoffBudget),
    });
  }

  setAccountInactive = async (account) => {
    const accountId = _.find(this.state.accounts, { ynabId: account.id })._id;
    const accounts = _.reject(this.state.accounts, { ynabId: account.id });
    const budget = await api.removeBudgetAccounts(this.state.budget._id, accountId);
    
    this.setState({
      accounts,
      budget,
      payoffDate: this.payoffDate(accounts, this.state.payoffBudget)
    });
  }

  /**
   * Set active budget
   * @param {String | Object} budgetVal - Budget (or ID of Budget) to select
   */
  selectBudget = async (budgetVal) => {
    try {
      const budget = _.isString(budgetVal) ? _.find(this.state.budgets, { _id: budgetVal }) : budgetVal;

      this.fetchBudgetInfo({
        authToken: this.state.authToken,
        budget,
        userId: this.state.user._id
      });

      const { data: user } = await axios.put(`/api/users/${this.state.user._id}`, { activeBudget: budget._id });

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

  sortAccounts = (sortProperty = this.state.accountSort, isReverse = sortProperty === this.state.accountSort) => {
    // TODO: Fix sorting dates/moments
    const accounts = isReverse ?
      _.reverse(this.state.accounts) :
      _.sortBy(this.state.accounts, sortProperty);

    this.setState({
      accounts,
      accountSort: sortProperty,
      accountSortAsc: isReverse ? !this.state.accountSortAsc : this.state.accountSortAsc
    });
  }

  syncYnabData = async ({ authToken = this.state.authToken, user = this.state.user }) => {
    const userBudgets = await api.userBudgets(user._id);
    const ynabBudgets = await api.ynabBudgets(authToken);

    if (!userBudgets.length && !ynabBudgets.length) return undefined;

    // Add Budgets to User as necessary
    const nonUserBudgets = ynabBudgets.filter((ynabBudget) => !_.find(userBudgets, { ynabId: ynabBudget.id }));
    const { newBudgets } = await api.addUserBudgets(user._id, nonUserBudgets);
    const withYnabData = (budget) => Object.assign({}, budget, _.find(ynabBudgets, { id: budget.ynabId }));
    const budgets = userBudgets.concat(newBudgets).map((withYnabData));
    
    // Get active Budget and its corresponding data
    const budget = user.activeBudget ? _.find(budgets, { _id: user.activeBudget }) : budgets[0];
    const { accounts, ynabAccounts } = this.fetchBudgetInfo({ authToken, budget, userId: user._id });

    return {
      accounts,
      budget,
      budgets,
      ynabAccounts
    };
  }

  toggleAccount = async (account, willBeActive) => {
    console.log('TCL: toggleAccount -> account', account);
    // TODO: Sort accounts after toggling
    await this.updateAccount(account, { isActive: willBeActive });
    this.sortAccounts(this.accountSort, false);
    // willBeActive ? this.setAccountActive(account) : this.setAccountInactive(account);
  }

  toggleCategory = (category, willBeActive) => {
    const currentCategories = this.state.categories;
    const categories = willBeActive ?
      currentCategories.concat(category) :
      _.reject(currentCategories, { id: category.id });
    this.setState({ categories });
  }

  updateAccount = async (account, accountInfo) => {
    const accountIndex = _.findIndex(this.state.accounts, { _id: account._id });
    const accounts = this.state.accounts;
    const newAccount = await api.updateAccount(account._id, { ...account, ...accountInfo });
    accounts[accountIndex] = newAccount;

    this.setState({
      accounts,
      payoffDate: this.payoffDate(accounts)
    });

    return newAccount;
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
