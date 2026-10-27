const authRoutes = require("./routes/auth");
const authenticateToken = require("./middleware/authenticateToken");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", authenticateToken);
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


const saleSchema = new mongoose.Schema(
  //this line create separates mongodb collection form sales
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        unit: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0.01 },
        lineTotal: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Card"],
      required: true,
    },
  },
  { timestamps: true }
);

const Sale = mongoose.model("Sale", saleSchema);


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
  
const mongooseObjectId = mongoose.Types.ObjectId;

// Complete checkout and save sale
app.post("/api/sales", async (req, res, next) => {
  const { items, discount = 0, paymentMethod } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "The cart must contain at least one item.",
    });
  }

  if (!["Cash", "UPI", "Card"].includes(paymentMethod)) {
    return res.status(400).json({
      message: "Select Cash, UPI, or Card as payment method.",
    });
  }

  if (
    !Number.isFinite(discount) ||
    discount < 0
  ) {
    return res.status(400).json({
      message: "Discount must be zero or greater.",
    });
  }

  // Validate and combine duplicate product IDs.
  const quantities = new Map();

  for (const item of items) {
    if (
      !item.productId ||
      !mongooseObjectId.isValid(item.productId) ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return res.status(400).json({
        message: "Each cart item needs a valid product ID and quantity.",
      });
    }

    const id = String(item.productId);
    quantities.set(id, (quantities.get(id) || 0) + item.quantity);
  }

  const session = await mongoose.startSession();

  try {
    let savedSale;

    await session.withTransaction(async () => {
      const saleItems = [];
      let subtotal = 0;

      for (const [productId, quantity] of quantities) {
        const product = await Product.findById(productId).session(session);

        if (!product) {
          throw new Error(`Product ${productId} was not found.`);
        }

        if (product.stock < quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${product.stock}.`
          );
        }

        const lineTotal = Math.round(
          product.price * quantity * 100
        ) / 100;

        subtotal += lineTotal;

        saleItems.push({
          productId: product._id,
          name: product.name,
          unit: product.unit,
          quantity,
          price: product.price,
          lineTotal,
        });
      }

      subtotal = Math.round(subtotal * 100) / 100;

      if (discount > subtotal) {
        throw new Error("Discount cannot exceed the subtotal.");
      }

      const total = Math.round((subtotal - discount) * 100) / 100;

      // Decrement stock only if enough stock remains.
      for (const item of saleItems) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedProduct) {
          throw new Error(
            `Stock changed during checkout for ${item.name}. Please try again.`
          );
        }
      }

      const receiptNumber =
        `DM-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      const created = await Sale.create(
        [
          {
            receiptNumber,
            items: saleItems,
            subtotal,
            discount,
            total,
            paymentMethod,
          },
        ],
        { session }
      );

      savedSale = created[0];
    });

    res.status(201).json(savedSale);
  } catch (error) {
    if (
      error.message.startsWith("Product ") ||
      error.message.startsWith("Insufficient stock") ||
      error.message.startsWith("Discount cannot") ||
      error.message.startsWith("Stock changed")
    ) {
      return res.status(400).json({ message: error.message });
    }

    next(error);
  } finally {
    await session.endSession();
  }
});

// Get sales history
app.get("/api/sales", async (req, res, next) => {
  try {
    const sales = await Sale.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(sales);
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
