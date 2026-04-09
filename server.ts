
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";

import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase initialization
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("WARNING: Supabase URL or Anon Key is missing. Database features will fail.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Multer configuration for file uploads
const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  app.use(express.json());
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Alderys Server is running" });
  });

  // Leaderboard routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ error: "Supabase configuration is missing." });
      }

      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order("score", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Supabase fetch error:", error);
        return res.status(500).json({ error: `Database error: ${error.message}` });
      }
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error.message);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  app.post("/api/leaderboard", async (req, res) => {
    try {
      const { name, score } = req.body;
      if (!name || score === undefined) {
        return res.status(400).json({ error: "Name and score are required" });
      }

      const { data, error } = await supabase
        .from("leaderboard")
        .insert([{ id: crypto.randomUUID(), name, score }])
        .select();

      if (error) throw error;
      res.json(data[0]);
    } catch (error: any) {
      console.error("Error saving score:", error.message);
      res.status(500).json({ error: "Failed to save score" });
    }
  });

  // Game state persistence
  app.post("/api/games/save", async (req, res) => {
    try {
      const { playerName, state } = req.body;
      const { data, error } = await supabase
        .from("games")
        .insert([{ id: crypto.randomUUID(), player_name: playerName, state }])
        .select();

      if (error) throw error;
      res.json(data[0]);
    } catch (error: any) {
      console.error("Error saving game:", error.message);
      res.status(500).json({ error: "Failed to save game" });
    }
  });

  app.post("/api/games/autosave", async (req, res) => {
    try {
      const { playerName, state } = req.body;
      
      // Try to find an existing autosave for this player
      const { data: existingGames, error: fetchError } = await supabase
        .from("games")
        .select("id")
        .eq("player_name", `${playerName} (Autosave)`)
        .limit(1);

      if (fetchError) throw fetchError;

      if (existingGames && existingGames.length > 0) {
        // Update existing autosave
        const { data, error } = await supabase
          .from("games")
          .update({ state, created_at: new Date().toISOString() })
          .eq("id", existingGames[0].id)
          .select();
        if (error) throw error;
        res.json(data[0]);
      } else {
        // Create new autosave
        const { data, error } = await supabase
          .from("games")
          .insert([{ id: crypto.randomUUID(), player_name: `${playerName} (Autosave)`, state }])
          .select();
        if (error) throw error;
        res.json(data[0]);
      }
    } catch (error: any) {
      console.error("Error autosaving game:", error.message);
      res.status(500).json({ error: "Failed to autosave game" });
    }
  });

  app.get("/api/games", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("id, player_name, created_at, state")
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching games:", error.message);
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error("Error loading game:", error.message);
      res.status(500).json({ error: "Failed to load game" });
    }
  });

  // Asset Management routes
  app.get("/api/assets", async (req, res) => {
    try {
      if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ error: "Supabase configuration is missing." });
      }

      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase fetch error:", error);
        return res.status(500).json({ error: `Database error: ${error.message}` });
      }
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching assets:", error.message);
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  app.post("/api/assets/register", async (req, res) => {
    try {
      const { name, url, category } = req.body;
      if (!url || !category) {
        return res.status(400).json({ error: "URL and category are required" });
      }

      if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ error: "Supabase configuration is missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in settings." });
      }

      const { data, error } = await supabase
        .from("assets")
        .insert([{ 
          id: crypto.randomUUID(),
          name: name || "Unnamed Asset", 
          url, 
          category,
          storage_path: "manual-entry"
        }])
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        return res.status(500).json({ error: `Database error: ${error.message}` });
      }
      res.json(data[0]);
    } catch (error: any) {
      console.error("Error registering asset:", error.message);
      res.status(500).json({ error: `Failed to register asset: ${error.message}` });
    }
  });

  app.post("/api/assets/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { name, category } = req.body;
      const file = req.file;
      const fileExt = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExt}`;
      const filePath = `game-assets/${fileName}`;

      // 1. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("alderys-assets")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("alderys-assets")
        .getPublicUrl(filePath);

      // 3. Save metadata to database
      const { data: dbData, error: dbError } = await supabase
        .from("assets")
        .insert([{ 
          id: crypto.randomUUID(),
          name: name || file.originalname, 
          url: publicUrl, 
          category: category || "other",
          storage_path: filePath
        }])
        .select();

      if (dbError) throw dbError;

      res.json(dbData[0]);
    } catch (error: any) {
      console.error("Error uploading asset:", error.message);
      res.status(500).json({ error: "Failed to upload asset" });
    }
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-game", (gameId) => {
      socket.join(gameId);
      console.log(`User ${socket.id} joined game ${gameId}`);
    });

    socket.on("game-state-update", (data) => {
      // Broadcast game state to others in the same room
      socket.to(data.gameId).emit("game-state-sync", data.state);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
