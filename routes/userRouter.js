import express from 'express';
import { catchErrors } from '../helpers';
import {
  addBudgets,
  createUser,
  getBudgets,
  getUser,
  getYnabUser,
  updateUser
} from '../controllers/userController';
const userRouter = express.Router();

userRouter.route('/')
  .post(catchErrors(createUser));

userRouter.route('/:id')
  .get(catchErrors(getUser))
  .put(catchErrors(updateUser));

userRouter.route('/:id/budgets')
  .get(catchErrors(getBudgets))
  .post(catchErrors(addBudgets));

userRouter.route('/ynab-user/:token')
  .get(catchErrors(getYnabUser));

export default userRouter;