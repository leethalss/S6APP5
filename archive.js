const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const mqtt = require('mqtt');
const path = require('path');

// Connexion à la base de données SQLite
const db = new sqlite3.Database(':memory:');

// Initialisation de la base de données
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS archives (
      id TEXT,
      time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      type TEXT
    )
  `);
});

// Connexion au serveur Mosquitto MQTT
const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  console.log('Connected to MQTT server');
  client.subscribe('Entre/Sortie', (err) => {
    if (err) {
      console.error('Subscription error:', err);
    }
  });
});

client.on('message', (topic, message) => {
  const id = message.toString();
  processMessage(id);
});

function processMessage(id) {
  db.serialize(() => {
    db.get('SELECT COUNT(*) AS count FROM archives WHERE id = ?', [id], (err, row) => {
      if (err) {
        return console.error('Error querying the database:', err);
      }

      const count = row.count;
      const type = (count % 2 === 0) ? 'Entrée' : 'Sortie';
      const timestamp = new Date().toISOString();

      db.run('INSERT INTO archives (id, time, type) VALUES (?, ?, ?)', [id, timestamp, type], (err) => {
        if (err) {
          return console.error('Error inserting into the database:', err);
        }
        console.log(`Inserted into database: id=${id}, time=${timestamp}, type=${type}`);
      });
    });
  });
}

// Création du serveur web
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.text()); // Pour gérer le type de contenu text/plain

app.get('/', (req, res) => {
  db.all('SELECT * FROM archives', [], (err, rows) => {
    if (err) {
      return console.error('Error querying the database:', err);
    }
    res.render('index', { archives: rows });
  });
});

app.post('/UI', (req, res) => {
  const message = req.body;
  console.log('Message reçu:', message);
  res.send(`Message reçu: ${message}`);
});

app.listen(4000, () => {
  console.log('Web server running on http://localhost:4000');
});

process.on('exit', () => {
  db.close();
});
