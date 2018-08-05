import express from 'express';
import { API as ynabAPI } from 'ynab';
import Account from '../models/accountModel';
const accountRouter = express.Router();

const Ynab = new ynabAPI(process.env.YNAB_TOKEN);

accountRouter.route('/')
  .get((req, res, next) => {
    Account.find({}, async (err, accounts) => {
      if (err) next(err);
      if (accounts.length) res.json(account);
      res.json(await Ynab.accounts.getAccounts(budgetId));
    });
  });

export default accountRouter;