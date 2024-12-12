import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import listEndpoints from "express-list-endpoints";

// MongoDB Connection
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/avocadoSalesDB";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Check connection status
mongoose.connection.on("connected", () => {
  console.log("MongoDB connected successfully!");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

// Define Mongoose schema and model
const AvocadoSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, 
  date: { type: String, required: true },
  region: { type: String, required: true },
  averagePrice: { type: Number, required: true },
  totalVolume: { type: Number, required: true },
  smallBags: { type: Number, required: true },
  largeBags: { type: Number, required: true },
  xLargeBags: { type: Number, required: true },
});

const Avocado = mongoose.model("Avocado", AvocadoSchema);

// Server setup
const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Seed database (optional)
if (process.env.RESET_DB) {
  const avocadoSalesData = require("./data/avocado-sales.json");
  const seedDatabase = async () => {
    try {
      await Avocado.deleteMany(); // Clear the collection
      await Avocado.insertMany(avocadoSalesData); // Populate with sample data
      console.log("Database seeded successfully!");
    } catch (err) {
      console.error("Failed to seed database:", err);
    }
  };
  seedDatabase();
}

// API Endpoints

// API Documentation
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Avocado Sales API!",
    documentation: listEndpoints(app),
  });
});

// Get all avocado sales data with optional filters
app.get("/avocadoSalesData", async (req, res) => {
  const { date, region } = req.query;

  const query = {};
  if (date) query.date = date;
  if (region) query.region = region;

  try {
    const avocados = await Avocado.find(query);
    if (avocados.length > 0) {
      res.status(200).json(avocados);
    } else {
      res.status(404).json({ error: "No avocado sales data found for the given filters" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve data", details: err.message });
  }
});

// Get a single avocado sale by ID
app.get("/avocadoSalesData/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const avocado = await Avocado.findOne({ id: Number(id) });
    if (avocado) {
      res.status(200).json(avocado);
    } else {
      res.status(404).json({ error: `No avocado sales data found for ID: ${id}` });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve data", details: err.message });
  }
});

// Create a new avocado sale entry
app.post("/avocadoSalesData", async (req, res) => {
  const { id, date, region, averagePrice, totalVolume, smallBags, largeBags, xLargeBags } = req.body;

  // Basic validation
  if (!id || !date || !region || !averagePrice || !totalVolume || !smallBags || !largeBags || !xLargeBags) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const newAvocado = new Avocado({
      id,
      date,
      region,
      averagePrice,
      totalVolume,
      smallBags,
      largeBags,
      xLargeBags,
    });
    const savedAvocado = await newAvocado.save();
    res.status(201).json(savedAvocado);
  } catch (err) {
    // Handle duplicate ID error
    if (err.code === 11000) {
      res.status(409).json({ error: "Duplicate ID: An entry with this ID already exists" });
    } else {
      res.status(400).json({ error: "Failed to create avocado sale entry", details: err.message });
    }
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
