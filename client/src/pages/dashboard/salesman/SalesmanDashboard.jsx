import { useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../../components/ui/Badges'
import StatCard from '../../../components/ui/StatCard'

// ── Mock Data ─────────────────────────────────────────────────────────────────

const retailers = [
  { id: 1, name: 'Sharma Traders',   area: 'Andheri West',  phone: '98765 43210', credit: '₹0',    lastOrder: 'Today',     status: 'Visited',   orders: 48 },
  { id: 2, name: 'New Bharat Store', area: 'Andheri East',  phone: '91234 56789', credit: '₹0',    lastOrder: 'Yesterday', status: 'Pending',   orders: 29 },
  { id: 3, name: "Priya's Kirana",   area: 'Borivali West', phone: '99887 76655', credit: '₹8.2K', lastOrder: 'Today',     status: 'Visited',   orders: 37 },
  { id: 4, name: 'Om Traders',       area: 'Malad West',    phone: '98112 33445', credit: '₹5K',   lastOrder: '3 days ago',status: 'Pending',   orders: 19 },
  { id: 5, name: 'Patel Mart',       area: 'Malad East',    phone: '90091 22334', credit: '₹0',    lastOrder: '2 days ago',status: 'Visited',   orders: 24 },
  { id: 6, name: 'Gupta Provision',  area: 'Kandivali',     phone: '88991 00223', credit: '₹12K',  lastOrder: '1 week ago',status: 'Pending',   orders: 14 },
]

const todayOrders = [
  { id: '#1049', retailer: 'Sharma Traders',   items: 8,  amount: '₹12,400', status: 'Pending',    time: '10:22 AM' },
  { id: '#1048', retailer: "Priya's Kirana",   items: 3,  amount: '₹4,800',  status: 'Approved',   time: '9:15 AM'  },
  { id: '#1047', retailer: 'Patel Mart',        items: 6,  amount: '₹9,200',  status: 'Dispatched', time: '8:50 AM'  },
]

const weeklyTarget = { current: 78, target: 100, label: '₹2.34L / ₹3L' }

const products = [
  { id: 1, name: 'Basmati Rice 25kg', price: 1850, unit: 'bag',    category: 'Grains' },
  { id: 2, name: 'Refined Oil 5L',    price: 680,  unit: 'tin',    category: 'Oil'    },
  { id: 3, name: 'Toor Dal 10kg',     price: 960,  unit: 'bag',    category: 'Pulses' },
  { id: 4, name: 'Sugar 50kg',        price: 2100, unit: 'bag',    category: 'Sugar'  },
  { id: 5, name: 'Wheat Flour 10kg',  price: 420,  unit: 'bag',    category: 'Grains' },
  { id: 6, name: 'Salt 1kg',          price: 22,   unit: 'pack',   category: 'Spices' },
]

// ── Sidebar ───────────────────────────────────────────────────────────────────
const navItems = [
  { icon: '📊', label: 'Dashboard',       id: 'dashboard' },
  { icon: '🏪', label: 'My Retailers',    id: 'retailers' },
  { icon: '📦', label: 'Place Order',     id: 'order'     },
  { icon: '📋', label: "Today's Orders",  id: 'orders'    },
  { icon: '📈', label: 'My Performance',  id: 'performance'},
]

function SalesmanSidebar({ active, setActive, collapsed, setCollapsed }) {
  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: collapsed ? 68 : 240,
      background: 'var(--navy-2)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 50, transition: 'width 0.3s ease',
      overflow: 'visible',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: collapsed ? '18px 0' : '18px 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid var(--border)', minHeight: 64, flexShrink: 0,
      }}>
        <div style={{ width:34, height:34, background:'var(--amber)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>📦</div>
        {!collapsed && <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'1.1rem', color:'var(--text)', whiteSpace:'nowrap' }}>Distro<span style={{ color:'var(--amber)' }}>OS</span></span>}
      </div>

      {/* Toggle */}
      <button onClick={() => setCollapsed(c => !c)}
        style={{ position:'absolute', top:18, right:-16, width:32, height:32, background:'var(--card)', border:'1px solid var(--border)', borderRadius:'50%', color:'var(--text-muted)', fontSize:'0.8rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', zIndex:60, boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }}
        onMouseEnter={e => { e.currentTarget.style.background='var(--amber)'; e.currentTarget.style.color='#0A1628' }}
        onMouseLeave={e => { e.currentTarget.style.background='var(--card)'; e.currentTarget.style.color='var(--text-muted)' }}
      >{collapsed ? '›' : '‹'}</button>

      {/* Nav */}
      <nav style={{ flex:1, padding:'16px 0 8px', overflowY:'auto', overflowX:'hidden' }}>
        {!collapsed && <div style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.1em', color:'var(--text-muted)', padding:'0 16px 8px', opacity:0.6 }}>MENU</div>}
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:12,
              padding: collapsed ? '11px 0' : '10px 16px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: active === item.id ? 'var(--amber)' : 'var(--text-muted)',
              background: active === item.id ? 'rgba(245,158,11,0.1)' : 'transparent',
              borderLeft: active === item.id ? '2px solid var(--amber)' : '2px solid transparent',
              border: 'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:500,
              transition:'all 0.15s', whiteSpace:'nowrap', fontFamily:'DM Sans,sans-serif',
            }}
            title={collapsed ? item.label : ''}
            onMouseEnter={e => { if (active !== item.id) { e.currentTarget.style.background='rgba(245,158,11,0.06)'; e.currentTarget.style.color='var(--text)' }}}
            onMouseLeave={e => { if (active !== item.id) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)' }}}
          >
            <span style={{ fontSize:'1.1rem', width:22, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Profile */}
      <div style={{ paddingBottom:16, borderTop:'1px solid var(--border)' }}>
        {!collapsed ? (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px 4px' }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--amber-dim)', border:'2px solid var(--amber)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:800, color:'var(--amber)', flexShrink:0 }}>AY</div>
            <div>
              <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text)' }}>Anil Yadav</div>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>Salesman · Route B</div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--amber-dim)', border:'2px solid var(--amber)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:800, color:'var(--amber)' }}>AY</div>
          </div>
        )}
        <Link to="/login" style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding: collapsed ? '11px 0' : '10px 16px', justifyContent: collapsed ? 'center' : 'flex-start', color:'var(--text-muted)', textDecoration:'none', fontSize:'0.875rem', marginTop:4 }}>
          <span style={{ fontSize:'1.1rem', width:22, textAlign:'center' }}>🚪</span>
          {!collapsed && <span>Logout</span>}
        </Link>
      </div>
    </aside>
  )
}

// ── Place Order on Behalf ─────────────────────────────────────────────────────
function PlaceOrderForRetailer() {
  const [selectedRetailer, setSelectedRetailer] = useState('')
  const [cart, setCart]   = useState({})
  const [submitted, setSubmitted] = useState(false)

  const addToCart    = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }))
  const removeFromCart = (id) => setCart(c => { const u = {...c}; if (u[id]>1) u[id]--; else delete u[id]; return u })
  const cartItems    = Object.entries(cart).map(([id,qty]) => ({ ...products.find(p=>p.id===+id), qty }))
  const cartTotal    = cartItems.reduce((s,i) => s + i.price * i.qty, 0)
  const cartCount    = cartItems.reduce((s,i) => s + i.qty, 0)

  if (submitted) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:16, textAlign:'center' }}>
      <div style={{ fontSize:'3.5rem' }}>✅</div>
      <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:'1.5rem', fontWeight:800 }}>Order Submitted!</h2>
      <p style={{ color:'var(--text-muted)' }}>Order placed for <strong style={{ color:'var(--amber)' }}>{retailers.find(r=>r.id===+selectedRetailer)?.name}</strong>. Awaiting wholesaler approval.</p>
      <button onClick={() => { setSubmitted(false); setCart({}); setSelectedRetailer('') }}
        style={{ padding:'12px 28px', background:'var(--amber)', color:'#0A1628', border:'none', borderRadius:9, fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:'0.9rem', cursor:'pointer', marginTop:8 }}>
        Place Another Order
      </button>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Retailer selector */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:20 }}>
        <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, marginBottom:14, fontSize:'0.95rem' }}>1. Select Retailer</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10 }}>
          {retailers.map(r => (
            <button key={r.id} onClick={() => setSelectedRetailer(r.id)}
              style={{
                padding:'14px 16px', background: selectedRetailer===r.id ? 'var(--amber-dim)' : 'var(--card-2)',
                border:`1.5px solid ${selectedRetailer===r.id ? 'var(--amber)' : 'var(--border)'}`,
                borderRadius:10, cursor:'pointer', textAlign:'left', transition:'all 0.15s',
                fontFamily:'DM Sans,sans-serif',
              }}>
              <div style={{ fontWeight:600, fontSize:'0.85rem', color: selectedRetailer===r.id ? 'var(--amber)' : 'var(--text)', marginBottom:3 }}>{r.name}</div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{r.area}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedRetailer && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20, alignItems:'start' }}>
          {/* Products */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:20 }}>
            <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, marginBottom:16, fontSize:'0.95rem' }}>2. Select Products</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
              {products.map(p => (
                <div key={p.id} style={{ background:'var(--card-2)', border:'1px solid var(--border)', borderRadius:10, padding:14 }}>
                  <div style={{ fontWeight:600, fontSize:'0.82rem', color:'var(--text)', marginBottom:4 }}>{p.name}</div>
                  <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, color:'var(--amber)', fontSize:'1rem', marginBottom:8 }}>₹{p.price.toLocaleString()}<span style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontFamily:'DM Sans,sans-serif', fontWeight:400 }}> /{p.unit}</span></div>
                  {cart[p.id] ? (
                    <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'space-between' }}>
                      <button onClick={() => removeFromCart(p.id)} style={{ width:26, height:26, borderRadius:6, border:'1px solid var(--border)', background:'var(--card)', color:'var(--text)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                      <span style={{ fontWeight:700, color:'var(--amber)' }}>{cart[p.id]}</span>
                      <button onClick={() => addToCart(p.id)} style={{ width:26, height:26, borderRadius:6, border:'none', background:'var(--amber)', color:'#0A1628', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>+</button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(p.id)} style={{ width:'100%', padding:'6px', background:'var(--amber-dim)', border:'1px solid rgba(245,158,11,0.2)', color:'var(--amber)', borderRadius:7, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.75rem' }}>+ Add</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', position:'sticky', top:80 }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'0.9rem' }}>🛒 Order Summary</div>
              <div style={{ fontSize:'0.72rem', color:'var(--amber)', marginTop:2 }}>For: {retailers.find(r=>r.id===selectedRetailer)?.name}</div>
            </div>
            <div style={{ padding:14, minHeight:140, display:'flex', flexDirection:'column', gap:8 }}>
              {cartCount === 0 ? (
                <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.82rem', padding:'24px 0' }}>No items added yet</div>
              ) : cartItems.map(item => (
                <div key={item.id} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem' }}>
                  <span style={{ color:'var(--text-muted)' }}>{item.name} x{item.qty}</span>
                  <span style={{ color:'var(--amber)', fontWeight:600 }}>₹{(item.price*item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>
            {cartCount > 0 && (
              <div style={{ borderTop:'1px solid var(--border)', padding:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                  <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Total</span>
                  <span style={{ fontFamily:'Sora,sans-serif', fontWeight:800, color:'var(--amber)' }}>₹{cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={() => setSubmitted(true)}
                  style={{ width:'100%', padding:'11px', background:'var(--amber)', color:'#0A1628', border:'none', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:'0.875rem', cursor:'pointer' }}>
                  Submit Order →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Performance Panel ─────────────────────────────────────────────────────────
function Performance() {
  const bars = [
    { day:'Mon', orders:12, revenue:36000 },
    { day:'Tue', orders:9,  revenue:27000 },
    { day:'Wed', orders:15, revenue:48000 },
    { day:'Thu', orders:11, revenue:34000 },
    { day:'Fri', orders:14, revenue:44000 },
    { day:'Sat', orders:7,  revenue:21000 },
    { day:'Sun', orders:0,  revenue:0     },
  ]
  const maxOrders = Math.max(...bars.map(b=>b.orders))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }}>
        <StatCard icon="📦" label="This Week Orders"  value="68"    delta="vs 54 last week"  deltaType="up"   color="amber"  />
        <StatCard icon="💰" label="This Week Revenue" value="₹2.1L" delta="+22% from last"   deltaType="up"   color="green"  />
        <StatCard icon="🏪" label="Retailers Visited" value="14"    delta="of 18 assigned"   deltaType="up"   color="teal"   />
        <StatCard icon="🎯" label="Target Achieved"   value="78%"   delta="₹2.34L / ₹3L"    deltaType="up"   color="purple" />
      </div>

      {/* Weekly bar chart */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
        <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, marginBottom:4, fontSize:'0.95rem' }}>📊 This Week's Daily Orders</div>
        <div style={{ fontSize:'0.775rem', color:'var(--text-muted)', marginBottom:20 }}>Orders placed per day this week</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:160 }}>
          {bars.map((b,i) => (
            <div key={b.day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, height:'100%', justifyContent:'flex-end' }}>
              <div style={{ fontSize:'0.72rem', color:'var(--amber)', fontWeight:700 }}>{b.orders > 0 ? b.orders : ''}</div>
              <div style={{
                width:'100%', borderRadius:'6px 6px 0 0',
                background: i === 4 ? 'var(--amber)' : 'var(--card-2)',
                border:`1px solid ${i===4 ? 'var(--amber)' : 'var(--border)'}`,
                height:`${maxOrders > 0 ? (b.orders/maxOrders)*100 : 0}%`,
                minHeight: b.orders > 0 ? 4 : 0,
                transition:'all 0.2s', cursor:'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.background='var(--amber)'; e.currentTarget.style.opacity='0.85' }}
                onMouseLeave={e => { e.currentTarget.style.background = i===4 ? 'var(--amber)' : 'var(--card-2)'; e.currentTarget.style.opacity='1' }}
              />
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{b.day}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Target progress */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'0.95rem', marginBottom:3 }}>🎯 Weekly Revenue Target</div>
            <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{weeklyTarget.label}</div>
          </div>
          <div style={{ fontFamily:'Sora,sans-serif', fontSize:'1.6rem', fontWeight:800, color:'var(--amber)' }}>{weeklyTarget.current}%</div>
        </div>
        <div style={{ height:10, background:'var(--card-2)', borderRadius:999, overflow:'hidden', marginBottom:8 }}>
          <div style={{ height:'100%', width:`${weeklyTarget.current}%`, background:'linear-gradient(90deg, var(--amber), var(--teal))', borderRadius:999, transition:'width 0.6s ease' }} />
        </div>
        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>₹0.66L more to hit this week's target</div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SalesmanDashboard() {
  const [active, setActive]       = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  const sidebarWidth = collapsed ? 68 : 240

  const pageTitle = {
    dashboard:   'Dashboard',
    retailers:   'My Retailers',
    order:       'Place Order',
    orders:      "Today's Orders",
    performance: 'My Performance',
  }[active]

  const renderPanel = () => {
    // ── My Retailers ──
    if (active === 'retailers') return (
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <div style={{ fontSize:'0.875rem', color:'var(--text-muted)' }}>6 retailers assigned to your route</div>
          <div style={{ display:'flex', gap:8 }}>
            {['All','Visited','Pending'].map(f => (
              <button key={f} style={{ padding:'6px 14px', borderRadius:7, border:'1px solid var(--border)', background:'var(--card)', color:'var(--text-muted)', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>{f}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {retailers.map(r => (
            <div key={r.id} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:20, display:'flex', flexDirection:'column', gap:14, transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(245,158,11,0.25)'; e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text)', marginBottom:3 }}>{r.name}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>📍 {r.area}</div>
                </div>
                <Badge status={r.status} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { label:'Phone',      value: r.phone },
                  { label:'Last Order', value: r.lastOrder },
                  { label:'Total Orders', value: r.orders },
                  { label:'Credit Due', value: r.credit, color: r.credit !== '₹0' ? 'var(--red)' : 'var(--green)' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>{f.label}</div>
                    <div style={{ fontSize:'0.82rem', fontWeight:600, color: f.color || 'var(--text)' }}>{f.value}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setActive('order')}
                style={{ width:'100%', padding:'8px', background:'var(--amber-dim)', border:'1px solid rgba(245,158,11,0.2)', color:'var(--amber)', borderRadius:8, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.8rem' }}>
                📦 Place Order
              </button>
            </div>
          ))}
        </div>
      </div>
    )

    if (active === 'order')       return <PlaceOrderForRetailer />
    if (active === 'performance') return <Performance />

    // ── Today's Orders ──
    if (active === 'orders') return (
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'0.95rem', marginBottom:3 }}>📦 Today's Orders</div>
            <div style={{ fontSize:'0.775rem', color:'var(--text-muted)' }}>Orders placed by you today</div>
          </div>
          <span style={{ background:'var(--amber-dim)', color:'var(--amber)', fontSize:'0.8rem', fontWeight:700, padding:'4px 14px', borderRadius:999 }}>3 orders</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.83rem' }}>
            <thead>
              <tr style={{ background:'var(--card-2)', borderBottom:'1px solid var(--border)' }}>
                {['Order ID','Retailer','Items','Amount','Time','Status'].map(h => (
                  <th key={h} style={{ padding:'11px 18px', textAlign:'left', fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todayOrders.map(o => (
                <tr key={o.id}
                  style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'13px 18px', fontFamily:'Sora,sans-serif', fontWeight:600, color:'var(--amber)' }}>{o.id}</td>
                  <td style={{ padding:'13px 18px', color:'var(--text)', fontWeight:500 }}>{o.retailer}</td>
                  <td style={{ padding:'13px 18px', color:'var(--text-muted)' }}>{o.items} items</td>
                  <td style={{ padding:'13px 18px', color:'var(--text)', fontWeight:600 }}>{o.amount}</td>
                  <td style={{ padding:'13px 18px', color:'var(--text-muted)', fontSize:'0.78rem' }}>{o.time}</td>
                  <td style={{ padding:'13px 18px' }}><Badge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )

    // ── Dashboard Overview ──
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
          <StatCard icon="📦" label="Today's Orders"    value="3"    delta="vs 5 yesterday"   deltaType="down" color="amber"  />
          <StatCard icon="💰" label="Today's Revenue"   value="₹26K" delta="+8% from avg"     deltaType="up"   color="green"  />
          <StatCard icon="🏪" label="Retailers Visited" value="2/6"  delta="4 pending today"  deltaType="neutral" color="teal" />
          <StatCard icon="🎯" label="Weekly Target"     value="78%"  delta="₹0.66L remaining" deltaType="up"   color="purple" />
        </div>

        {/* Today's route */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
          <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, marginBottom:16, fontSize:'0.95rem' }}>🗺️ Today's Route — Andheri &amp; Borivali</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {retailers.slice(0,4).map((r,i) => (
              <div key={r.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', background:'var(--card-2)', borderRadius:10, border:'1px solid var(--border)' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background: r.status==='Visited' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, color: r.status==='Visited' ? 'var(--green)' : 'var(--amber)', flexShrink:0 }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:'0.875rem', color:'var(--text)' }}>{r.name}</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{r.area}</div>
                </div>
                <Badge status={r.status} />
                {r.status === 'Pending' && (
                  <button onClick={() => setActive('order')}
                    style={{ padding:'5px 12px', background:'var(--amber-dim)', border:'1px solid rgba(245,158,11,0.25)', color:'var(--amber)', borderRadius:7, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.75rem' }}>
                    Order
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Today's orders preview */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'0.95rem' }}>📦 Today's Orders</div>
            <button onClick={() => setActive('orders')} style={{ fontSize:'0.78rem', color:'var(--amber)', background:'transparent', border:'1px solid var(--border)', borderRadius:7, padding:'5px 14px', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:600 }}>View All →</button>
          </div>
          <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
            {todayOrders.map(o => (
              <div key={o.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', background:'var(--card-2)', borderRadius:9 }}>
                <div>
                  <span style={{ fontFamily:'Sora,sans-serif', fontWeight:600, color:'var(--amber)', fontSize:'0.82rem', marginRight:10 }}>{o.id}</span>
                  <span style={{ fontSize:'0.82rem', color:'var(--text)' }}>{o.retailer}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontWeight:700, color:'var(--text)', fontSize:'0.875rem' }}>{o.amount}</span>
                  <Badge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly target bar */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'0.95rem', marginBottom:3 }}>🎯 Weekly Target Progress</div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{weeklyTarget.label}</div>
            </div>
            <div style={{ fontFamily:'Sora,sans-serif', fontSize:'1.8rem', fontWeight:800, color:'var(--amber)' }}>{weeklyTarget.current}%</div>
          </div>
          <div style={{ height:10, background:'var(--card-2)', borderRadius:999, overflow:'hidden', marginBottom:8 }}>
            <div style={{ height:'100%', width:`${weeklyTarget.current}%`, background:'linear-gradient(90deg, var(--amber), var(--teal))', borderRadius:999, transition:'width 0.6s ease' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>₹0.66L more to hit target</span>
            <button onClick={() => setActive('performance')} style={{ fontSize:'0.75rem', color:'var(--amber)', background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:600 }}>View Full Report →</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--navy)', fontFamily:'DM Sans,sans-serif' }}>
      <SalesmanSidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} />

      <div style={{ marginLeft:sidebarWidth, flex:1, display:'flex', flexDirection:'column', transition:'margin-left 0.3s ease', minWidth:0 }}>
        {/* Topbar */}
        <header style={{
          position:'sticky', top:0, zIndex:40,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 32px', height:64,
          background:'rgba(10,22,40,0.92)', backdropFilter:'blur(12px)',
          borderBottom:'1px solid var(--border)',
        }}>
          <div>
            <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:'1.1rem', fontWeight:700, color:'var(--text)' }}>{pageTitle}</h1>
            <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:1 }}>Anil Yadav · Route B — Andheri &amp; Borivali</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => setActive('order')}
              style={{ padding:'8px 18px', background:'var(--amber)', color:'#0A1628', border:'none', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:'0.85rem', cursor:'pointer' }}>
              📦 New Order
            </button>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--amber-dim)', border:'2px solid var(--amber)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:800, color:'var(--amber)', cursor:'pointer' }}>AY</div>
          </div>
        </header>

        <main style={{ padding:'28px 32px 48px', flex:1 }}>
          {renderPanel()}
        </main>
      </div>
    </div>
  )
}
