// src/index.js

const express = require('express')
const mongoose = require('mongoose')

const app = express();
const port = 3000;

app.use(express.text());

mongoose.connect('mongodb+srv://user_21:BEfLvt7PU6M7KYnl@devpeneur.jewzg1a.mongodb.net/?retryWrites=true&w=majority&appName=devpeneur');

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.log('Failed to connect to MongoDB', err);
});

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const ApiLatency = require('./models/ApiLatency');
const UserActivity = require('./models/UserActivity');
const Admin = require('./models/Admin');
const LoginAuth = require('./models/LoginAuth');
const Domain = require('./models/Domain');

app.use(bodyParser.json());

// Middleware to validate domainId
const validateDomain = async (req, res, next) => {
  const { domainId } = req.params;
  const domain = await Domain.findById(domainId);
  if (!domain) {
    return res.status(404).send('Domain not found');
  }
  next();
};

// API to get current latency details
app.get('/api/:domainId/latency', validateDomain, async (req, res) => {
  const { domainId } = req.params;
  const currentLatency = await ApiLatency.findOne({ domainId }).sort({ timestamp: -1 });
  res.json(currentLatency);
});

// API to get current active users
app.get('/api/:domainId/users/active', validateDomain, async (req, res) => {
  const { domainId } = req.params;
  const activeUsers = await UserActivity.find({ domainId, active: true });
  res.json(activeUsers);
});

// API to get users served cached version
app.get('/api/:domainId/users/cached', validateDomain, async (req, res) => {
  const { domainId } = req.params;
  const cachedUsers = await UserActivity.find({ domainId, servedCachedVersion: true });
  res.json(cachedUsers);
});

// API to get users served fallback version
app.get('/api/:domainId/users/fallback', validateDomain, async (req, res) => {
  const { domainId } = req.params;
  const fallbackUsers = await UserActivity.find({ domainId, servedFallbackVersion: true });
  res.json(fallbackUsers);
});

// API to get users transferred to the client
app.get('/api/:domainId/users/transferred', validateDomain, async (req, res) => {
  const { domainId } = req.params;
  const transferredUsers = await UserActivity.find({ domainId, transferredToClient: true });
  res.json(transferredUsers);
});

// API to list user IDs
app.get('/api/:domainId/users/ids', validateDomain, async (req, res) => {
  const { domainId } = req.params;
  const users = await UserActivity.find({ domainId }).select('userId');
  res.json(users.map(user => user.userId));
});

// API to get admin details
app.get('/api/:domainId/admin/:adminId', validateDomain, async (req, res) => {
  const { domainId, adminId } = req.params;
  const admin = await Admin.findOne({ domainId, adminId });
  res.json(admin);
});

// API for user login authentication
app.post('/api/:domainId/login', validateDomain, async (req, res) => {
  const { domainId } = req.params;
  const { userId, password } = req.body;
  const user = await LoginAuth.findOne({ domainId, userId });
  if (user && bcrypt.compareSync(password, user.passwordHash)) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// API to get past one month user activity data
app.get('/api/:domainId/users/activity/month', validateDomain, async (req, res) => {
  const { domainId } = req.params;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const userActivity = await UserActivity.find({ domainId, timestamp: { $gte: oneMonthAgo } });
  res.json(userActivity);
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

// - healthy api latency / p95
// - current api latency 
// - current active users
// - current users who landed cached version
// - current user who landed on the fallback version (our loader / gamified solution)
// - how many people were transferred from our loading state back to the client
// - list of user ids that we can show to the user
// - user ki details - admin ki details / api key / api key
// - login auth for user
// - past one month of data in which we have the details of all the past incoming users,
// the ones who got served stale version, the ones who got served our solutions and the ones which converted from this loading solution