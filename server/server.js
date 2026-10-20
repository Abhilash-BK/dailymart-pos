
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Product database schema
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    unit: { type: String, required: true },
    price: { type: Number, required: true, min: 0.01 },
    stock: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 1 }, { unique: true });

const Product = mongoose.model("Product", productSchema);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "DailyMart POS API is running" });
});

// Get all products
app.get("/api/products", async (req, res, next) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// Add a product
app.post("/api/products", async (req, res, next) => {
  try {
    const { name, category, unit, price, stock } = req.body;

    if (!name?.trim() || !category || !unit) {
      return res.status(400).json({
        message: "Name, category, and unit are required.",
      });
    }

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        message: "Price must be greater than zero.",
      });
    }

    if (!Number.isSafeInteger(stock) || stock < 0) {
      return res.status(400).json({
        message: "Stock must be a whole number of zero or more.",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      category,
      unit,
      price,
      stock,
    });

    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A product with this name already exists.",
      });
    }
    next(error);
  }
});

// Update a product
app.put("/api/products/:id", async (req, res, next) => {
  try {
    const updates = {};
    const allowedFields = ["name", "category", "unit", "price", "stock"];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty." });
      }
      updates.name = updates.name.trim();
    }

    if (updates.price !== undefined &&
        (!Number.isFinite(updates.price) || updates.price <= 0)) {
      return res.status(400).json({ message: "Invalid price." });
    }

    if (updates.stock !== undefined &&
        (!Number.isSafeInteger(updates.stock) || updates.stock < 0)) {
      return res.status(400).json({ message: "Invalid stock quantity." });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A product with this name already exists.",
      });
    }
    next(error);
  }
});

// Delete a product
app.delete("/api/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json({ message: "Product deleted successfully." });
  } catch (error) {
    next(error);
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error(error.message);

  if (error.name === "ValidationError" ||
      error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }

  res.status(500).json({ message: "Internal server error." });
});

// Connect to MongoDB, then start the API
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from server/.env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas");

    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      console.log(`DailyMart API running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
