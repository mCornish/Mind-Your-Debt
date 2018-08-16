import express from 'express';
import { catchErrors } from '../helpers';
import { createAccount } from '../controllers/accountController';
const accountRouter = express.Router();

accountRouter.route('/')
  .post(catchErrors(createAccount));

export default accountRouter;