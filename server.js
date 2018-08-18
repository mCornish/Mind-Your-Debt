import express from 'express';
import fs from 'fs';
import https from 'https';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import accountRouter from './routes/accountRouter';
import budgetRouter from './routes/budgetRouter';
import userRouter from './routes/userRouter';


// Set environment variables
const env = dotenv.config();

const serverOptions = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.crt'),
  requestCert: false,
  rejectUnauthorized: false
};

const YNAB_ID = process.env.YNAB_CLIENT_ID;
const YNAB_URI = process.env.YNAB_REDIRECT_URI;
const MONGO_URI = process.env.MONGO_URI;
const db = mongoose.connect(MONGO_URI, { useNewUrlParser: true });

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("port", process.env.PORT || 3001);

// Express only serves static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

app.get('/api/authUrl', (req, res) => {
  res.json({ authUrl: `https://app.youneedabudget.com/oauth/authorize?client_id=${YNAB_ID}&redirect_uri=${YNAB_URI}&response_type=token`});
});
app.use('/api/accounts', accountRouter);
app.use('/api/budgets', budgetRouter);
app.use('/api/users', userRouter);

const server = process.env.NODE_ENV === 'production' ? app : https.createServer(serverOptions, app);

server.listen(app.get("port"), () => {
  console.log(`Find the server at: https://localhost:${app.get("port")}/`); // eslint-disable-line no-console
});