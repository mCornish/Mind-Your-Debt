import Account from '../models/accountModel';

export async function createAccount(req, res) {
  const existingAccount = await Account.findOne({ ynabId: req.body.ynabId });
  if (existingAccount) return res.json(existingAccount);
  const account = await (new Account(req.body)).save();
  res.json(account);
}