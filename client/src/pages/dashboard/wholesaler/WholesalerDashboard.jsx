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
  User,
  Bell
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getAccessToken } from "../../../context/AuthContext";
import { apiClient as api } from "../../../api/client";
import BrandLogo from "../../../components/ui/BrandLogo";
import AccountProfile from "../../../components/shared/AccountProfile";
import AccountSystemDropdown from "../../../components/shared/AccountSystemDropdown";
import WholesalerSidebar from "./components/WholesalerSidebar";
import DashboardOverviewTab from "./views/DashboardOverviewTab";
import OrdersTab from "./views/OrdersTab";
import RetailerDetailView from "./views/RetailerDetailView";
import SmartReorderTab from "./views/SmartReorderTab";
import InventoryIntelligenceTab from "./views/InventoryIntelligenceTab";
import CreditIntelligenceTab from "./views/CreditIntelligenceTab";
import ProductsTab from "./views/ProductsTab";
import RetailersTab from "./views/RetailersTab";
import SalesmenTab from "./views/SalesmenTab";
import PaymentsTab from "./views/PaymentsTab";
import AnalyticsTab from "./views/AnalyticsTab";



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
// TAB: RETAILERS (Imported modularly from ./views/RetailersTab.jsx)
// ─────────────────────────────────────────────────────────────





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
  const { user } = useAuth();
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const titles = {
    dashboard: "Dashboard",
    analytics: "Analytics Workspace",
    orders: "Orders",
    products: "Products",
    "inventory-intelligence": "Inventory Intelligence",
    "smart-reorder": "Smart Reorder Recommendations",
    retailers: "Retailers",
    salesmen: "Salesmen",
    credit: "Credit Intelligence Platform",
    "credit-intelligence": "Credit Intelligence Platform",
    payments: "Payments Workspace",
    account: "My Account",
  };

  const renderContent = () => {
    switch (active) {
      case "dashboard":
        return <DashboardOverviewTab onNavigate={setActive} />;
      case "analytics":
        return <AnalyticsTab onNavigate={setActive} />;
      case "orders":
        return <OrdersTab />;

      case "products":
        return <ProductsTab />;
      case "inventory-intelligence":
        return <InventoryIntelligenceTab />;
      case "smart-reorder":
        return <SmartReorderTab />;
      case "retailers":
        return <RetailersTab />;
      case "salesmen":
        return <SalesmenTab />;
      case "credit":
      case "credit-intelligence":
        return <CreditIntelligenceTab />;
      case "payments":
        return <PaymentsTab />;
      case "account":
        return <AccountProfile />;
      default:
        return <DashboardOverviewTab onNavigate={setActive} />;
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

      <WholesalerSidebar
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

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Quick Search */}
            <div style={{ position: "relative", width: 220 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-faint)",
                }}
              />
              <input
                className="input"
                placeholder="Search catalog..."
                style={{
                  paddingLeft: 30,
                  height: 34,
                  fontSize: "0.78rem",
                  background: "var(--bg)",
                }}
              />
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setActive("dashboard")}
              style={{
                position: "relative",
                padding: 6,
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Notifications"
            >
              <Bell size={18} />
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--blue)",
                }}
              />
            </button>

            {/* Account System Dropdown */}
            <div style={{ paddingLeft: 12, borderLeft: "1px solid var(--border)" }}>
              <AccountSystemDropdown />
            </div>
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
