import express from 'express';
import { catchErrors } from '../helpers';
import { createAccount, deleteAccount } from '../controllers/accountController';
const accountRouter = express.Router();

accountRouter.route('/')
  .post(catchErrors(createAccount));

accountRouter.route('/:id')
  .delete(catchErrors(deleteAccount));

export default accountRouter;