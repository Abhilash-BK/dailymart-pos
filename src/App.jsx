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
