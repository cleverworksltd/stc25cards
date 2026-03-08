import express from "express";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/maps/static", async (req, res) => {
    try {
      const { lat, lng, zoom, maptype } = req.query;
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "GOOGLE_MAPS_API_KEY is not configured" });
      }

      if (!lat || !lng) {
        return res.status(400).json({ error: "Missing lat or lng" });
      }

      const z = zoom || "20";
      const mt = maptype || "satellite";
      
      const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${z}&size=600x600&maptype=${mt}&key=${apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Maps API responded with ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      res.set('Content-Type', 'image/png');
      res.send(buffer);
    } catch (error) {
      console.error("Error fetching static map:", error);
      res.status(500).json({ error: "Failed to fetch map" });
    }
  });

  app.get("/api/maps/geocode", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "GOOGLE_MAPS_API_KEY is not configured" });
      }

      if (!lat || !lng) {
        return res.status(400).json({ error: "Missing lat or lng" });
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === "OK" && data.results.length > 0) {
        res.json({ address: data.results[0].formatted_address });
      } else {
        res.status(404).json({ error: "Address not found" });
      }
    } catch (error) {
      console.error("Error fetching geocode:", error);
      res.status(500).json({ error: "Failed to fetch geocode" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
