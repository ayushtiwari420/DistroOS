import { useState ,useEffect} from "react";
import { Link } from "react-router-dom";
import Badge from "../../../components/ui/Badges";
import StatCard from "../../../components/ui/StatCard";
import { useAuth } from "../../../context/AuthContext";

import { getAccessToken } from "../../../context/AuthContext";
import AccountProfile from '../../../components/shared/AccountProfile';

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const fetchRetailerOrders = async (limit = 20) => {
  const token = getAccessToken();
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(`${BASE}/orders?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Could not load orders.");
  return data.orders || [];
};

const formatOrderDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatAmount = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatCompactAmount = (value) => {
  const amount = Number(value || 0);
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return formatAmount(amount);
};

const formatItemCount = (items = []) => {
  const count = Array.isArray(items) ? items.length : Number(items || 0);
  return `${count} item${count === 1 ? "" : "s"}`;
};

function useRetailerOrders(limit = 20) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      setLoading(true);
      setApiError("");
      try {
        const nextOrders = await fetchRetailerOrders(limit);
        if (!ignore) setOrders(nextOrders);
      } catch (e) {
        if (!ignore) setApiError(e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadOrders();
    return () => {
      ignore = true;
    };
  }, [limit, refreshKey]);

  return {
    orders,
    loading,
    apiError,
    refreshOrders: () => setRefreshKey((key) => key + 1),
  };
}

// ── Retailer Sidebar ─────────────────────────────────────────────────────────
const navItems = [
  { icon: "📊", label: "Dashboard", id: "dashboard" },
  { icon: "🛒", label: "Place Order", id: "order" },
  { icon: "📋", label: "My Orders", id: "orders" },
  { icon: "💳", label: "My Account", id: "account" },
];

function RetailerSidebar({ active, setActive, collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: collapsed ? 68 : 240,
        background: "var(--navy-2)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        transition: "width 0.3s ease",
        overflow: "visible",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: collapsed ? "18px 0" : "18px 16px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid var(--border)",
          minHeight: 64,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            background: "var(--amber)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            flexShrink: 0,
          }}
        >
          📦
        </div>
        {!collapsed && (
          <span
            style={{
              fontFamily: "Sora,sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "var(--text)",
              whiteSpace: "nowrap",
            }}
          >
            Distro<span style={{ color: "var(--amber)" }}>OS</span>
          </span>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          position: "absolute",
          top: 18,
          right: -16,
          width: 32,
          height: 32,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "50%",
          color: "var(--text-muted)",
          fontSize: "0.8rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
          zIndex: 60,
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--amber)";
          e.currentTarget.style.color = "#0A1628";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--card)";
          e.currentTarget.style.color = "var(--text-muted)";
        }}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "16px 0 8px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {!collapsed && (
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
              padding: "0 16px 8px",
              opacity: 0.6,
            }}
          >
            MENU
          </div>
        )}
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: collapsed ? "11px 0" : "10px 16px",
              justifyContent: collapsed ? "center" : "flex-start",
              color: active === item.id ? "var(--amber)" : "var(--text-muted)",
              background:
                active === item.id ? "rgba(245,158,11,0.1)" : "transparent",
              borderLeft:
                active === item.id
                  ? "2px solid var(--amber)"
                  : "2px solid transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
              fontFamily: "DM Sans, sans-serif",
            }}
            title={collapsed ? item.label : ""}
          >
            <span
              style={{
                fontSize: "1.1rem",
                width: 22,
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              {item.icon}
            </span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Profile */}
      <div style={{ paddingBottom: 16, borderTop: "1px solid var(--border)" }}>
        {!collapsed ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 16px 4px",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--amber-dim)",
                border: "2px solid var(--amber)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: 800,
                color: "var(--amber)",
                flexShrink: 0,
              }}
            >
              PK
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                {user?.businessName || user?.name}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                Retailer · {user?.city}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px 0 4px",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--amber-dim)",
                border: "2px solid var(--amber)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: 800,
                color: "var(--amber)",
              }}
            >
              PK
            </div>
          </div>
        )}
        <button
          onClick={logout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: collapsed ? "11px 0" : "10px 16px",
            justifyContent: collapsed ? "center" : "flex-start",
            color: "var(--text-muted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontFamily: "DM Sans,sans-serif",
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: "1.1rem", width: 22, textAlign: "center" }}>
            🚪
          </span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

// ── Place Order Panel ─────────────────────────────────────────────────────────
function PlaceOrder({ onOrderPlaced }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [cart, setCart] = useState({});
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentType, setPaymentType] = useState("cash");

  const categories = [
    "All",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  const filtered = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const load = async () => {
      try {
        const token = getAccessToken();
        const res = await fetch(`${BASE}/products`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setProducts(data.products);
      } catch (e) {
        setApiError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const productId = (product) => product?._id || product?.id;
  const addToCart = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeFromCart = (id) =>
    setCart((c) => {
      const updated = { ...c };
      if (updated[id] > 1) updated[id]--;
      else delete updated[id];
      return updated;
    });

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({
      ...products.find((p) => productId(p) === id),
      qty,
    }))
    .filter((item) => productId(item));
  const cartTotal = cartItems.reduce(
    (sum, i) => sum + (i?.price || 0) * i.qty,
    0,
  );
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;

    setSubmitting(true);
    setApiError("");
    try {
      const token = getAccessToken();
      const items = cartItems.map((i) => ({
        productId: productId(i),
        quantity: i.qty,
      }));
      const res = await fetch(`${BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ items, paymentType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onOrderPlaced?.(data.order);
      setSubmitted(true);
      setCart({});
    } catch (e) {
      setApiError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 16,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3.5rem" }}>✅</div>
        <h2
          style={{
            fontFamily: "Sora,sans-serif",
            fontSize: "1.5rem",
            fontWeight: 800,
          }}
        >
          Order Placed!
        </h2>
        <p style={{ color: "var(--text-muted)" }}>
          Your order has been sent to the wholesaler for approval.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setPaymentType("cash");
          }}
          className="auth-submit-btn"
          style={{ maxWidth: 200, marginTop: 8 }}
        >
          Place Another Order
        </button>
      </div>
    );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 300px",
        gap: 24,
        alignItems: "start",
      }}
    >
      {/* Product Catalog */}
      <div>
        {/* Search + Filter */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "0.85rem",
              }}
            >
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              style={{
                width: "100%",
                padding: "10px 14px 10px 36px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 9,
                color: "var(--text)",
                fontFamily: "DM Sans,sans-serif",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid",
                  cursor: "pointer",
                  fontFamily: "DM Sans,sans-serif",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  transition: "all 0.15s",
                  background:
                    category === cat ? "var(--amber-dim)" : "var(--card)",
                  borderColor:
                    category === cat ? "rgba(245,158,11,0.4)" : "var(--border)",
                  color:
                    category === cat ? "var(--amber)" : "var(--text-muted)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {apiError && (
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10,
              color: "var(--red)",
              fontSize: "0.83rem",
              fontWeight: 600,
              marginBottom: 16,
              padding: "10px 14px",
            }}
          >
            {apiError}
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div style={{ color: "var(--text-muted)", padding: "36px 0" }}>
            Loading products...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ color: "var(--text-muted)", padding: "36px 0" }}>
            No products available from your wholesaler yet.
          </div>
        ) : (
          <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))",
            gap: 14,
          }}
        >
          {filtered.map((product) => (
            <div
              key={productId(product)}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                overflow: "hidden",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(245,158,11,0.25)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {product.image?.url && (
                <img
                  src={product.image.url}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: 130,
                    objectFit: "cover",
                    background: "var(--card-2)",
                  }}
                />
              )}
              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    background: "var(--card-2)",
                    color: "var(--text-muted)",
                    padding: "2px 8px",
                    borderRadius: 5,
                    fontWeight: 600,
                  }}
                >
                  {product.category}
                </span>
                <Badge status={product.stock <= product.lowStockAt ? "Low" : "Approved"} />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    color: "var(--text)",
                    marginBottom: 4,
                  }}
                >
                  {product.name}
                </div>
                <div
                  style={{
                    fontFamily: "Sora,sans-serif",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--amber)",
                  }}
                >
                  ₹{product.price.toLocaleString()}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  per {product.unit}
                </div>
              </div>

              {/* Qty controls */}
              {cart[productId(product)] ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    justifyContent: "space-between",
                  }}
                >
                  <button
                    onClick={() => removeFromCart(productId(product))}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      border: "1px solid var(--border)",
                      background: "var(--card-2)",
                      color: "var(--text)",
                      cursor: "pointer",
                      fontSize: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontFamily: "Sora,sans-serif",
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: "var(--amber)",
                    }}
                  >
                    {cart[productId(product)]}
                  </span>
                  <button
                    onClick={() => addToCart(productId(product))}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      border: "none",
                      background: "var(--amber)",
                      color: "#0A1628",
                      cursor: "pointer",
                      fontSize: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(productId(product))}
                  disabled={product.stock <= 0}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: "var(--amber-dim)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    color: "var(--amber)",
                    borderRadius: 8,
                    cursor: product.stock > 0 ? "pointer" : "not-allowed",
                    fontFamily: "DM Sans,sans-serif",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(245,158,11,0.2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "var(--amber-dim)")
                  }
                >
                  {product.stock > 0 ? "+ Add to Order" : "Out of Stock"}
                </button>
              )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Cart */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          overflow: "hidden",
          position: "sticky",
          top: 80,
        }}
      >
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "Sora,sans-serif",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              🛒 Your Order
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: 2,
              }}
            >
              {cartCount} item{cartCount !== 1 ? "s" : ""} selected
            </div>
          </div>
          {cartCount > 0 && (
            <button
              onClick={() => setCart({})}
              style={{
                fontSize: "0.72rem",
                color: "var(--red)",
                background: "rgba(239,68,68,0.1)",
                border: "none",
                borderRadius: 6,
                padding: "3px 8px",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div
          style={{
            padding: 16,
            minHeight: 180,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {cartCount === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                padding: "30px 0",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>🛒</div>
              No items added yet
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={productId(item)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.82rem",
                }}
              >
                <div>
                  <div style={{ color: "var(--text)", fontWeight: 500 }}>
                    {item.name}
                  </div>
                  <div
                    style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}
                  >
                    x{item.qty} × ₹{item.price.toLocaleString()}
                  </div>
                </div>
                <div style={{ color: "var(--amber)", fontWeight: 700 }}>
                  ₹{(item.price * item.qty).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {cartCount > 0 && (
          <div style={{ borderTop: "1px solid var(--border)", padding: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Total
              </span>
              <span
                style={{
                  fontFamily: "Sora,sans-serif",
                  fontWeight: 800,
                  fontSize: "1.2rem",
                  color: "var(--amber)",
                }}
              >
                ₹{cartTotal.toLocaleString()}
              </span>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 5,
                }}
              >
                Payment Type
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text)",
                  fontSize: "0.85rem",
                }}
              >
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
                <option value="upi">UPI</option>
              </select>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--amber)",
                color: "#0A1628",
                border: "none",
                borderRadius: 9,
                fontFamily: "DM Sans,sans-serif",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.75 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--amber-light)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--amber)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {submitting ? "Placing..." : "🚀 Place Order"}
            </button>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              Order will be sent for wholesaler approval
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── My Orders Panel ───────────────────────────────────────────────────────────
function MyOrders({ orders, loading, apiError, onRefresh }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "18px 22px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "Sora,sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              marginBottom: 3,
            }}
          >
            📋 Order History
          </div>
          <div style={{ fontSize: "0.775rem", color: "var(--text-muted)" }}>
            All your past and current orders
          </div>
        </div>
        <button
          onClick={onRefresh}
          style={{
            fontSize: "0.78rem",
            color: "var(--amber)",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 7,
            padding: "6px 12px",
            cursor: "pointer",
            fontFamily: "DM Sans,sans-serif",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Refresh
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.83rem",
          }}
        >
          <thead>
            <tr
              style={{
                background: "var(--card-2)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {["Order ID", "Date", "Items", "Amount", "Status", "Payment"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: "11px 18px",
                      textAlign: "left",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: 24,
                    color: "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  Loading orders...
                </td>
              </tr>
            ) : apiError ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: 24,
                    color: "var(--red)",
                    textAlign: "center",
                  }}
                >
                  {apiError}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: 24,
                    color: "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  No orders yet. Place your first order from the catalog.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order._id}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    transition: "background 0.15s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                <td
                  style={{
                    padding: "13px 18px",
                    fontFamily: "Sora,sans-serif",
                    fontWeight: 600,
                    color: "var(--amber)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {order.orderNumber || `#${order._id?.slice(-6) || "ORDER"}`}
                </td>
                <td
                  style={{
                    padding: "13px 18px",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                    fontSize: "0.78rem",
                  }}
                >
                  {formatOrderDate(order.createdAt)}
                </td>
                <td
                  style={{ padding: "13px 18px", color: "var(--text-muted)" }}
                >
                  {formatItemCount(order.items)}
                </td>
                <td
                  style={{
                    padding: "13px 18px",
                    color: "var(--text)",
                    fontWeight: 600,
                  }}
                >
                  {formatAmount(order.totalAmount)}
                </td>
                <td style={{ padding: "13px 18px" }}>
                  <Badge status={order.status} />
                </td>
                <td style={{ padding: "13px 18px" }}>
                  <span
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 6,
                      padding: "5px 12px",
                      color: "var(--text-muted)",
                      fontSize: "0.75rem",
                      fontFamily: "DM Sans,sans-serif",
                      textTransform: "capitalize",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {order.paymentType || "cash"}
                  </span>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function RetailerDashboard() {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const {
    orders,
    loading: ordersLoading,
    apiError: ordersError,
    refreshOrders,
  } = useRetailerOrders(20);

  const now = new Date();
  const pendingCount = orders.filter((order) => order.status === "pending").length;
  const latestOrder = orders[0];
  const thisMonthOrders = orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    return (
      !Number.isNaN(createdAt.getTime()) &&
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getFullYear() === now.getFullYear()
    );
  });
  const thisMonthSpent = thisMonthOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0,
  );
  const openCreditAmount = orders
    .filter(
      (order) => order.paymentType === "credit" && order.paymentStatus !== "paid",
    )
    .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

  const sidebarWidth = collapsed ? 68 : 240;

  const renderPanel = () => {
    if (active === "order") return <PlaceOrder onOrderPlaced={refreshOrders} />;
    if (active === "orders")
      return (
        <MyOrders
          orders={orders}
          loading={ordersLoading}
          apiError={ordersError}
          onRefresh={refreshOrders}
        />
      );
    if (active === "account") return <AccountProfile />;

    // Dashboard overview
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 16,
          }}
        >
          <StatCard
            icon="📦"
            label="Pending Orders"
            value={ordersLoading ? "..." : String(pendingCount)}
            delta="Awaiting approval"
            deltaType="neutral"
            color="amber"
          />
          <StatCard
            icon="💳"
            label="Credit Due"
            value={ordersLoading ? "..." : formatCompactAmount(openCreditAmount)}
            delta="Open credit orders"
            deltaType="down"
            color="red"
          />
          <StatCard
            icon="✅"
            label="Last Order"
            value={
              ordersLoading
                ? "..."
                : latestOrder
                  ? formatOrderDate(latestOrder.createdAt)
                  : "No orders"
            }
            delta={latestOrder?.orderNumber || "Place your first order"}
            deltaType="up"
            color="green"
          />
          <StatCard
            icon="💰"
            label="This Month Spent"
            value={ordersLoading ? "..." : formatCompactAmount(thisMonthSpent)}
            delta={`${thisMonthOrders.length} orders placed`}
            deltaType="up"
            color="teal"
          />
        </div>

        {/* Quick actions */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 22,
          }}
        >
          <div
            style={{
              fontFamily: "Sora,sans-serif",
              fontWeight: 700,
              marginBottom: 16,
              fontSize: "0.95rem",
            }}
          >
            ⚡ Quick Actions
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: 12,
            }}
          >
            {[
              {
                icon: "🛒",
                label: "Place New Order",
                id: "order",
                color: "var(--amber)",
              },
              {
                icon: "📋",
                label: "View My Orders",
                id: "orders",
                color: "var(--teal)",
              },
              {
                icon: "💳",
                label: "My Account",
                id: "account",
                color: "var(--green)",
              },
            ].map((action) => (
              <button
                key={action.id}
                onClick={() => setActive(action.id)}
                style={{
                  padding: "18px 16px",
                  background: "var(--card-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: "DM Sans,sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = action.color;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span style={{ fontSize: "1.8rem" }}>{action.icon}</span>
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent orders preview */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 22px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Sora,sans-serif",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              📋 Recent Orders
            </div>
            <button
              onClick={() => setActive("orders")}
              style={{
                fontSize: "0.78rem",
                color: "var(--amber)",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 7,
                padding: "5px 14px",
                cursor: "pointer",
                fontFamily: "DM Sans,sans-serif",
                fontWeight: 600,
              }}
            >
              View All →
            </button>
          </div>
          <div
            style={{
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {ordersLoading ? (
              <div
                style={{
                  padding: "14px 12px",
                  color: "var(--text-muted)",
                  textAlign: "center",
                }}
              >
                Loading orders...
              </div>
            ) : ordersError ? (
              <div
                style={{
                  padding: "14px 12px",
                  color: "var(--red)",
                  textAlign: "center",
                }}
              >
                {ordersError}
              </div>
            ) : orders.length === 0 ? (
              <div
                style={{
                  padding: "14px 12px",
                  color: "var(--text-muted)",
                  textAlign: "center",
                }}
              >
                No orders yet.
              </div>
            ) : (
              orders.slice(0, 3).map((order) => (
                <div
                  key={order._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "var(--card-2)",
                    borderRadius: 9,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "Sora,sans-serif",
                        fontWeight: 600,
                        color: "var(--amber)",
                        fontSize: "0.82rem",
                      }}
                    >
                      {order.orderNumber || `#${order._id?.slice(-6) || "ORDER"}`}
                    </div>
                    <div
                      style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}
                    >
                      {formatOrderDate(order.createdAt)} · {formatItemCount(order.items)}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: "var(--text)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {formatAmount(order.totalAmount)}
                    </span>
                    <Badge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Credit status */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 14,
            padding: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "Sora,sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  marginBottom: 4,
                }}
              >
                💳 Credit Status
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Your current credit account with the wholesaler
              </div>
            </div>
            <Badge status="overdue" />
          </div>
          <div style={{ display: "flex", gap: 32, marginBottom: 16 }}>
            <div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                Credit Limit
              </div>
              <div
                style={{
                  fontFamily: "Sora,sans-serif",
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  color: "var(--teal)",
                }}
              >
                ₹25,000
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                Amount Due
              </div>
              <div
                style={{
                  fontFamily: "Sora,sans-serif",
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  color: "var(--red)",
                }}
              >
                ₹8,200
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                Available
              </div>
              <div
                style={{
                  fontFamily: "Sora,sans-serif",
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  color: "var(--green)",
                }}
              >
                ₹16,800
              </div>
            </div>
          </div>
          {/* Credit usage bar */}
          <div
            style={{
              height: 6,
              background: "var(--card-2)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "32.8%",
                background: "linear-gradient(90deg,var(--amber),var(--red))",
                borderRadius: 999,
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginTop: 6,
            }}
          >
            32.8% of credit used
          </div>
        </div>
      </div>
    );
  };

  const pageTitle = {
    dashboard: "My Dashboard",
    order: "Place Order",
    orders: "My Orders",
    account: "My Account",
  }[active];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--navy)",
        fontFamily: "DM Sans,sans-serif",
      }}
    >
      <RetailerSidebar
        active={active}
        setActive={setActive}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        style={{
          marginLeft: sidebarWidth,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          transition: "margin-left 0.3s ease",
          minWidth: 0,
        }}
      >
        {/* Topbar */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            height: 64,
            background: "rgba(10,22,40,0.92)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "Sora,sans-serif",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {pageTitle}
            </h1>
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                marginTop: 1,
              }}
            >
              Welcome back, Priya 👋 — Borivali West, Mumbai
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setActive("order")}
              style={{
                padding: "8px 18px",
                background: "var(--amber)",
                color: "#0A1628",
                border: "none",
                borderRadius: 8,
                fontFamily: "DM Sans,sans-serif",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--amber-light)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--amber)")
              }
            >
              🛒 New Order
            </button>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--amber-dim)",
                border: "2px solid var(--amber)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: 800,
                color: "var(--amber)",
                cursor: "pointer",
              }}
            >
              PK
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ padding: "28px 32px 48px", flex: 1 }}>
          {renderPanel()}
        </main>
      </div>
    </div>
  );
}
