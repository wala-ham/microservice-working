const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 8080;
const mongoose = require("mongoose");
const Product = require("./Product");
const jwt = require("jsonwebtoken");
const amqp = require("amqplib");
const isAuthenticated = require("./isAuthenticated");
const kafka = require('kafka-node');
const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
const producer = kafka.producer();
const { Kafka } = require('kafkajs');

const topics = ['ORDER', 'PRODUCT'];
const consumer = new Consumer(client, topics, consumerOptions);
const kafka = new Kafka({
    clientId: 'my-producer',
    brokers: ['localhost:9092'],
});


var order;

var channel, connection;

app.use(express.json());
mongoose.connect(
    "mongodb+srv://admin:admin@cluster0.9gcsd.mongodb.net/microservices-GSS",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    () => {
        console.log(`Product-Service DB Connected`);
    }
);

/* async function connect() {
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PRODUCT");
}
connect(); */

app.post("/product/buy", isAuthenticated, async (req, res) => {
    const { ids } = req.body;
    const products = await Product.find({ _id: { $in: ids } });
    producer.connect();
    const message = {
        value: JSON.stringify({
            products,
            userEmail: req.user.email,
        }),
    };
    producer.send({
        topic: 'ORDER',
        messages: [message],
    });
    //producer.disconnect();

    consumer.connect();
    consumer.subscribe({ topic: 'PRODUCT', fromBeginning: true });
    consumer.run({
        eachMessage: async ({ topic, data }) => {
            order = JSON.parse(data.content);
        },
    });
    return res.json(order);

});



app.post("/product/create", isAuthenticated, async (req, res) => {
    const { name, description, price } = req.body;
    const newProduct = new Product({
        name,
        description,
        price,
    });
    newProduct.save();
    return res.json(newProduct);
});


app.listen(PORT, () => {
    console.log(`Product-Service at ${PORT}`);
});
