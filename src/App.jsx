
import { useMemo, useState } from "react";
import {
  ShoppingBasket,
  LayoutDashboard,
  Package,
  Receipt,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Boxes,
  AlertTriangle,
  IndianRupee,
  Menu,
} from "lucide-react";
import "./App.css";

const starterProducts = [
  { id: 1, name: "Basmati Rice", category: "Groceries", unit: "kg", price: 120, stock: 25 },
  { id: 2, name: "Toor Dal", category: "Groceries", unit: "kg", price: 145, stock: 18 },
  { id: 3, name: "Cooking Oil", category: "Groceries", unit: "litre", price: 160, stock: 15 },
  { id: 4, name: "Milk", category: "Dairy", unit: "packet", price: 30, stock: 40 },
  { id: 5, name: "Bread", category: "Bakery", unit: "piece", price: 40, stock: 12 },
  { id: 6, name: "Bath Soap", category: "Personal Care", unit: "piece", price: 38, stock: 20 },
  { id: 7, name: "Biscuits", category: "Snacks", unit: "packet", price: 20, stock: 35 },
  { id: 8, name: "Dishwash Liquid", category: "Household", unit: "bottle", price: 95, stock: 8 },
];

const categories = [
  "All Categories",
  "Groceries",
  "Dairy",
  "Bakery",
  "Snacks",
  "Personal Care",
  "Household",
  "Beverages",
  "Other",
];

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const emptyForm = {
  name: "",
  category: "Groceries",
  unit: "piece",
  price: "",
  stock: "",
};

export default function App() {
  const [products, setProducts] = useState(starterProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [activePage, setActivePage] = useState("Inventory");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory =
          category === "All Categories" || product.category === category;
        return matchesSearch && matchesCategory;
      }),
    [products, search, category]
  );

  const totalUnits = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStock = products.filter(
    (product) => product.stock <= 10
  ).length;
  const inventoryValue = products.reduce(
    (sum, product) => sum + product.price * product.stock,
    0
  );

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function openEditForm(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      price: String(product.price),
      stock: String(product.stock),
    });
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name) {
      setError("Please enter a product name.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError("Price must be greater than zero.");
      return;
    }

    if (!Number.isSafeInteger(stock) || stock < 0) {
      setError("Stock must be a whole number of zero or more.");
      return;
    }

    const duplicate = products.some(
      (product) =>
        product.name.trim().toLowerCase() === name.toLowerCase() &&
        product.id !== editingId
    );

    if (duplicate) {
      setError("A product with this name already exists.");
      return;
    }

    const productData = {
      id: editingId ?? Date.now(),
      name,
      category: form.category,
      unit: form.unit,
      price,
      stock,
    };

    if (editingId !== null) {
      setProducts((current) =>
        current.map((product) =>
          product.id === editingId ? productData : product
        )
      );
      setSuccess("Product updated successfully.");
    } else {
      setProducts((current) => [...current, productData]);
      setSuccess("Product added successfully.");
    }

    setForm(emptyForm);
    setFormOpen(false);
    setEditingId(null);
  }

  function deleteProduct(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}" from the inventory?`
    );

    if (!confirmed) return;

    setProducts((current) =>
      current.filter((item) => item.id !== product.id)
    );
    setSuccess(`${product.name} deleted successfully.`);
    setError("");
  }

  function changePage(page) {
    setActivePage(page);
    setSuccess("");
    setError("");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShoppingBasket size={23} />
          </div>
          <div>
            <strong>DailyMart</strong>
            <span>STORE MANAGEMENT</span>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        {[
          { label: "Dashboard", icon: LayoutDashboard },
          { label: "Billing", icon: Receipt },
          { label: "Inventory", icon: Package },
        ].map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${activePage === label ? "active" : ""}`}
            onClick={() => changePage(label)}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="store-status">
            <span className="status-dot" />
            Store open
          </div>
          <div className="user-profile">
            <div className="avatar">DM</div>
            <div>
              <strong>Store Admin</strong>
              <span>Administrator</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand">
            <Menu size={21} />
            DailyMart
          </div>
          <div className="breadcrumb">
            Workspace <span>/</span> {activePage}
          </div>
          <div className="topbar-right">
            <span className="live-dot" />
            POS Terminal <span className="terminal-tag">01</span>
          </div>
        </header>

        {activePage === "Inventory" && (
          <>
            <section className="page-heading">
              <div>
                <p className="eyebrow">STOCK MANAGEMENT</p>
                <h1>Product inventory</h1>
                <p className="muted">
                  Manage your grocery and daily-use products.
                </p>
              </div>
              <button className="primary-button" onClick={openAddForm}>
                <Plus size={17} /> Add product
              </button>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><Package size={20} /></div>
                <span>Total products</span>
                <strong>{products.length}</strong>
                <small>Unique products</small>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><Boxes size={20} /></div>
                <span>Total stock units</span>
                <strong>{totalUnits}</strong>
                <small>Across all products</small>
              </div>
              <div className="stat-card">
                <div className="stat-icon warning"><AlertTriangle size={20} /></div>
                <span>Low-stock items</span>
                <strong>{lowStock}</strong>
                <small>10 units or fewer</small>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><IndianRupee size={20} /></div>
                <span>Stock value</span>
                <strong>{currency(inventoryValue)}</strong>
                <small>At current selling prices</small>
              </div>
            </section>

            <section className="inventory-panel">
              <div className="section-heading">
                <div>
                  <h2>All products</h2>
                  <p>{filteredProducts.length} matching products</p>
                </div>
              </div>

              <div className="toolbar">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by product name..."
                  />
                  {search && (
                    <button
                      className="clear-search"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <select
                  className="category-select"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  aria-label="Filter by category"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              {success && <div className="notice success">{success}</div>}
              {error && <div className="notice error">{error}</div>}

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>PRODUCT</th>
                      <th>CATEGORY</th>
                      <th>SELLING PRICE</th>
                      <th>STOCK</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="inventory-product">
                            <div className="product-avatar">
                              {product.name.charAt(0).toUpperCase()}
                            </div>
                            <strong>{product.name}</strong>
                          </div>
                        </td>
                        <td>{product.category}</td>
                        <td>{currency(product.price)} / {product.unit}</td>
                        <td>{product.stock} {product.unit === "kg" || product.unit === "litre" ? "" : "units"}</td>
                        <td>
                          <span
                            className={`inventory-status ${
                              product.stock <= 10 ? "low" : ""
                            }`}
                          >
                            {product.stock === 0
                              ? "Out of stock"
                              : product.stock <= 10
                                ? "Low stock"
                                : "In stock"}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="icon-button"
                              onClick={() => openEditForm(product)}
                              title="Edit product"
                              aria-label={`Edit ${product.name}`}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="icon-button delete"
                              onClick={() => deleteProduct(product)}
                              title="Delete product"
                              aria-label={`Delete ${product.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredProducts.length === 0 && (
                  <div className="empty-state">
                    No products found. Try another search or add a product.
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {activePage === "Dashboard" && (
          <>
            <section className="page-heading">
              <div>
                <p className="eyebrow">OVERVIEW</p>
                <h1>Dashboard</h1>
                <p className="muted">Your inventory at a glance.</p>
              </div>
            </section>
            <section className="stats-grid">
              <div className="stat-card">
                <span>Total products</span>
                <strong>{products.length}</strong>
              </div>
              <div className="stat-card">
                <span>Total stock units</span>
                <strong>{totalUnits}</strong>
              </div>
              <div className="stat-card">
                <span>Low-stock products</span>
                <strong>{lowStock}</strong>
              </div>
              <div className="stat-card">
                <span>Inventory value</span>
                <strong>{currency(inventoryValue)}</strong>
              </div>
            </section>
            <section className="inventory-panel">
              <h2>Stock requiring attention</h2>
              {products.filter((p) => p.stock <= 10).length === 0 ? (
                <p className="muted">No low-stock products.</p>
              ) : (
                products.filter((p) => p.stock <= 10).map((p) => (
                  <div className="attention-row" key={p.id}>
                    <span>{p.name}</span>
                    <span className="inventory-status low">{p.stock} remaining</span>
                    <button className="secondary-button" onClick={() => { changePage("Inventory"); openEditForm(p); }}>Update stock</button>
                  </div>
                ))
              )}
            </section>
          </>
        )}

        {activePage === "Billing" && (
          <section className="inventory-panel billing-placeholder">
            <p className="eyebrow">POINT OF SALE</p>
            <h1>Billing</h1>
            <p className="muted">
              Next, we'll connect the product catalog to the shopping cart and
              invoice checkout.
            </p>
            <button className="primary-button" onClick={() => changePage("Inventory")}>
              <Package size={17} /> Manage products
            </button>
          </section>
        )}
      </main>

      {formOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFormOpen(false);
          }}
        >
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">
                  {editingId !== null ? "UPDATE CATALOG" : "NEW CATALOG ITEM"}
                </p>
                <h2 id="form-title">
                  {editingId !== null ? "Edit product" : "Add new product"}
                </h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setFormOpen(false)}
                aria-label="Close form"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Product name
                <input
                  autoFocus
                  required
                  maxLength={100}
                  value={form.name}
                  placeholder="e.g. Sunflower Oil"
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </label>

              <div className="form-row">
                <label>
                  Category
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                  >
                    {categories.filter((c) => c !== "All Categories").map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Selling unit
                  <select
                    value={form.unit}
                    onChange={(event) =>
                      setForm({ ...form, unit: event.target.value })
                    }
                  >
                    {["piece", "packet", "kg", "g", "litre", "ml", "bottle", "box"].map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label>
                  Selling price (₹)
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    placeholder="0.00"
                    onChange={(event) =>
                      setForm({ ...form, price: event.target.value })
                    }
                  />
                </label>
                <label>
                  Available stock
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={form.stock}
                    placeholder="0"
                    onChange={(event) =>
                      setForm({ ...form, stock: event.target.value })
                    }
                  />
                </label>
              </div>

              {error && <div className="notice error">{error}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <Plus size={16} />
                  {editingId !== null ? "Save changes" : "Add product"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
