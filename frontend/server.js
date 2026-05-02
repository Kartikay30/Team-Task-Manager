// Production server — serves the built Vite app on Railway
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 4173;
const dist = join(__dirname, "dist");

// Serve static built files
app.use(express.static(dist));

// Handle React Router — send all routes to index.html
app.use((req, res) => {
  res.sendFile(join(dist, "index.html"));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Frontend serving on port ${PORT}`);
});
