const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = 3000;
const esp32IP = '192.168.137.89';

app.use(bodyParser.text());

app.post('/UI', async (req, res) => {
  const message = req.body;
  console.log(`Bouton reçu : ${message}`);
  res.send('Message reçu');

  try {
    const response = await axios.get(`http://${esp32IP}/LED`);
    console.log(`Réponse de l'ESP32 : ${response.data}`);
  } catch (error) {
    console.error(`Erreur lors de l'envoi du signal à l'ESP32 : ${error}`);
    res.status(500).send('Erreur lors de l\'envoi du signal');
  }
})

app.post('/UUID', (req, res) => {
    const message = req.body;
    console.log(`Message reçu : ${message}`);
    res.send('Message reçu');

    // Faire une requête POST à l'autre service
    (async () => {
        const fetch = await import('node-fetch').then(mod => mod.default);
        
        fetch("http://localhost:3001/Relai", {
          method: "POST",
          body: JSON.stringify({ data: message }),
          headers: {
            "Content-Type": "application/json; charset=UTF-8"
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Erreur lors de l\'envoi de la requête');
          }
          
          // Vérifier si le type de contenu est JSON
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return response.json();
          } else {
            // Si le type de contenu n'est pas JSON, renvoyer une réponse vide
            return response.text().then(text => {
              if (text) {
                console.log('Réponse du serveur:', text);
              } else {
                console.log('Réponse du serveur: No content');
              }
              return null;
            });
          }
        })
        .then(json => {
          if (json) {
            console.log('Réponse du serveur:', json);
          }
        })
        .catch(err => console.error('Erreur:', err));
    })();
});

app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
