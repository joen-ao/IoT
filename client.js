const mqtt = require("mqtt");
const axios = require("axios");

const mqttBrokerUrl = "mqtt://localhost:1883"; // URL del broker MQTT
const httpApiUrl = "http://localhost:3000/latest"; // URL de la API HTTP

// Conectar al broker MQTT
const client = mqtt.connect(mqttBrokerUrl);

client.on("connect", () => {
  console.log("Connected to MQTT broker");

  // Suscribirse a un tópico
  const topic = "some/topic";
  client.subscribe(topic, (err) => {
    if (err) {
      console.error("Error subscribing to topic:", err);
    } else {
      console.log(`Subscribed to topic '${topic}'`);
    }
  });

  // Publicar un mensaje al tópico
  const message = JSON.stringify({ request: "fetch_latest" });
  client.publish(topic, message, (err) => {
    if (err) {
      console.error("Error publishing message:", err);
    } else {
      console.log(`Message published to topic '${topic}'`);
    }
  });
});

client.on("message", (topic, message) => {
  console.log(`Message received from topic '${topic}': ${message.toString()}`);
  // Aquí puedes manejar los mensajes recibidos si es necesario
});

// Solicitar el archivo desde la API HTTP
axios
  .get(httpApiUrl)
  .then((response) => {
    console.log("Latest message from database:", response.data);
  })
  .catch((error) => {
    console.error("Error fetching latest message from database:", error);
  });
