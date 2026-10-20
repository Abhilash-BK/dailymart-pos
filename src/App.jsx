import { useMemo, useState } from "react";
import {
  ShoppingBasket, LayoutDashboard, Package, Receipt, Search, Plus, Pencil,
  Trash2, X, Boxes, AlertTriangle, IndianRupee, Menu, Minus, Printer,
  ShoppingCart, CheckCircle2, Banknote, RotateCcw
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

const categories = ["All Categories", "Groceries", "Dairy", "Bakery", "Snacks", "Personal Care", "Household", "Beverages", "Other"];
const currency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2,
}).format(value);
const emptyForm = { name: "", category: "Groceries", unit: "piece", price: "", stock: "" };

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
  const [cart, setCart] = useState([]);
  const [billSearch, setBillSearch] = useState("");
  const [billCategory, setBillCategory] = useState("All Categories");
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [sales, setSales] = useState([]);
  const [lastReceipt, setLastReceipt] = useState(null);

  const filteredProducts = useMemo(() => products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) &&
    (category === "All Categories" || product.category === category)
  ), [products, search, category]);

  const billProducts = useMemo(() => products.filter((product) =>
    product.name.toLowerCase().includes(billSearch.toLowerCase()) &&
    (billCategory === "All Categories" || product.category === billCategory)
  ), [products, billSearch, billCategory]);

  const totalUnits = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStock = products.filter((product) => product.stock <= 10).length;
  const inventoryValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const grandTotal = Math.max(0, subtotal - discountAmount);

  function openAddForm() {
    setEditingId(null); setForm(emptyForm); setError(""); setSuccess(""); setFormOpen(true);
  }

  function openEditForm(product) {
    setEditingId(product.id);
    setForm({ name: product.name, category: product.category, unit: product.unit, price: String(product.price), stock: String(product.stock) });
    setError(""); setSuccess(""); setFormOpen(true);
  }

  function handleSubmit(event) {
    event.preventDefault(); setError(""); setSuccess("");
    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!name) return setError("Please enter a product name.");
    if (!Number.isFinite(price) || price <= 0) return setError("Price must be greater than zero.");
    if (!Number.isSafeInteger(stock) || stock < 0) return setError("Stock must be a whole number of zero or more.");
    if (products.some((p) => p.name.trim().toLowerCase() === name.toLowerCase() && p.id !== editingId)) {
      return setError("A product with this name already exists.");
    }
    const productData = { id: editingId ?? Date.now(), name, category: form.category, unit: form.unit, price, stock };
    if (editingId !== null) {
      setProducts((current) => current.map((p) => p.id === editingId ? productData : p));
      setSuccess("Product updated successfully.");
    } else {
      setProducts((current) => [...current, productData]);
      setSuccess("Product added successfully.");
    }
    setForm(emptyForm); setFormOpen(false); setEditingId(null);
  }

  function deleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}" from the inventory?`)) return;
    setProducts((current) => current.filter((item) => item.id !== product.id));
    setCart((current) => current.filter((item) => item.id !== product.id));
    setSuccess(`${product.name} deleted successfully.`); setError("");
  }

  function changePage(page) {
    setActivePage(page); setSuccess(""); setError("");
  }

  function addToCart(product) {
    if (product.stock <= 0) {
      setError(`${product.name} is out of stock.`);
      return;
    }
    setError("");
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setError(`Only ${product.stock} ${product.unit} available for ${product.name}.`);
          return current;
        }
        return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { ...product, quantity: 1 }];
    });
  }

  function updateCartQuantity(productId, nextQuantity) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (nextQuantity <= 0) {
      setCart((current) => current.filter((item) => item.id !== productId));
      return;
    }
    if (nextQuantity > product.stock) {
      setError(`Only ${product.stock} ${product.unit} available for ${product.name}.`);
      return;
    }
    setError("");
    setCart((current) => current.map((item) => item.id === productId ? { ...item, quantity: nextQuantity } : item));
  }

  function checkout() {
    if (!cart.length) {
      setError("Add at least one product to the cart before checkout.");
      return;
    }
    const unavailable = cart.find((item) => {
      const current = products.find((product) => product.id === item.id);
      return !current || item.quantity > current.stock;
    });
    if (unavailable) {
      setError(`Stock changed for ${unavailable.name}. Update the cart and try again.`);
      return;
    }
    const sale = {
      id: `DM-${Date.now().toString().slice(-8)}`,
      date: new Date(),
      items: cart.map((item) => ({ ...item })),
      subtotal,
      discount: discountAmount,
      total: grandTotal,
      paymentMethod,
    };
    setProducts((current) => current.map((product) => {
      const sold = cart.find((item) => item.id === product.id);
      return sold ? { ...product, stock: product.stock - sold.quantity } : product;
    }));
    setSales((current) => [sale, ...current]);
    setLastReceipt(sale);
    setCart([]);
    setDiscount("0");
    setError("");
    setSuccess(`Sale ${sale.id} completed successfully.`);
  }

  function printReceipt() {
    window.print();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><ShoppingBasket size={23} /></div>
          <div><strong>DailyMart</strong><span>STORE MANAGEMENT</span></div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        {[
          { label: "Dashboard", icon: LayoutDashboard },
          { label: "Billing", icon: Receipt },
          { label: "Inventory", icon: Package },
        ].map(({ label, icon: Icon }) => (
          <button key={label} className={`nav-item ${activePage === label ? "active" : ""}`} onClick={() => changePage(label)}>
            <Icon size={19} /><span>{label}</span>
          </button>
        ))}
        <div className="sidebar-bottom">
          <div className="store-status"><span className="status-dot" />Store open</div>
          <div className="user-profile"><div className="avatar">DM</div><div><strong>Store Admin</strong><span>Administrator</span></div></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand"><Menu size={21} />DailyMart</div>
          <div className="breadcrumb">Workspace <span>/</span> {activePage}</div>
          <div className="topbar-right"><span className="live-dot" />POS Terminal <span className="terminal-tag">01</span></div>
        </header>

        {activePage === "Inventory" && (
          <>
            <section className="page-heading">
              <div><p className="eyebrow">STOCK MANAGEMENT</p><h1>Product inventory</h1><p className="muted">Manage your grocery and daily-use products.</p></div>
              <button className="primary-button" onClick={openAddForm}><Plus size={17} />Add product</button>
            </section>
            <section className="stats-grid">
              <div className="stat-card"><div className="stat-icon"><Package size={20} /></div><span>Total products</span><strong>{products.length}</strong><small>Unique products</small></div>
              <div className="stat-card"><div className="stat-icon"><Boxes size={20} /></div><span>Total stock units</span><strong>{totalUnits}</strong><small>Across all products</small></div>
              <div className="stat-card"><div className="stat-icon warning"><AlertTriangle size={20} /></div><span>Low-stock items</span><strong>{lowStock}</strong><small>10 units or fewer</small></div>
              <div className="stat-card"><div className="stat-icon"><IndianRupee size={20} /></div><span>Stock value</span><strong>{currency(inventoryValue)}</strong><small>At current selling prices</small></div>
            </section>
            <section className="inventory-panel">
              <div className="section-heading"><div><h2>All products</h2><p>{filteredProducts.length} matching products</p></div></div>
              <div className="toolbar">
                <div className="search-box"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product name..." />
                  {search && <button className="clear-search" onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}
                </div>
                <select className="category-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              {success && <div className="notice success">{success}</div>}
              {error && <div className="notice error">{error}</div>}
              <div className="table-wrap"><table>
                <thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>SELLING PRICE</th><th>STOCK</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                <tbody>{filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td><div className="inventory-product"><div className="product-avatar">{product.name.charAt(0).toUpperCase()}</div><strong>{product.name}</strong></div></td>
                    <td>{product.category}</td><td>{currency(product.price)} / {product.unit}</td>
                    <td>{product.stock} {["kg", "litre", "g", "ml"].includes(product.unit) ? "" : "units"}</td>
                    <td><span className={`inventory-status ${product.stock <= 10 ? "low" : ""}`}>{product.stock === 0 ? "Out of stock" : product.stock <= 10 ? "Low stock" : "In stock"}</span></td>
                    <td><div className="action-buttons">
                      <button className="icon-button" onClick={() => openEditForm(product)} title="Edit product" aria-label={`Edit ${product.name}`}><Pencil size={15} /></button>
                      <button className="icon-button delete" onClick={() => deleteProduct(product)} title="Delete product" aria-label={`Delete ${product.name}`}><Trash2 size={15} /></button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
              {filteredProducts.length === 0 && <div className="empty-state">No products found. Try another search or add a product.</div>}</div>
            </section>
          </>
        )}

        {activePage === "Dashboard" && (
          <>
            <section className="page-heading"><div><p className="eyebrow">OVERVIEW</p><h1>Dashboard</h1><p className="muted">Your store at a glance.</p></div></section>
            <section className="stats-grid">
              <div className="stat-card"><span>Total products</span><strong>{products.length}</strong></div>
              <div className="stat-card"><span>Total stock units</span><strong>{totalUnits}</strong></div>
              <div className="stat-card"><span>Low-stock products</span><strong>{lowStock}</strong></div>
              <div className="stat-card"><span>Sales completed</span><strong>{sales.length}</strong></div>
              <div className="stat-card"><span>Sales total</span><strong>{currency(sales.reduce((sum, sale) => sum + sale.total, 0))}</strong></div>
            </section>
            <section className="inventory-panel">
              <div className="section-heading"><div><h2>Recent sales</h2><p>Completed bills in this session</p></div></div>
              {sales.length === 0 ? <div className="empty-state">No sales yet. Complete a bill in the Billing screen to see it here.</div> :
                <div className="table-wrap"><table><thead><tr><th>RECEIPT</th><th>TIME</th><th>ITEMS</th><th>PAYMENT</th><th>TOTAL</th></tr></thead>
                  <tbody>{sales.map((sale) => <tr key={sale.id}><td>{sale.id}</td><td>{sale.date.toLocaleString()}</td><td>{sale.items.reduce((n, item) => n + item.quantity, 0)}</td><td>{sale.paymentMethod}</td><td>{currency(sale.total)}</td></tr>)}</tbody></table></div>}
              <h2 className="subsection-title">Stock requiring attention</h2>
              {products.filter((p) => p.stock <= 10).length === 0 ? <p className="muted">No low-stock products.</p> : products.filter((p) => p.stock <= 10).map((p) => <div className="attention-row" key={p.id}><span>{p.name}</span><span className="inventory-status low">{p.stock} remaining</span><button className="secondary-button" onClick={() => { changePage("Inventory"); openEditForm(p); }}>Update stock</button></div>)}
            </section>
          </>
        )}

        {activePage === "Billing" && (
          <>
            <section className="page-heading"><div><p className="eyebrow">POINT OF SALE</p><h1>Billing</h1><p className="muted">Create a bill, collect payment, and print a receipt.</p></div>
              <span className="bill-number"><Receipt size={17} />New sale</span></section>
            {success && <div className="notice success">{success}</div>}
            {error && <div className="notice error">{error}</div>}
            <section className="billing-layout">
              <div className="inventory-panel bill-catalog">
                <div className="section-heading"><div><h2>Choose products</h2><p>{billProducts.length} products available</p></div></div>
                <div className="toolbar">
                  <div className="search-box"><Search size={18} /><input value={billSearch} onChange={(e) => setBillSearch(e.target.value)} placeholder="Search products..." /></div>
                  <select className="category-select" value={billCategory} onChange={(e) => setBillCategory(e.target.value)} aria-label="Filter billing products">{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                </div>
                <div className="bill-product-grid">
                  {billProducts.map((product) => <button key={product.id} className="bill-product-card" disabled={product.stock <= 0} onClick={() => addToCart(product)}>
                    <span className="bill-product-letter">{product.name.charAt(0)}</span><strong>{product.name}</strong><span className="muted">{product.category}</span>
                    <span className="bill-product-bottom"><b>{currency(product.price)}</b><small>{product.stock} in stock</small></span>
                    <span className="add-to-bill"><Plus size={15} />Add</span>
                  </button>)}
                </div>
                {billProducts.length === 0 && <div className="empty-state">No products match your search.</div>}
              </div>

              <aside className="inventory-panel cart-panel">
                <div className="section-heading"><div><h2><ShoppingCart size={19} /> Current bill</h2><p>{cart.reduce((n, item) => n + item.quantity, 0)} items</p></div>
                  <button className="icon-button" title="Clear cart" aria-label="Clear cart" onClick={() => { setCart([]); setError(""); }}><RotateCcw size={16} /></button></div>
                {cart.length === 0 ? <div className="cart-empty"><ShoppingCart size={32} /><strong>Your cart is empty</strong><span>Add products to start a bill.</span></div> :
                  <div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}>
                    <div className="cart-item-info"><strong>{item.name}</strong><span>{currency(item.price)} / {item.unit}</span></div>
                    <div className="quantity-control">
                      <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name}`}><Minus size={13} /></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name}`}><Plus size={13} /></button>
                    </div>
                    <strong className="cart-line-total">{currency(item.price * item.quantity)}</strong>
                    <button className="icon-button delete cart-remove" onClick={() => updateCartQuantity(item.id, 0)} aria-label={`Remove ${item.name}`}><Trash2 size={14} /></button>
                  </div>)}</div>}
                <div className="bill-summary">
                  <div><span>Subtotal</span><strong>{currency(subtotal)}</strong></div>
                  <label className="discount-field"><span>Discount (₹)</span><input type="number" min="0" max={subtotal} step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} /></label>
                  <div><span>Discount applied</span><strong>− {currency(discountAmount)}</strong></div>
                  <div className="grand-total"><span>Total due</span><strong>{currency(grandTotal)}</strong></div>
                  <label className="payment-field">Payment method<select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option>Cash</option><option>UPI</option><option>Card</option></select></label>
                  <button className="primary-button checkout-button" onClick={checkout}><CheckCircle2 size={17} />Complete sale</button>
                  <p className="billing-note"><Banknote size={14} /> Stock decreases when the sale is completed.</p>
                </div>
              </aside>
            </section>
          </>
        )}
      </main>

      {formOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}>
        <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
          <div className="modal-heading"><div><p className="eyebrow">{editingId !== null ? "UPDATE CATALOG" : "NEW CATALOG ITEM"}</p><h2 id="form-title">{editingId !== null ? "Edit product" : "Add new product"}</h2></div>
            <button className="icon-button" onClick={() => setFormOpen(false)} aria-label="Close form"><X size={19} /></button></div>
          <form onSubmit={handleSubmit}>
            <label>Product name<input autoFocus required maxLength={100} value={form.name} placeholder="e.g. Sunflower Oil" onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <div className="form-row"><label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.filter((c) => c !== "All Categories").map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label>Selling unit<select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>{["piece", "packet", "kg", "g", "litre", "ml", "bottle", "box"].map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></label></div>
            <div className="form-row"><label>Selling price (₹)<input type="number" required min="0.01" step="0.01" value={form.price} placeholder="0.00" onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
              <label>Available stock<input type="number" required min="0" step="1" value={form.stock} placeholder="0" onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label></div>
            {error && <div className="notice error">{error}</div>}
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" className="primary-button"><Plus size={16} />{editingId !== null ? "Save changes" : "Add product"}</button></div>
          </form>
        </section>
      </div>}

      {lastReceipt && <div className="receipt-backdrop" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
        <section className="receipt-modal">
          <div className="receipt-actions no-print"><span className="success-heading"><CheckCircle2 size={19} /> Sale completed</span><button className="icon-button" onClick={() => setLastReceipt(null)} aria-label="Close receipt"><X size={18} /></button></div>
          <div className="print-receipt" id="print-receipt">
            <div className="receipt-store"><ShoppingBasket size={26} /><h2 id="receipt-title">DailyMart</h2><p>Grocery & Daily Needs</p><small>Thank you for shopping with us!</small></div>
            <div className="receipt-meta"><span>Receipt: {lastReceipt.id}</span><span>{lastReceipt.date.toLocaleString()}</span><span>Payment: {lastReceipt.paymentMethod}</span></div>
            <table className="receipt-table"><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>{lastReceipt.items.map((item) => <tr key={item.id}><td>{item.name}<small>{currency(item.price)} each</small></td><td>{item.quantity}</td><td>{currency(item.price * item.quantity)}</td></tr>)}</tbody></table>
            <div className="receipt-totals"><div><span>Subtotal</span><span>{currency(lastReceipt.subtotal)}</span></div><div><span>Discount</span><span>− {currency(lastReceipt.discount)}</span></div><div className="receipt-grand"><strong>Total paid</strong><strong>{currency(lastReceipt.total)}</strong></div></div>
            <p className="receipt-thanks">Please visit again.</p>
          </div>
          <div className="receipt-actions no-print"><button className="secondary-button" onClick={() => setLastReceipt(null)}>Close</button><button className="primary-button" onClick={printReceipt}><Printer size={16} />Print receipt</button></div>
        </section>
      </div>}
    </div>
  );
}
