import express from 'express';
import { catchErrors } from '../helpers';
import {
  addAccount,
  createUser,
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

userRouter.route('/:id/accounts')
  .post(catchErrors(addAccount));

userRouter.route('/ynab-user/:token')
  .get(catchErrors(getYnabUser));

export default userRouter;