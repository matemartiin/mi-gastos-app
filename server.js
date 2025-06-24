require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// Verificamos si está presente la API Key
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Falta la variable OPENAI_API_KEY en el archivo .env");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Sos una asistente financiera simpática que responde en español con consejos útiles y breves." },
        { role: "user", content: message }
      ]
    });

    const respuesta = chatResponse.choices[0]?.message?.content;
    res.json({ reply: respuesta || "No tengo una respuesta clara, ¿podés reformularlo?" });

  } catch (err) {
    console.error("❌ Error en la API de OpenAI:", err);
    res.status(500).json({ reply: "Ups, ocurrió un error en el servidor 😢" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor iniciado en http://localhost:${PORT}`);
});
