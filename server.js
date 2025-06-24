require('dotenv').config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const USERS_FILE = "usuarios.json";

// Verificamos si está presente la API Key de Gemini
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Falta la variable GEMINI_API_KEY en el archivo .env");
  process.exit(1);
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ----------- FUNCIONES AUXILIARES PARA USUARIOS -----------
// Cargar usuarios desde archivo o crear vacío
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return {};
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

// Guardar usuarios
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ----------- ENDPOINT DE REGISTRO -----------
app.post("/api/register", (req, res) => {
  const { user, pass } = req.body;
  if (!user || !pass) {
    return res.json({ ok: false, error: "Ingresá usuario y contraseña." });
  }
  const users = loadUsers();
  if (users[user]) {
    return res.json({ ok: false, error: "Ese usuario ya existe." });
  }
  users[user] = { pass }; // En producción, usá un hash, aquí es solo a modo educativo
  saveUsers(users);
  res.json({ ok: true });
});

// ----------- ENDPOINT DE LOGIN -----------
app.post("/api/login", (req, res) => {
  const { user, pass } = req.body;
  const users = loadUsers();
  if (users[user] && users[user].pass === pass) {
    res.json({ ok: true });
  } else {
    res.json({ ok: false, error: "Usuario o contraseña incorrectos." });
  }
});

// ----------- ENDPOINT DE CHAT (Gemini) -----------
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
          parts: [
            {
              // Instrucción + mensaje juntos, en UN SÓLO "part"
              text:
                "Sos un robotito simpático que responde sobre finanzas personales. Respondé en español, usando un máximo de 100 palabras. Respondé la siguiente consulta del usuario:\n\n" +
                message
            }
          ]
        }
      ]
    }),
  }
);


    if (!geminiRes.ok) {
      let msg = `Gemini API error: ${geminiRes.statusText}`;
      if (geminiRes.status === 429) {
        msg = "¡Hiciste demasiadas consultas! Esperá un minuto y volvé a intentarlo.";
      }
      console.error("❌ Error de Gemini API:", geminiRes.status, geminiRes.statusText);
      return res.status(500).json({ reply: msg });
    }

    const data = await geminiRes.json();


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
