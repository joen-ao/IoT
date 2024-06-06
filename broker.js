const aedes = require("aedes")();
const net = require("net");
const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const mqttPort = 1883;
const httpPort = 3000;

const mongoUrl = "mongodb://localhost:27017"; // URL de conexión a MongoDB
const dbName = "mqttData"; // Nombre de la base de datos

let db;
let collection;

// Conectar a MongoDB
MongoClient.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then((client) => {
    console.log("Connected to MongoDB");
    db = client.db(dbName);
    collection = db.collection("messages");

    // Iniciar el servidor MQTT
    const server = net.createServer(aedes.handle);
    server.listen(mqttPort, function () {
      console.log("Aedes broker listening on port", mqttPort);
    });

    // Iniciar el servidor HTTP
    const app = express();
    app.use(cors());

    // Ruta para obtener el último dato
    app.get("/latest", async (req, res) => {
      try {
        const latestMessage = await collection
          .find()
          .sort({ _id: -1 })
          .limit(1)
          .toArray();
        res.json(latestMessage[0]);
      } catch (error) {
        console.error("Error fetching latest message:", error);
        res.status(500).send("Error fetching latest message");
      }
    });

    app.listen(httpPort, () => {
      console.log(`Server running on port ${httpPort}`);
    });
  })
  .catch((error) => console.error("Error connecting to MongoDB:", error));

aedes.on("client", function (client) {
  console.log("Client connected:", client.id);
});

aedes.on("publish", function (packet, client) {
  if (client) {
    const message = packet.payload.toString();
    console.log("Message received from client:", message);

    // Guardar el mensaje en MongoDB
    try {
      const messageData = JSON.parse(message);
      collection
        .insertOne(messageData)
        .then((result) =>
          console.log("Message saved to MongoDB:", result.insertedId)
        )
        .catch((error) =>
          console.error("Error saving message to MongoDB:", error)
        );
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  }
});
