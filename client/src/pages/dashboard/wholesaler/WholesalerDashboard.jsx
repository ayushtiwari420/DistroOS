import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Store,
  CreditCard,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  Truck,
  Edit2,
  Trash2,
  X,
  Check,
  UserCheck,
  UserPlus,
  User
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getAccessToken } from "../../../context/AuthContext";
import BrandLogo from "../../../components/ui/BrandLogo";
import AccountProfile from "../../../components/shared/AccountProfile";

// ─────────────────────────────────────────────────────────────
// API HELPER
// ─────────────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = async (endpoint, options = {}) => {
  const token = getAccessToken();
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

// ─────────────────────────────────────────────────────────────
// SERVICE CALLS
// ─────────────────────────────────────────────────────────────
const svc = {
  // orders
  getOrderStats: () => api("/orders/stats"),
  getOrders: (p = "") => api(`/orders${p}`),
  updateOrderStatus: (id, status, reason) =>
    api(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, rejectionReason: reason }),
    }),
  // products
  getProducts: (p = "") => api(`/products${p}`),
  createProduct: (b) => api("/products", { method: "POST", body: b }),
  updateProduct: (id, b) => api(`/products/${id}`, { method: "PUT", body: b }),
  deleteProduct: (id) => api(`/products/${id}`, { method: "DELETE" }),
  adjustStock: (id, qty, type) =>
    api(`/products/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ quantity: qty, type }),
    }),
  bulkUpdateProducts: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api("/products/bulk-upload", { method: "POST", body: fd });
  },
  // retailers
  getRetailers: (p = "") => api(`/retailers${p}`),
  searchRetailer: (email) =>
    api("/retailers/search", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  linkRetailer: (email, limit) =>
    api("/retailers/link", {
      method: "POST",
      body: JSON.stringify({ email, creditLimit: Number(limit) || 0 }),
    }),
  createRetailer: (b) =>
    api("/retailers", { method: "POST", body: JSON.stringify(b) }),
  // salesmen
  getSalesmen: (p = "") => api(`/salesmen${p}`),
  createSalesman: (b) =>
    api("/salesmen", { method: "POST", body: JSON.stringify(b) }),
  // credit
  getAllCredit: () => api("/credit"),
  recordRepayment: (rid, amt, note) =>
    api(`/credit/${rid}/repay`, {
      method: "POST",
      body: JSON.stringify({ amount: amt, note }),
    }),
  updateCreditLimit: (rid, limit) =>
    api(`/credit/${rid}/limit`, {
      method: "PATCH",
      body: JSON.stringify({ creditLimit: limit }),
    }),
};

// ─────────────────────────────────────────────────────────────
// SHARED UI COMPONENTS
// ─────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const Badge = ({ status }) => {
  const map = {
    pending: { bg: "#FFFBEB", color: "#D97706", label: "Pending" },
    approved: { bg: "#EFF4FF", color: "#2563EB", label: "Approved" },
    dispatched: { bg: "#F0FDF4", color: "#16A34A", label: "Dispatched" },
    delivered: { bg: "#F0FDF4", color: "#15803D", label: "Delivered" },
    cancelled: { bg: "#FEF2F2", color: "#DC2626", label: "Cancelled" },
    active: { bg: "#F0FDF4", color: "#16A34A", label: "Active" },
    suspended: { bg: "#FEF2F2", color: "#DC2626", label: "Suspended" },
    overdue: { bg: "#FFFBEB", color: "#D97706", label: "Overdue" },
    clear: { bg: "#F0FDF4", color: "#16A34A", label: "Clear" },
    blocked: { bg: "#FEF2F2", color: "#DC2626", label: "Blocked" },
  };
  const s = map[status] || { bg: "#F5F6FA", color: "#64748B", label: status };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: "0.72rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
};

const Spinner = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 60,
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        border: "2.5px solid var(--border)",
        borderTopColor: "var(--blue)",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  </div>
);

const Empty = ({ icon = "📭", title = "No data found", sub = "" }) => (
  <div
    style={{
      textAlign: "center",
      padding: "52px 20px",
      color: "var(--text-muted)",
    }}
  >
    <div style={{ fontSize: "2.2rem", marginBottom: 10 }}>{icon}</div>
    <div
      style={{
        fontWeight: 600,
        color: "var(--text)",
        marginBottom: 4,
        fontSize: "0.95rem",
      }}
    >
      {title}
    </div>
    {sub && <div style={{ fontSize: "0.82rem" }}>{sub}</div>}
  </div>
);

const ErrBox = ({ msg }) =>
  msg ? (
    <div
      style={{
        background: "#FEF2F2",
        border: "1px solid #FCA5A5",
        color: "#DC2626",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: "0.83rem",
        marginBottom: 14,
      }}
    >
      {msg}
    </div>
  ) : null;

const OkBox = ({ msg }) =>
  msg ? (
    <div
      style={{
        background: "#F0FDF4",
        border: "1px solid #86EFAC",
        color: "#16A34A",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: "0.83rem",
        marginBottom: 14,
      }}
    >
      {msg}
    </div>
  ) : null;

const Modal = ({ open, onClose, title, children, width = 480 }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.42)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 14,
          width: "100%",
          maxWidth: width,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "20px 22px" }}>{children}</div>
      </div>
    </div>
  );
};

const Field = ({ label, children, style = {} }) => (
  <div style={{ marginBottom: 12, ...style }}>
    <label
      style={{
        display: "block",
        fontSize: "0.78rem",
        fontWeight: 600,
        color: "var(--text-muted)",
        marginBottom: 5,
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

const Inp = (props) => (
  <input
    className="input"
    {...props}
    style={{ width: "100%", boxSizing: "border-box", ...props.style }}
  />
);

const Row2 = ({ children }) => (
  <div style={{ display: "flex", gap: 12 }}>
    {React.Children.map(children, (child) =>
      child ? <div style={{ flex: 1, minWidth: 0 }}>{child}</div> : null,
    )}
  </div>
);

const thStyle = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: "0.7rem",
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  whiteSpace: "nowrap",
};
const tdStyle = { padding: "12px 14px" };

// ─────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────
const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "products", label: "Products", icon: Package },
  { key: "retailers", label: "Retailers", icon: Store },
  { key: "salesmen", label: "Salesmen", icon: Users },
  { key: "credit", label: "Credit", icon: CreditCard },
  { key: "account", label: "My Account", icon: User },
];

function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  const { logout, user } = useAuth();
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "WS";

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: collapsed ? 60 : 232,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        transition: "width 0.25s ease",
        boxShadow: "var(--shadow-sm)",
        overflow: "visible",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: collapsed ? "14px 0" : "14px 16px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid var(--border)",
          minHeight: 60,
          flexShrink: 0,
        }}
      >
        <BrandLogo size="md" variant="dark" collapsed={collapsed} />
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          position: "absolute",
          top: 17,
          right: -13,
          width: 26,
          height: 26,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "50%",
          color: "var(--text-muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 60,
          boxShadow: "var(--shadow-sm)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--blue)";
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.borderColor = "var(--blue)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--surface)";
          e.currentTarget.style.color = "var(--text-muted)";
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "10px 0",
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
              color: "var(--text-faint)",
              padding: "0 14px 6px",
            }}
          >
            MAIN MENU
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              title={collapsed ? item.label : ""}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "10px 0" : "9px 14px",
                justifyContent: collapsed ? "center" : "flex-start",
                color: isActive ? "var(--blue)" : "var(--text-muted)",
                background: isActive ? "var(--blue-light)" : "transparent",
                borderLeft: `2px solid ${isActive ? "var(--blue)" : "transparent"}`,
                borderRight: "none",
                borderTop: "none",
                borderBottom: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: isActive ? 600 : 500,
                transition: "all 0.15s",
                fontFamily: "Inter, sans-serif",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--bg)";
                  e.currentTarget.style.color = "var(--text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }
              }}
            >
              <Icon size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ paddingBottom: 12, borderTop: "1px solid var(--border)" }}>
        {[
          { label: "Logout", icon: LogOut, action: logout, red: true },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.action}
              title={collapsed ? item.label : ""}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "10px 0" : "9px 14px",
                justifyContent: collapsed ? "center" : "flex-start",
                color: "var(--text-muted)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 500,
                fontFamily: "Inter, sans-serif",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = item.red
                  ? "#FEF2F2"
                  : "var(--bg)";
                e.currentTarget.style.color = item.red
                  ? "#DC2626"
                  : "var(--text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <Icon size={16} strokeWidth={1.75} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
        {/* Profile chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: collapsed ? 0 : 10,
            padding: collapsed ? "10px 0" : "10px 14px 0",
            justifyContent: collapsed ? "center" : "flex-start",
            marginTop: 6,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "var(--blue-light)",
              border: "1.5px solid var(--blue-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.65rem",
              fontWeight: 700,
              color: "var(--blue)",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.name}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                Wholesaler
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB: DASHBOARD
// ─────────────────────────────────────────────────────────────
function DashboardTab() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([svc.getOrderStats(), svc.getOrders("?limit=5")])
      .then(([s, o]) => {
        setStats(s.stats);
        setOrders(o.orders);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const cards = [
    {
      label: "Total Orders",
      value: stats?.total || 0,
      color: "#2563EB",
      bg: "#EFF4FF",
    },
    {
      label: "Pending",
      value: stats?.pending || 0,
      color: "#D97706",
      bg: "#FFFBEB",
    },
    {
      label: "Monthly Revenue",
      value: fmt(stats?.monthlyRevenue),
      color: "#16A34A",
      bg: "#F0FDF4",
    },
    {
      label: "Total Revenue",
      value: fmt(stats?.revenue),
      color: "#7C3AED",
      bg: "#F5F3FF",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2
          style={{
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontSize: "1.25rem",
            fontWeight: 800,
            marginBottom: 3,
          }}
        >
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Here's your business overview for today.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
        }}
      >
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "18px 20px",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.15s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "var(--shadow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              {c.label}
            </div>
            <div
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontSize: "1.7rem",
                fontWeight: 800,
                color: c.color,
              }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 700,
          }}
        >
          Recent Orders
        </div>
        {orders.length === 0 ? (
          <Empty
            icon="📦"
            title="No orders yet"
            sub="Orders placed by your retailers will appear here"
          />
        ) : (
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
                    background: "var(--bg)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {["Order", "Retailer", "Amount", "Status", "Date"].map(
                    (h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o._id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 600,
                        color: "var(--blue)",
                      }}
                    >
                      {o.orderNumber}
                    </td>
                    <td style={tdStyle}>
                      {o.retailer?.businessName || o.retailer?.name || "—"}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      {fmt(o.totalAmount)}
                    </td>
                    <td style={tdStyle}>
                      <Badge status={o.status} />
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        color: "var(--text-muted)",
                        fontSize: "0.78rem",
                      }}
                    >
                      {new Date(o.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB: ORDERS
// ─────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await svc.getOrders(
        filter !== "all" ? `?status=${filter}` : "",
      );
      setOrders(data.orders);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatus = async (id, status) => {
    setUpdating(id);
    try {
      await svc.updateOrderStatus(id, status);
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status } : o)),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <h2
          style={{
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 800,
            fontSize: "1.1rem",
          }}
        >
          Orders
        </h2>
        <button
          onClick={load}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: "0.83rem",
            color: "var(--text-muted)",
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Status filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          "all",
          "pending",
          "approved",
          "dispatched",
          "delivered",
          "cancelled",
        ].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: "5px 14px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: filter === t ? "var(--blue)" : "var(--surface)",
              color: filter === t ? "#fff" : "var(--text-muted)",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "all 0.15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <ErrBox msg={error} />

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {loading ? (
          <Spinner />
        ) : orders.length === 0 ? (
          <Empty
            icon="📋"
            title="No orders found"
            sub="Try a different filter or wait for retailers to place orders"
          />
        ) : (
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
                    background: "var(--bg)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {[
                    "Order",
                    "Retailer",
                    "Items",
                    "Amount",
                    "Payment",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o._id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 600,
                        color: "var(--blue)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {o.orderNumber}
                    </td>
                    <td style={tdStyle}>
                      {o.retailer?.businessName || o.retailer?.name || "—"}
                    </td>
                    <td style={{ ...tdStyle, color: "var(--text-muted)" }}>
                      {o.items?.length} item{o.items?.length !== 1 ? "s" : ""}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmt(o.totalAmount)}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        textTransform: "capitalize",
                        color: "var(--text-muted)",
                      }}
                    >
                      {o.paymentType}
                    </td>
                    <td style={tdStyle}>
                      <Badge status={o.status} />
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        color: "var(--text-muted)",
                        fontSize: "0.78rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(o.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {o.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleStatus(o._id, "approved")}
                              disabled={updating === o._id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "4px 10px",
                                background: "#F0FDF4",
                                color: "#16A34A",
                                border: "1px solid #86EFAC",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              }}
                            >
                              <Check size={11} /> Approve
                            </button>
                            <button
                              onClick={() => handleStatus(o._id, "cancelled")}
                              disabled={updating === o._id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "4px 10px",
                                background: "#FEF2F2",
                                color: "#DC2626",
                                border: "1px solid #FCA5A5",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              }}
                            >
                              <X size={11} /> Reject
                            </button>
                          </>
                        )}
                        {o.status === "approved" && (
                          <button
                            onClick={() => handleStatus(o._id, "dispatched")}
                            disabled={updating === o._id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "4px 10px",
                              background: "#EFF4FF",
                              color: "#2563EB",
                              border: "1px solid #BFDBFE",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            <Truck size={11} /> Dispatch
                          </button>
                        )}
                        {o.status === "dispatched" && (
                          <button
                            onClick={() => handleStatus(o._id, "delivered")}
                            disabled={updating === o._id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "4px 10px",
                              background: "#F0FDF4",
                              color: "#15803D",
                              border: "1px solid #86EFAC",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            <CheckCircle size={11} /> Delivered
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB: PRODUCTS
// ─────────────────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'stock'
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "piece",
    price: "",
    costPrice: "",
    stock: "",
    lowStockAt: 10,
  });
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBulkLoading(true);
    setError("");
    setBulkResult(null);

    try {
      const res = await svc.bulkUpdateProducts(file);
      setBulkResult(res);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkLoading(false);
      e.target.value = "";
    }
  };
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [stockAdj, setStockAdj] = useState({ qty: "", type: "add" });

  const load = async () => {
    setLoading(true);
    try {
      const d = await svc.getProducts(
        search ? `?search=${encodeURIComponent(search)}` : "",
      );
      setProducts(d.products);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setForm({
      name: "",
      category: "",
      unit: "piece",
      price: "",
      costPrice: "",
      stock: "",
      lowStockAt: 10,
    });
    setError("");
    setModal("add");
  };
  const openEdit = (p) => {
    setSelected(p);
    setForm({
      name: p.name,
      category: p.category || "",
      unit: p.unit,
      price: p.price,
      costPrice: p.costPrice || "",
      stock: p.stock,
      lowStockAt: p.lowStockAt,
    });
    setError("");
    setModal("edit");
  };
  const openStock = (p) => {
    setSelected(p);
    setStockAdj({ qty: "", type: "add" });
    setError("");
    setModal("stock");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append("image", imageFile);
      if (modal === "add") await svc.createProduct(fd);
      if (modal === "edit") await svc.updateProduct(selected._id, fd);
      setModal(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStock = async () => {
    if (!stockAdj.qty) return;
    setSaving(true);
    setError("");
    try {
      await svc.adjustStock(selected._id, Number(stockAdj.qty), stockAdj.type);
      setModal(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this product from your catalog?")) return;
    try {
      await svc.deleteProduct(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const fc = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <h2
          style={{
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 800,
            fontSize: "1.1rem",
          }}
        >
          Products & Inventory
        </h2>
        <button
          onClick={openAdd}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            background: "var(--blue)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          <Plus size={15} /> Add Product
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--surface)', color: 'var(--blue)', border: '1.5px solid var(--blue)', borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
          {bulkLoading ? "Uploading..." : "Upload Price List"}
          <input type="file" accept=".xlsx,.xls" onChange={handleBulkUpload} disabled={bulkLoading} style={{ display: "none" }} />
        </label>
      </div>
      {bulkResult && (
        <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, padding: "10px 14px", fontSize: "0.83rem", color: "#166534" }}>
          <div>{bulkResult.message}</div>
          {bulkResult.summary?.errors?.length > 0 && (
            <div style={{ marginTop: 6, color: "#92400E" }}>
              {bulkResult.summary.errors.slice(0, 5).join(" ")}
              {bulkResult.summary.errors.length > 5 && ` ${bulkResult.summary.errors.length - 5} more issue(s).`}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            className="input"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            style={{ paddingLeft: 34 }}
          />
        </div>
        <button
          onClick={load}
          style={{
            padding: "8px 14px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            cursor: "pointer",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <ErrBox msg={error} />

      {loading ? (
        <Spinner />
      ) : products.length === 0 ? (
        <Empty
          icon="📦"
          title="No products yet"
          sub="Add your first product to start receiving orders"
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {products.map((p) => (
            <div
              key={p._id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "var(--shadow-sm)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "var(--shadow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              {/* Image */}
              <div
                style={{
                  height: 160,
                  background: "var(--bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 12,
                  overflow: "hidden",
                }}
              >
                {p.image?.url ? (
                  <img
                    src={p.image.url}
                    alt={p.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: 8,
                    }}
                  />
                ) : (
                  <div style={{ fontSize: "2.5rem" }}>📦</div>
                )}
              </div>

              {/* Details */}
              <div style={{ padding: "14px 16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", flex: 1 }}>
                    {p.name}
                  </div>
                  <Badge status={p.isActive ? "active" : "suspended"} />
                </div>

                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginBottom: 8,
                  }}
                >
                  {p.category || "—"} • {p.unit}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      color: "var(--blue)",
                    }}
                  >
                    {fmt(p.price)}
                  </div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Cost: {fmt(p.costPrice)}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 10px",
                    background: p.isLowStock ? "#FEF2F2" : "var(--bg)",
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Stock
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      color: p.isLowStock ? "#DC2626" : "var(--text)",
                    }}
                  >
                    {p.stock} {p.isLowStock && "⚠️"}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => openStock(p)}
                    style={{
                      flex: 1,
                      padding: "6px",
                      background: "#EFF4FF",
                      color: "#2563EB",
                      border: "1px solid #BFDBFE",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Stock
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    style={{
                      padding: "6px 10px",
                      background: "var(--bg)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    style={{
                      padding: "6px 10px",
                      background: "#FEF2F2",
                      color: "#DC2626",
                      border: "1px solid #FCA5A5",
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modal === "add" || modal === "edit"}
        onClose={() => setModal(null)}
        title={modal === "add" ? "Add Product" : "Edit Product"}
      >
        <ErrBox msg={error} />
        <Field label="Product Image">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              setImageFile(file);
              setImagePreview(file ? URL.createObjectURL(file) : "");
            }}
            style={{ width: "100%" }}
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="preview"
              style={{
                marginTop: 8,
                width: "100%",
                height: 120,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          )}
          {!imagePreview && modal === "edit" && selected?.image?.url && (
            <img
              src={selected.image.url}
              alt="current"
              style={{
                marginTop: 8,
                width: "100%",
                height: 120,
                objectFit: "cover",
                borderRadius: 8,
                opacity: 0.6,
              }}
            />
          )}
        </Field>
        <Field label="Product Name">
          <Inp
            placeholder="e.g. Surf Excel 1kg"
            value={form.name}
            onChange={fc("name")}
          />
        </Field>
        <Row2>
          <Field label="Category">
            <Inp
              placeholder="e.g. FMCG"
              value={form.category}
              onChange={fc("category")}
            />
          </Field>
          <Field label="Unit">
            <select
              className="input"
              value={form.unit}
              onChange={fc("unit")}
              style={{ width: "100%" }}
            >
              {["piece", "kg", "litre", "bag", "box", "dozen", "pack"].map(
                (u) => (
                  <option key={u}>{u}</option>
                ),
              )}
            </select>
          </Field>
        </Row2>
        <Row2>
          <Field label="Selling Price (₹)">
            <Inp
              type="number"
              placeholder="0"
              value={form.price}
              onChange={fc("price")}
            />
          </Field>
          <Field label="Cost Price (₹)">
            <Inp
              type="number"
              placeholder="0"
              value={form.costPrice}
              onChange={fc("costPrice")}
            />
          </Field>
        </Row2>
        <Row2>
          {modal === "add" && (
            <Field label="Opening Stock">
              <Inp
                type="number"
                placeholder="0"
                value={form.stock}
                onChange={fc("stock")}
              />
            </Field>
          )}
          <Field label="Low Stock Alert At">
            <Inp
              type="number"
              placeholder="10"
              value={form.lowStockAt}
              onChange={fc("lowStockAt")}
            />
          </Field>
        </Row2>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={() => setModal(null)}
            style={{
              padding: "8px 18px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 20px",
              background: "var(--blue)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            {saving
              ? "Saving..."
              : modal === "add"
                ? "Add Product"
                : "Save Changes"}
          </button>
        </div>
      </Modal>

      {/* Stock Adjust Modal */}
      <Modal
        open={modal === "stock"}
        onClose={() => setModal(null)}
        title={`Adjust Stock — ${selected?.name}`}
        width={360}
      >
        <ErrBox msg={error} />
        <p
          style={{
            fontSize: "0.83rem",
            color: "var(--text-muted)",
            marginBottom: 14,
          }}
        >
          Current stock:{" "}
          <strong>
            {selected?.stock} {selected?.unit}
          </strong>
        </p>
        <Field label="Adjustment Type">
          <select
            className="input"
            value={stockAdj.type}
            onChange={(e) =>
              setStockAdj((p) => ({ ...p, type: e.target.value }))
            }
            style={{ width: "100%" }}
          >
            <option value="add">Add stock (received goods)</option>
            <option value="subtract">Subtract stock (manual correction)</option>
          </select>
        </Field>
        <Field label="Quantity" style={{ marginTop: 12 }}>
          <Inp
            type="number"
            placeholder="0"
            value={stockAdj.qty}
            onChange={(e) =>
              setStockAdj((p) => ({ ...p, qty: e.target.value }))
            }
          />
        </Field>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={() => setModal(null)}
            style={{
              padding: "8px 18px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleStock}
            disabled={saving || !stockAdj.qty}
            style={{
              padding: "8px 20px",
              background: "var(--blue)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            {saving ? "Updating..." : "Update Stock"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB: RETAILERS  ← FIXED: link existing OR create new
// ─────────────────────────────────────────────────────────────
function RetailersTab() {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'link' | 'create'
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Link flow
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundRetailer, setFoundRetailer] = useState(null);
  const [creditLimit, setCreditLimit] = useState("");
  const [linking, setLinking] = useState(false);

  // Create flow
  const [cf, setCf] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    city: "",
    password: "",
    creditLimit: "",
  });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await svc.getRetailers();
      setRetailers(d.retailers);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openLink = () => {
    setModal("link");
    setSearchEmail("");
    setFoundRetailer(null);
    setCreditLimit("");
    setError("");
    setSuccess("");
  };

  const openCreate = () => {
    setModal("create");
    setCf({
      name: "",
      email: "",
      phone: "",
      businessName: "",
      city: "",
      password: "",
      creditLimit: "",
    });
    setError("");
    setSuccess("");
  };

  const handleSearch = async () => {
    if (!searchEmail) return;
    setSearching(true);
    setError("");
    setFoundRetailer(null);
    try {
      const d = await svc.searchRetailer(searchEmail);
      setFoundRetailer(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  };

  const handleLink = async () => {
    setLinking(true);
    setError("");
    try {
      await svc.linkRetailer(searchEmail, creditLimit);
      setModal(null);
      setSuccess(
        `${foundRetailer.retailer.name} has been linked to your account!`,
      );
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setLinking(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    try {
      await svc.createRetailer({
        ...cf,
        creditLimit: Number(cf.creditLimit) || 0,
      });
      setModal(null);
      setSuccess("New retailer account created and linked!");
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const upd = (k) => (e) => setCf((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 800,
              fontSize: "1.1rem",
            }}
          >
            Retailers
          </h2>
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            Link existing accounts or create new ones
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={openLink}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "var(--surface)",
              color: "var(--blue)",
              border: "1.5px solid var(--blue)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <UserCheck size={15} /> Link Retailer
          </button>
          <button
            onClick={openCreate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "var(--blue)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <UserPlus size={15} /> Create New
          </button>
        </div>
      </div>

      <OkBox msg={success} />
      {!modal && <ErrBox msg={error} />}

      {/* Info banner */}
      <div
        style={{
          background: "#EFF4FF",
          border: "1px solid #BFDBFE",
          borderRadius: 10,
          padding: "12px 16px",
          fontSize: "0.82rem",
          color: "#1D4ED8",
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
        }}
      >
        <span>ℹ️</span>
        <span>
          <strong>Retailer already has an account?</strong> Use{" "}
          <strong>Link Retailer</strong> — search by their registered email to
          connect them. &nbsp; No account yet? Use <strong>Create New</strong>{" "}
          to make one on their behalf.
        </span>
      </div>

      {loading ? (
        <Spinner />
      ) : retailers.length === 0 ? (
        <Empty
          icon="🏪"
          title="No retailers linked yet"
          sub="Link existing retailer accounts or create new ones above"
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
            gap: 14,
          }}
        >
          {retailers.map((r) => (
            <div
              key={r._id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "18px 20px",
                boxShadow: "var(--shadow-sm)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "var(--shadow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    {r.businessName || r.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {r.name}
                    {r.city ? ` • ${r.city}` : ""}
                  </div>
                </div>
                <Badge status={r.status} />
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                {r.phone && <div>📞 {r.phone}</div>}
                <div>✉️ {r.email}</div>
              </div>
              {r.credit && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "8px 12px",
                    background: r.credit.currentDue > 0 ? "#FFFBEB" : "#F0FDF4",
                    borderRadius: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      fontWeight: 500,
                    }}
                  >
                    Credit Due
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: r.credit.currentDue > 0 ? "#D97706" : "#16A34A",
                    }}
                  >
                    {fmt(r.credit.currentDue)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── LINK MODAL ── */}
      <Modal
        open={modal === "link"}
        onClose={() => setModal(null)}
        title="Link Existing Retailer"
        width={460}
      >
        <p
          style={{
            fontSize: "0.83rem",
            color: "var(--text-muted)",
            marginBottom: 14,
          }}
        >
          Enter the email address the retailer used when registering their
          account.
        </p>
        <ErrBox msg={error} />

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            className="input"
            placeholder="retailer@email.com"
            value={searchEmail}
            onChange={(e) => {
              setSearchEmail(e.target.value);
              setFoundRetailer(null);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{ flex: 1 }}
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchEmail}
            style={{
              padding: "8px 16px",
              background: "var(--blue)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
              opacity: !searchEmail ? 0.6 : 1,
            }}
          >
            <Search size={13} /> {searching ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Found preview */}
        {foundRetailer && !foundRetailer.alreadyLinked && (
          <div
            style={{
              background: "#F0FDF4",
              border: "1px solid #86EFAC",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "#DCFCE7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "#16A34A",
                  fontSize: "0.95rem",
                  flexShrink: 0,
                }}
              >
                {foundRetailer.retailer.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                  {foundRetailer.retailer.businessName ||
                    foundRetailer.retailer.name}
                </div>
                <div
                  style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                >
                  {[foundRetailer.retailer.city, foundRetailer.retailer.phone]
                    .filter(Boolean)
                    .join(" • ")}
                </div>
              </div>
              <span
                style={{
                  background: "#DCFCE7",
                  color: "#16A34A",
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                }}
              >
                Found ✓
              </span>
            </div>
            <div style={{ borderTop: "1px solid #BBF7D0", paddingTop: 12 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 5,
                }}
              >
                Set Credit Limit (₹) — optional
              </label>
              <input
                className="input"
                type="number"
                placeholder="0 (no credit)"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>
          </div>
        )}

        {foundRetailer?.alreadyLinked && (
          <div
            style={{
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 14,
              fontSize: "0.83rem",
              color: "#D97706",
            }}
          >
            ⚠️ This retailer is already linked to your account.
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => setModal(null)}
            style={{
              padding: "8px 18px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleLink}
            disabled={linking || !foundRetailer || foundRetailer.alreadyLinked}
            style={{
              padding: "8px 20px",
              background:
                foundRetailer && !foundRetailer.alreadyLinked
                  ? "var(--blue)"
                  : "#CBD5E1",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor:
                foundRetailer && !foundRetailer.alreadyLinked
                  ? "pointer"
                  : "not-allowed",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            {linking ? "Linking..." : "Link Retailer"}
          </button>
        </div>
      </Modal>

      {/* ── CREATE MODAL ── */}
      <Modal
        open={modal === "create"}
        onClose={() => setModal(null)}
        title="Create New Retailer Account"
        width={520}
      >
        <p
          style={{
            fontSize: "0.83rem",
            color: "var(--text-muted)",
            marginBottom: 14,
          }}
        >
          Creates an account and links it to your network automatically.
        </p>
        <ErrBox msg={error} />
        <Field label="Business / Shop Name">
          <Inp
            placeholder="e.g. Sharma Kirana"
            value={cf.businessName}
            onChange={upd("businessName")}
          />
        </Field>
        <Row2>
          <Field label="Owner Name">
            <Inp
              placeholder="Full name"
              value={cf.name}
              onChange={upd("name")}
            />
          </Field>
          <Field label="City">
            <Inp placeholder="City" value={cf.city} onChange={upd("city")} />
          </Field>
        </Row2>
        <Row2>
          <Field label="Phone">
            <Inp
              placeholder="+91..."
              value={cf.phone}
              onChange={upd("phone")}
            />
          </Field>
          <Field label="Email">
            <Inp
              type="email"
              placeholder="email@..."
              value={cf.email}
              onChange={upd("email")}
            />
          </Field>
        </Row2>
        <Row2>
          <Field label="Password">
            <Inp
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={cf.password}
              onChange={upd("password")}
            />
          </Field>
          <Field label="Credit Limit (₹)">
            <Inp
              type="number"
              placeholder="0"
              value={cf.creditLimit}
              onChange={upd("creditLimit")}
            />
          </Field>
        </Row2>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 8,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={() => setModal(null)}
            style={{
              padding: "8px 18px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              padding: "8px 20px",
              background: "var(--blue)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            {creating ? "Creating..." : "Create & Link"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB: SALESMEN
// ─────────────────────────────────────────────────────────────
function SalesmenTab() {
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    password: "",
    route: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const d = await svc.getSalesmen();
      setSalesmen(d.salesmen);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    setSaving(true);
    setError("");
    try {
      await svc.createSalesman(form);
      setModal(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const fc = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2
          style={{
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 800,
            fontSize: "1.1rem",
          }}
        >
          Salesmen
        </h2>
        <button
          onClick={() => {
            setModal(true);
            setError("");
            setForm({
              name: "",
              email: "",
              phone: "",
              city: "",
              password: "",
              route: "",
            });
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            background: "var(--blue)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          <Plus size={15} /> Add Salesman
        </button>
      </div>

      <ErrBox msg={error} />

      {loading ? (
        <Spinner />
      ) : salesmen.length === 0 ? (
        <Empty
          icon="🧑‍💼"
          title="No salesmen yet"
          sub="Add your field sales team above"
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {salesmen.map((s) => (
            <div
              key={s._id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "18px 20px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    {s.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {s.businessName || "No route assigned"}
                  </div>
                </div>
                <Badge status={s.status} />
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                {s.phone && <div>📞 {s.phone}</div>}
                {s.city && <div>📍 {s.city}</div>}
              </div>
              {s.stats && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  {[
                    { label: "Total Orders", value: s.stats.totalOrders },
                    { label: "This Month", value: s.stats.monthlyOrders },
                  ].map((st) => (
                    <div
                      key={st.label}
                      style={{
                        background: "var(--bg)",
                        borderRadius: 8,
                        padding: "8px 10px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {st.label}
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "var(--blue)",
                          fontSize: "1.1rem",
                        }}
                      >
                        {st.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Add Salesman"
        width={480}
      >
        <ErrBox msg={error} />
        <Field label="Full Name">
          <Inp
            placeholder="Full name"
            value={form.name}
            onChange={fc("name")}
          />
        </Field>
        <Row2>
          <Field label="Email">
            <Inp
              type="email"
              placeholder="email@..."
              value={form.email}
              onChange={fc("email")}
            />
          </Field>
          <Field label="Phone">
            <Inp
              placeholder="+91..."
              value={form.phone}
              onChange={fc("phone")}
            />
          </Field>
        </Row2>
        <Row2>
          <Field label="City">
            <Inp placeholder="City" value={form.city} onChange={fc("city")} />
          </Field>
          <Field label="Route Name">
            <Inp
              placeholder="e.g. North Zone"
              value={form.route}
              onChange={fc("route")}
            />
          </Field>
        </Row2>
        <Field label="Login Password">
          <Inp
            type="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            value={form.password}
            onChange={fc("password")}
          />
        </Field>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={() => setModal(false)}
            style={{
              padding: "8px 18px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={saving}
            style={{
              padding: "8px 20px",
              background: "var(--blue)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            {saving ? "Adding..." : "Add Salesman"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB: CREDIT
// ─────────────────────────────────────────────────────────────
function CreditTab() {
  const [credits, setCredits] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'repay' | 'limit'
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const d = await svc.getAllCredit();
      setCredits(d.credits);
      setSummary(d.summary);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openRepay = (c) => {
    setSelected(c);
    setAmount("");
    setNote("");
    setError("");
    setModal("repay");
  };
  const openLimit = (c) => {
    setSelected(c);
    setLimit(c.creditLimit);
    setError("");
    setModal("limit");
  };

  const handleRepay = async () => {
    setSaving(true);
    setError("");
    try {
      await svc.recordRepayment(selected.retailer._id, Number(amount), note);
      setModal(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLimit = async () => {
    setSaving(true);
    setError("");
    try {
      await svc.updateCreditLimit(selected.retailer._id, Number(limit));
      setModal(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2
        style={{
          fontFamily: "Plus Jakarta Sans, sans-serif",
          fontWeight: 800,
          fontSize: "1.1rem",
        }}
      >
        Credit Management
      </h2>
      <ErrBox msg={error} />

      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {[
            {
              label: "Total Outstanding",
              value: fmt(summary.totalDue),
              color: "#D97706",
              bg: "#FFFBEB",
            },
            {
              label: "Overdue Accounts",
              value: summary.overdueCount,
              color: "#DC2626",
              bg: "#FEF2F2",
            },
            {
              label: "Blocked Accounts",
              value: summary.blockedCount,
              color: "#7C3AED",
              bg: "#F5F3FF",
            },
            {
              label: "Total Retailers",
              value: summary.total,
              color: "#2563EB",
              bg: "#EFF4FF",
            },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                background: c.bg,
                borderRadius: 12,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  color: c.color,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                {c.label}
              </div>
              <div
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: c.color,
                }}
              >
                {c.value}
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {loading ? (
          <Spinner />
        ) : credits.length === 0 ? (
          <Empty
            icon="💳"
            title="No credit records"
            sub="Credit records appear once retailers are linked and place orders on credit"
          />
        ) : (
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
                    background: "var(--bg)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {[
                    "Retailer",
                    "Current Due",
                    "Credit Limit",
                    "Last Payment",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {credits.map((c) => (
                  <tr
                    key={c._id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>
                        {c.retailer?.businessName || c.retailer?.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {c.retailer?.phone}
                      </div>
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 700,
                        color: c.currentDue > 0 ? "#DC2626" : "#16A34A",
                      }}
                    >
                      {fmt(c.currentDue)}
                    </td>
                    <td style={{ ...tdStyle, color: "var(--text-muted)" }}>
                      {fmt(c.creditLimit)}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        color: "var(--text-muted)",
                        fontSize: "0.78rem",
                      }}
                    >
                      {c.lastPaymentDate
                        ? new Date(c.lastPaymentDate).toLocaleDateString(
                            "en-IN",
                          )
                        : "—"}
                    </td>
                    <td style={tdStyle}>
                      <Badge status={c.status} />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => openRepay(c)}
                          style={{
                            padding: "4px 10px",
                            background: "#F0FDF4",
                            color: "#16A34A",
                            border: "1px solid #86EFAC",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Record Payment
                        </button>
                        <button
                          onClick={() => openLimit(c)}
                          style={{
                            padding: "4px 10px",
                            background: "var(--bg)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Set Limit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        open={modal === "repay"}
        onClose={() => setModal(null)}
        title={`Record Payment — ${selected?.retailer?.businessName || selected?.retailer?.name}`}
        width={380}
      >
        <p
          style={{
            fontSize: "0.83rem",
            color: "var(--text-muted)",
            marginBottom: 14,
          }}
        >
          Outstanding:{" "}
          <strong style={{ color: "#DC2626" }}>
            {fmt(selected?.currentDue)}
          </strong>
        </p>
        <ErrBox msg={error} />
        <Field label="Amount Received (₹)">
          <Inp
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Note (optional)" style={{ marginTop: 12 }}>
          <Inp
            placeholder="e.g. Cash payment"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={() => setModal(null)}
            style={{
              padding: "8px 18px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleRepay}
            disabled={saving || !amount}
            style={{
              padding: "8px 20px",
              background: "#16A34A",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            {saving ? "Saving..." : "Record Payment"}
          </button>
        </div>
      </Modal>

      {/* Set Limit Modal */}
      <Modal
        open={modal === "limit"}
        onClose={() => setModal(null)}
        title={`Update Credit Limit — ${selected?.retailer?.businessName || selected?.retailer?.name}`}
        width={360}
      >
        <ErrBox msg={error} />
        <Field label="New Credit Limit (₹)">
          <Inp
            type="number"
            placeholder="0"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </Field>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={() => setModal(null)}
            style={{
              padding: "8px 18px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleLimit}
            disabled={saving}
            style={{
              padding: "8px 20px",
              background: "var(--blue)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            {saving ? "Saving..." : "Update Limit"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export default function WholesalerDashboard() {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const titles = {
    dashboard: "Dashboard",
    orders: "Orders",
    products: "Products & Inventory",
    retailers: "Retailers",
    salesmen: "Salesmen",
    credit: "Credit Management",
    account: "My Account",
  };

  const renderContent = () => {
    switch (active) {
      case "dashboard":
        return <DashboardTab />;
      case "orders":
        return <OrdersTab />;
      case "products":
        return <ProductsTab />;
      case "retailers":
        return <RetailersTab />;
      case "salesmen":
        return <SalesmenTab />;
      case "credit":
        return <CreditTab />;
      case "account":
        return <AccountProfile />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <Sidebar
        active={active}
        setActive={setActive}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        style={{
          marginLeft: collapsed ? 60 : 232,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          transition: "margin-left 0.25s ease",
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
            padding: "0 28px",
            height: 60,
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
            flexShrink: 0,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {titles[active]}
            </h1>
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                marginTop: 1,
              }}
            >
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: "24px 28px 48px", flex: 1, minWidth: 0 }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
