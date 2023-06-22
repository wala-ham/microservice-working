const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 9090 ;
const mongoose = require("mongoose");
const Order = require("./Order");
const amqp = require("amqplib");
const isAuthenticated = require("./isAuthenticated");
const kafka = require('kafka-node');
const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
const producer = kafka.producer();
const { Kafka } = require('kafkajs');


const consumerOptions = {
  groupId: 'my-consumer-group',
  autoCommit: true,
  autoCommitIntervalMs: 5000,
  sessionTimeout: 15000,
  fetchMaxBytes: 10 * 1024 * 1024, // 10 MB
  fromOffset: 'latest'
};

const topics = ['ORDER','PRODUCT'];
const consumer = new Consumer(client, topics, consumerOptions);
const kafka = new Kafka({
  clientId: 'my-producer',
  brokers: ['localhost:9092'],
});


var channel, connection;


// setup mongodb
mongoose.connect(
   "mongodb+srv://admin:admin@cluster0.9gcsd.mongodb.net/microservices-GSS",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    () => {
        console.log(`Order-Service DB Connected`);
    }
);
app.use(express.json());

function createOrder(products, userEmail) {
    let total = 0;
    for (let t = 0; t < products.length; ++t) {
        total += products[t].price;
    }
    const newOrder = new Order({
        products,
        user: userEmail,
        total_price: total,
    });
    newOrder.save();
    return newOrder;
}

/* async function connect() {
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER");
} */

    await consumer.connect();
    await consumer.subscribe({ topic: 'ORDER', fromBeginning: true });
  
    await consumer.run({
      eachMessage: async ({ topic, data }) => {
        console.log("Consuming ORDER service");
        const { products, userEmail } = JSON.parse(data.content);
        const newOrder = createOrder(products, userEmail);
       
        producer.connect();
        const message = { 
              value: JSON.stringify({ newOrder }),
            };
        producer.send({
              topic: 'PRODUCT',
              messages: [message],
            });
        producer.disconnect();
          
      },
    });
  
  

/* connect().then(() => {
    channel.consume("ORDER", (data) => {
        console.log("Consuming ORDER service");
        const { products, userEmail } = JSON.parse(data.content);
        const newOrder = createOrder(products, userEmail);
        channel.ack(data);
        channel.sendToQueue(
            "PRODUCT",
            Buffer.from(JSON.stringify({ newOrder }))
        );
    });
}); */

app.listen(PORT, () => {
    console.log(`Order-Service at ${PORT}`);
});
