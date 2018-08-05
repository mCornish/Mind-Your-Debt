import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

import accountRouter from './routes/accountRouter';

const MONGO_URI = process.env.MONGO_URI;
console.log('​MONGO_URI', MONGO_URI);
const db = mongoose.connect(MONGO_URI, { useNewUrlParser: true });

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("port", process.env.PORT || 3001);

// Express only serves static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

app.use('/api/accounts', accountRouter);

app.listen(app.get("port"), () => {
  console.log(`Find the server at: http://localhost:${app.get("port")}/`); // eslint-disable-line no-console
});