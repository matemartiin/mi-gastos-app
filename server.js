require('dotenv').config();
const express = require("express");
const cors = require("cors");


const app = express();
app.use(cors());
app.use(express.json());

// Verificamos si está presente la API Key
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Falta la variable GEMINI_API_KEY en el archivo .env");
  process.exit(1);
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const geminiRes = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: message }]
        }
      ]
    }),
  }
);


    if (!geminiRes.ok) {
      console.error("❌ Error de Gemini API:", geminiRes.status, geminiRes.statusText);
      return res.status(500).json({ reply: `Gemini API error: ${geminiRes.statusText}` });
    }

    const data = await geminiRes.json();

    // La respuesta de Gemini puede venir en candidates[0].content.parts[0].text
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No tengo una respuesta clara, ¿podés reformularlo?";

    res.json({ reply });
  } catch (err) {
    console.error("❌ Error en la API de Gemini:", err);
    res.status(500).json({ reply: "Ups, ocurrió un error en el servidor 😢" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor iniciado en http://localhost:${PORT}`);
});
