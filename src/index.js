const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const { Kafka } = require("kafkajs");

const app = express();
const port = 5000;

// Middleware setup
app.use(express.text());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb+srv://user_21:BEfLvt7PU6M7KYnl@devpeneur.jewzg1a.mongodb.net/?retryWrites=true&w=majority&appName=devpeneur', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.log('Failed to connect to MongoDB', err);
});

// Kafka Implementation
const kafka = new Kafka({
  clientId: "peekaboo",
  brokers: ["3.111.188.73:9092"],
});

const producer = kafka.producer();

// Import models
const LoginAuth = require('../models/login-auth');
const Domain = require('../models/domain');

// Middleware to validate domainId
const validateDomain = async (req, res, next) => {
  const { domainId } = req.params;
  const domain = await Domain.findById(domainId);
  if (!domain) {
    return res.status(404).send('Domain not found');
  }
  next();
};

async function sendMessageToKafka(urlclienturl, clientmethod, clientduration, userIds, domainId) {
  try {
    // Connect to Kafka broker
    await producer.connect();

    // Send message to Kafka topic
    await producer.send({
      topic: 'peekaboo',
      messages: [{ value:JSON.stringify({ urlclienturl, clientmethod, clientduration, userIds, domainId}) }],
    });

    console.log('Message sent successfully to Kafka');

    // Disconnect from Kafka broker
    await producer.disconnect();
  } catch (error) {
    console.error('Error occurred while sending message to Kafka:', error.message);
    // Optionally handle the error here (e.g., retry logic, logging)
  }
}

const consumer = kafka.consumer({ groupId: 'peekaboo' });

async function consumeMessagesFromKafka() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'peekaboo', fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log({
          key: message.key.toString(),
          value: message.value.toString(),
          headers: message.headers,
        });
      },
    });
  } catch (error) {
    console.error('Error occurred while consuming messages from Kafka:', error.message);
  }
}

// API routes

app.post('/api/fetch-user-ids', async (req, res) => {
  const { clienturl,clientmethod,clientduration,userIds,sdk_key } = req.body;
  if (!userIds) {
    return res.status(400).json({ error: 'User IDs not provided' });
  }
  sendMessageToKafka(clienturl,clientmethod,clientduration,userIds,sdk_key)
  res.json({ clienturl,clientmethod,clientduration,userIds,sdk_key});
});

// API endpoint to fetch data from Kafka consumer
app.get('/api/fetch-kafka-data', async (req, res) => {
  try {
    consumeMessagesFromKafka();
    res.json({ message: 'Data fetched from Kafka consumer' });
  } catch (error) {
    console.error('Error occurred while fetching data from Kafka consumer:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


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


// Start the server
app.listen(port, () => {
  console.log(`Server is listening on ${port}`);
});
