import moment from 'moment';
import {
  filter,
  mean,
  meanBy,
  toPairs
} from 'lodash';

export function accountPayoffDate(account) {
  if (!account) throw new Error('Must include an account');
  if (!account.averagePayments) throw new Error('No average payments found');
  const payment = averagePayment(account);
  const principal = account.principal || account.balance;
  const rate = account.interestRate;
  const monthsRemaining = payoffMonths({ payment, principal, rate });
  return moment().add(monthsRemaining, 'months');
}

export function averagePayment(account) {
  const mostRecentMonth = mostRecentDate(Object.keys(account.averagePayments));
  if (!mostRecentMonth) return 0;
  return account.averagePayments[mostRecentMonth.format('MM-YY')];
}

export function averageTransaction(transactions) {
  const monthPayments = transactions.reduce(toMonths, {});
  return toPairs(monthPayments).reduce(toAverages, {});

  function toMonths(payments, transaction) {
    if (transaction.amount < 0) return payments;
    const month = moment(transaction.date).format('MM-YY');
    const currentPayments = payments[month] || [];
    return {
      ...payments,
      [month]: currentPayments.concat(transaction.amount)
    };
  }

  function toAverages(averages, paymentPair) {
    return {
      ...averages,
      [paymentPair[0]]: mean(paymentPair[1])
    };
  }
}

export function getAverage(collection, property) {
  const values = filter(collection, (item) => !!item[property]);
  // if (!values.length) return null;
  return meanBy(values, property);
}

export function leastRecentDate(dates, format='MM-YY') {
  const moments = dates.map((date) => moment(date, format));
  return sortMoments(moments)[dates.length - 1];
}

export function mostRecentDate(dates, format='MM-YY') {
  const moments = dates.map((date) => moment(date, format));
  return sortMoments(moments)[0];
}

export function payoffMonths({ payment, principal, rate = .0000001 }) {
  const monthRate = rate / 12;
  const calc1 = Math.log(1 - ((Math.abs(principal) / payment) * monthRate));
  const calc2 = Math.log(1 + monthRate);
  return Math.ceil(-(calc1 / calc2)); 
}

export function sortMoments(moments) {
  return moments.sort((a, b) => {
    if (a.isBefore(b)) return -1;
    if (b.isBefore(a)) return 1;
    return 0;
  });
}

export function toDollars(milliunits) {
  const sign = milliunits < 0 ? '-' : '';
  const value = Math.abs(milliunits / 1000).toFixed(2);
  return isNaN(value) ? null : `${sign} $${value}`;
}