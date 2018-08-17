import express from 'express';
import { catchErrors } from '../helpers';
import { createAccount, deleteAccount, updateAccount } from '../controllers/accountController';
const accountRouter = express.Router();

accountRouter.route('/')
  .post(catchErrors(createAccount));

accountRouter.route('/:id')
  .put(catchErrors(updateAccount))
  .delete(catchErrors(deleteAccount));

export default accountRouter;