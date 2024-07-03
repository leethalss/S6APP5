const express = require('express');
const bodyParser = require('body-parser');
const mqtt = require('mqtt');

const app = express();
const port = 3001;

const host = 'mqtt://localhost:1883'; // Remplacez par l'adresse de votre serveur Mosquitto
const topic = 'entre/sortie'; // Remplacez par votre topic

// Connexion au serveur MQTT
const client = mqtt.connect(host);

let messages = [];

app.use(bodyParser.json());

app.post('/Relai', (req, res) => {
    const message = req.body;
    console.log(`Message reçu : ${JSON.stringify(message)}`);
    res.send('Message reçu');

    client.publish(topic, JSON.stringify(message));
});

app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
