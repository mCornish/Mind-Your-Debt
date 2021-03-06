import express from 'express';
import { catchErrors } from '../helpers';
import {
  addAccounts,
  createBudget,
  removeAccounts,
  getBudget,
  updateBudget,
  updateAccounts
} from '../controllers/budgetController';
const budgetRouter = express.Router();

budgetRouter.route('/')
  .post(catchErrors(createBudget));

budgetRouter.route('/:id')
  .get(catchErrors(getBudget))
  .put(catchErrors(updateBudget));

budgetRouter.route('/:id/accounts')
  .post(catchErrors(addAccounts))
  .put(catchErrors(updateAccounts))
  .delete(catchErrors(removeAccounts));

export default budgetRouter;