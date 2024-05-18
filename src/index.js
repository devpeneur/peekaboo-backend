// src/index.js

const express = require('express')
const mongoose = require('mongoose')

const app = express();
const port = 3000;

app.use(express.text());

mongoose.connect('mongodb://localhost:27017/apiKeyManagement');

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.log('Failed to connect to MongoDB', err);
});

app.listen(port, () => {
  console.log(`server is listening on ${port}`);
});

// Homepage
app.get('/', (req, res) => {
  res.status(200).send("Hello World!");
});

// GET
app.get('/get', (req, res) => {
  res.status(200).header("x-get-header", "get-header-value").send("get-response-from-compute");
});

//POST
app.post('/post', (req, res) => {
  res.status(200).header("x-post-header", "post-header-value").send(req.body.toString());
});
