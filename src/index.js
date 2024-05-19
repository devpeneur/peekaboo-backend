const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const { Kafka } = require("kafkajs");
const { v4: uuidv4 } = require('uuid');

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



async function consumeMessagesFromKafka() {
  const groupId = `peekaboo-${uuidv4()}`; 
  const consumer = kafka.consumer({ groupId: groupId });
  const consumedMessages = [];

  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'peekaboo', fromBeginning: true });

    await new Promise((resolve, reject) => {
      consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const parsedMessage = JSON.parse(message.value.toString());
          consumedMessages.push(parsedMessage);
          console.log({
            value: message.value.toString(),
          });
        },
      }).catch(error => {
        reject(error);
      });

      setTimeout(() => {resolve()}, 5000); // Wait for 5 seconds to consume messages
    });

  } catch (error) {
    console.error('Error occurred while consuming messages from Kafka:', error.message);
    return { error: error.message };
  } finally {
    await consumer.disconnect();
  }

  return consumedMessages;
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
    const result = await consumeMessagesFromKafka();
    res.json({ message: result });
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
