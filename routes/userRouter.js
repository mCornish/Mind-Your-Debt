import express from 'express';
import axios from 'axios';
import User from '../models/userModel';
import { YNAB_BASE } from '../config';
const userRouter = express.Router();

userRouter.route('/')
  .get(async (req, res, next) => {
    try {
      const token = req.query.token;

      if (token) {
        const ynabUser = await fetchYnabUser(token);
        if (!ynabUser) next(new Error('No YNAB user found.'));

        User.findOne({ id: ynabUser.id }, async (err, user) => {
          if (err) next(err);
          if (user) return res.json(user);
          const newUser = new User({ id: ynabUser.id });

          await newUser.save();
          res.json(newUser);
        });
        return undefined;
      }

      User.find({}, async (err, users) => {
        if (err) next(err);
        res.json(users);
      });
    } catch (err) {
      next(err);
    } 
  });

async function fetchYnabUser(token) {
  return await axios(`${YNAB_BASE}/user?access_token=${token}`)
    .then((res) => res.data.data.user)
    .catch((err) => { throw err });
}

export default userRouter;