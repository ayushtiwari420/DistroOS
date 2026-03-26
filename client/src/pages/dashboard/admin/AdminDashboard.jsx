import { useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../../components/ui/Badges'
import StatCard from '../../../components/ui/StatCard'

// ── Mock Data ─────────────────────────────────────────────────────────────────

const wholesalers = [
  { id: 1, name: 'Mehta Traders',      owner: 'Rajesh Mehta',   city: 'Mumbai',    retailers: 128, salesmen: 6,  revenue: '₹3.4L', plan: 'Pro',   status: 'Active',  joined: 'Jan 12, 2026' },
  { id: 2, name: 'Gujarat Foods',      owner: 'Suresh Patel',   city: 'Ahmedabad', retailers: 84,  salesmen: 4,  revenue: '₹2.1L', plan: 'Basic', status: 'Pending', joined: 'Feb 14, 2026' },
  { id: 3, name: 'Delhi Provisions',   owner: 'Amit Sharma',    city: 'Delhi',     retailers: 210, salesmen: 11, revenue: '₹7.8L', plan: 'Pro',   status: 'Active',  joined: 'Nov 5, 2025'  },
  { id: 4, name: 'Bangalore Distro',   owner: 'Kiran Rao',      city: 'Bangalore', retailers: 96,  salesmen: 5,  revenue: '₹2.9L', plan: 'Pro',   status: 'Active',  joined: 'Dec 20, 2025' },
  { id: 5, name: 'Pune Wholesale',     owner: 'Vijay Kulkarni', city: 'Pune',      retailers: 61,  salesmen: 3,  revenue: '₹1.4L', plan: 'Basic', status: 'Active',  joined: 'Feb 1, 2026'  },
  { id: 6, name: 'Surat Traders',      owner: 'Hemant Shah',    city: 'Surat',     retailers: 43,  salesmen: 2,  revenue: '₹0.9L', plan: 'Basic', status: 'Suspended',joined: 'Oct 15, 2025' },
]

const recentActivity = [
  { icon: '🏢', text: 'Gujarat Foods registered — awaiting approval', time: '2h ago',  type: 'new'     },
  { icon: '💳', text: 'Mehta Traders upgraded to Pro plan',            time: '5h ago',  type: 'upgrade' },
  { icon: '⚠️', text: 'Surat Traders account suspended',              time: '1d ago',  type: 'alert'   },
  { icon: '✅', text: 'Delhi Provisions onboarding completed',         time: '2d ago',  type: 'success' },
  { icon: '📦', text: '1,248 orders processed platform-wide today',   time: '3d ago',  type: 'info'    },
  { icon: '🆕', text: 'Bangalore Distro added 12 new retailers',       time: '4d ago',  type: 'info'    },
]

const planStats = [
  { plan: 'Pro',   count: 2, color: 'var(--amber)', revenue: '₹3.2L/mo' },
  { plan: 'Basic', count: 3, color: 'var(--teal)',  revenue: '₹0.9L/mo' },
  { plan: 'Trial', count: 1, color: 'var(--text-muted)', revenue: '₹0' },
]

const monthlyRevenue = [
  { month: 'Sep', val: 62 },
  { month: 'Oct', val: 74 },
  { month: 'Nov', val: 81 },
  { month: 'Dec', val: 90 },
  { month: 'Jan', val: 85 },
  { month: 'Feb', val: 100 },
]

// ── Sidebar ───────────────────────────────────────────────────────────────────
const navItems = [
  { icon: '📊', label: 'Overview',      id: 'overview'     },
  { icon: '🏢', label: 'Wholesalers',   id: 'wholesalers'  },
  { icon: '💳', label: 'Subscriptions', id: 'subscriptions'},
  { icon: '📈', label: 'Analytics',     id: 'analytics'    },
  { icon: '🔔', label: 'Alerts',        id: 'alerts'       },
]

function AdminSidebar({ active, setActive, collapsed, setCollapsed }) {
  return (
    <aside style={{
      position:'fixed', top:0, left:0, bottom:0,
      width: collapsed ? 68 : 240,
      background:'var(--navy-2)',
      borderRight:'1px solid var(--border)',
      display:'flex', flexDirection:'column',
      zIndex:50, transition:'width 0.3s ease',
      overflow:'visible',
    }}>
      {/* Logo */}
      <div style={{
        display:'flex', alignItems:'center', gap:10,
        padding: collapsed ? '18px 0' : '18px 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom:'1px solid var(--border)', minHeight:64, flexShrink:0,
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
        {!collapsed && <div style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.1em', color:'var(--text-muted)', padding:'0 16px 8px', opacity:0.6 }}>ADMIN PANEL</div>}
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:12,
              padding: collapsed ? '11px 0' : '10px 16px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: active===item.id ? 'var(--amber)' : 'var(--text-muted)',
              background: active===item.id ? 'rgba(245,158,11,0.1)' : 'transparent',
              borderLeft: active===item.id ? '2px solid var(--amber)' : '2px solid transparent',
              border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:500,
              transition:'all 0.15s', whiteSpace:'nowrap', fontFamily:'DM Sans,sans-serif',
            }}
            title={collapsed ? item.label : ''}
            onMouseEnter={e => { if (active!==item.id) { e.currentTarget.style.background='rgba(245,158,11,0.06)'; e.currentTarget.style.color='var(--text)' }}}
            onMouseLeave={e => { if (active!==item.id) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)' }}}
          >
            <span style={{ fontSize:'1.1rem', width:22, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && item.id==='alerts' && (
              <span style={{ background:'var(--red)', color:'white', fontSize:'0.62rem', fontWeight:800, padding:'1px 6px', borderRadius:999, marginLeft:'auto' }}>2</span>
            )}
          </button>
        ))}
      </nav>

      {/* Profile */}
      <div style={{ paddingBottom:16, borderTop:'1px solid var(--border)' }}>
        {!collapsed ? (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px 4px' }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(139,92,246,0.15)', border:'2px solid #8B5CF6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:800, color:'#8B5CF6', flexShrink:0 }}>SA</div>
            <div>
              <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text)' }}>Super Admin</div>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>Platform Owner</div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(139,92,246,0.15)', border:'2px solid #8B5CF6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:800, color:'#8B5CF6' }}>SA</div>
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

// ── Wholesalers Panel ─────────────────────────────────────────────────────────
function WholesalersPanel() {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(null)

  const filtered = wholesalers.filter(w =>
    (filter === 'All' || w.status === filter) &&
    w.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Toolbar */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:'0.85rem' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search wholesalers..."
            style={{ width:'100%', padding:'9px 14px 9px 36px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:9, color:'var(--text)', fontFamily:'DM Sans,sans-serif', fontSize:'0.875rem', outline:'none' }} />
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['All','Active','Pending','Suspended'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'8px 14px', borderRadius:8, border:'1px solid', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:'0.78rem', fontWeight:600, transition:'all 0.15s', background: filter===f ? 'var(--amber-dim)' : 'var(--card)', borderColor: filter===f ? 'rgba(245,158,11,0.4)' : 'var(--border)', color: filter===f ? 'var(--amber)' : 'var(--text-muted)' }}>{f}</button>
          ))}
        </div>
        <button style={{ padding:'9px 18px', background:'var(--amber)', color:'#0A1628', border:'none', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:'0.85rem', cursor:'pointer' }}>
          + Add Wholesaler
        </button>
      </div>

      {/* Table */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.83rem' }}>
            <thead>
              <tr style={{ background:'var(--card-2)', borderBottom:'1px solid var(--border)' }}>
                {['Business','Owner','City','Retailers','Salesmen','Revenue','Plan','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => (
                <tr key={w.id}
                  style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'13px 16px', color:'var(--text)', fontWeight:600, whiteSpace:'nowrap' }}>{w.name}</td>
                  <td style={{ padding:'13px 16px', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{w.owner}</td>
                  <td style={{ padding:'13px 16px', color:'var(--text-muted)' }}>{w.city}</td>
                  <td style={{ padding:'13px 16px', color:'var(--text)', fontWeight:600 }}>{w.retailers}</td>
                  <td style={{ padding:'13px 16px', color:'var(--text-muted)' }}>{w.salesmen}</td>
                  <td style={{ padding:'13px 16px', color:'var(--green)', fontWeight:600 }}>{w.revenue}</td>
                  <td style={{ padding:'13px 16px' }}>
                    <span style={{ background: w.plan==='Pro' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)', color: w.plan==='Pro' ? 'var(--amber)' : 'var(--text-muted)', padding:'3px 10px', borderRadius:6, fontSize:'0.72rem', fontWeight:700 }}>{w.plan}</span>
                  </td>
                  <td style={{ padding:'13px 16px' }}><Badge status={w.status} /></td>
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => setShowModal(w)}
                        style={{ padding:'4px 10px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', color:'var(--amber)', borderRadius:6, cursor:'pointer', fontSize:'0.72rem', fontWeight:600, fontFamily:'DM Sans,sans-serif' }}>View</button>
                      {w.status === 'Pending' && (
                        <button style={{ padding:'4px 10px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', color:'var(--green)', borderRadius:6, cursor:'pointer', fontSize:'0.72rem', fontWeight:600, fontFamily:'DM Sans,sans-serif' }}>Approve</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}
          onClick={() => setShowModal(null)}>
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:32, width:'100%', maxWidth:480, boxShadow:'0 30px 60px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
              <div>
                <h2 style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:'1.3rem', marginBottom:4 }}>{showModal.name}</h2>
                <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Joined {showModal.joined}</p>
              </div>
              <button onClick={() => setShowModal(null)} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', color:'var(--text-muted)', fontSize:'1rem' }}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
              {[
                { label:'Owner',      value: showModal.owner },
                { label:'City',       value: showModal.city },
                { label:'Plan',       value: showModal.plan },
                { label:'Status',     value: showModal.status },
                { label:'Retailers',  value: showModal.retailers },
                { label:'Salesmen',   value: showModal.salesmen },
                { label:'Revenue',    value: showModal.revenue },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{f.label}</div>
                  <div style={{ fontSize:'0.9rem', fontWeight:600, color:'var(--text)' }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              {showModal.status==='Pending' && (
                <button onClick={() => setShowModal(null)} style={{ flex:1, padding:'11px', background:'var(--green)', color:'white', border:'none', borderRadius:9, fontFamily:'DM Sans,sans-serif', fontWeight:700, cursor:'pointer' }}>✓ Approve</button>
              )}
              <button onClick={() => setShowModal(null)} style={{ flex:1, padding:'11px', background:'rgba(239,68,68,0.1)', color:'var(--red)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:9, fontFamily:'DM Sans,sans-serif', fontWeight:700, cursor:'pointer' }}>Suspend</button>
              <button onClick={() => setShowModal(null)} style={{ flex:1, padding:'11px', background:'var(--card-2)', color:'var(--text-muted)', border:'1px solid var(--border)', borderRadius:9, fontFamily:'DM Sans,sans-serif', fontWeight:600, cursor:'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Subscriptions Panel ───────────────────────────────────────────────────────
function SubscriptionsPanel() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
        <StatCard icon="💰" label="Monthly Revenue"   value="₹4.1L"  delta="+18% from last month" deltaType="up"  color="green"  />
        <StatCard icon="👑" label="Pro Subscribers"   value="2"      delta="₹3.2L revenue"        deltaType="up"  color="amber"  />
        <StatCard icon="📦" label="Basic Subscribers" value="3"      delta="₹0.9L revenue"        deltaType="up"  color="teal"   />
        <StatCard icon="🆓" label="Trial Accounts"    value="1"      delta="Expiring in 5 days"   deltaType="down" color="red"   />
      </div>

      {/* Plan cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16 }}>
        {[
          { name:'Basic',    price:'₹999/mo',  color:'var(--teal)',  features:['Up to 50 retailers','2 salesmen','Order management','Basic analytics'], count:3 },
          { name:'Pro',      price:'₹2,499/mo', color:'var(--amber)', features:['Unlimited retailers','Unlimited salesmen','Full analytics','Credit management','Priority support'], count:2, popular:true },
          { name:'Enterprise',price:'Custom',   color:'#8B5CF6',      features:['Multi-city support','Custom integrations','Dedicated support','White labeling'], count:0 },
        ].map(plan => (
          <div key={plan.name} style={{ background:'var(--card)', border:`1px solid ${plan.popular ? plan.color : 'var(--border)'}`, borderRadius:16, padding:24, position:'relative', overflow:'hidden' }}>
            {plan.popular && <div style={{ position:'absolute', top:14, right:14, background:'var(--amber)', color:'#0A1628', fontSize:'0.65rem', fontWeight:800, padding:'2px 8px', borderRadius:999 }}>POPULAR</div>}
            <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:'1.1rem', marginBottom:4, color: plan.color }}>{plan.name}</div>
            <div style={{ fontFamily:'Sora,sans-serif', fontSize:'1.6rem', fontWeight:800, marginBottom:4 }}>{plan.price}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:16 }}>{plan.count} active subscriber{plan.count!==1?'s':''}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.82rem', color:'var(--text-muted)' }}>
                  <span style={{ color:plan.color, flexShrink:0 }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Analytics Panel ───────────────────────────────────────────────────────────
function AnalyticsPanel() {
  const maxVal = Math.max(...monthlyRevenue.map(m => m.val))
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
        <StatCard icon="🏢" label="Total Wholesalers"  value="6"      delta="+2 this month"       deltaType="up"  color="amber"  />
        <StatCard icon="🏪" label="Total Retailers"    value="622"    delta="across all networks"  deltaType="up"  color="teal"   />
        <StatCard icon="📦" label="Orders This Month"  value="4,821"  delta="+19% from last month" deltaType="up"  color="green"  />
        <StatCard icon="👥" label="Total Salesmen"     value="31"     delta="across all accounts"  deltaType="up"  color="purple" />
      </div>

      {/* Platform revenue chart */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
        <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, marginBottom:4, fontSize:'0.95rem' }}>📈 Platform Monthly Revenue</div>
        <div style={{ fontSize:'0.775rem', color:'var(--text-muted)', marginBottom:20 }}>Total subscription + usage revenue (₹ in thousands)</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:12, height:180 }}>
          {monthlyRevenue.map((m, i) => (
            <div key={m.month} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, height:'100%', justifyContent:'flex-end' }}>
              <div style={{ fontSize:'0.72rem', color:'var(--amber)', fontWeight:700 }}>₹{m.val}K</div>
              <div style={{
                width:'100%', borderRadius:'6px 6px 0 0',
                background: i===monthlyRevenue.length-1 ? 'var(--amber)' : 'var(--card-2)',
                border:`1px solid ${i===monthlyRevenue.length-1 ? 'var(--amber)' : 'var(--border)'}`,
                height:`${(m.val/maxVal)*100}%`,
                transition:'all 0.2s', cursor:'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.background='var(--amber)'; e.currentTarget.style.opacity='0.85' }}
                onMouseLeave={e => { e.currentTarget.style.background = i===monthlyRevenue.length-1 ? 'var(--amber)' : 'var(--card-2)'; e.currentTarget.style.opacity='1' }}
              />
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{m.month}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wholesaler performance table */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'0.95rem' }}>🏆 Top Performing Wholesalers</div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.83rem' }}>
            <thead>
              <tr style={{ background:'var(--card-2)', borderBottom:'1px solid var(--border)' }}>
                {['#','Business','City','Retailers','Orders/Mo','Revenue','Plan'].map(h => (
                  <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wholesalers.filter(w=>w.status==='Active').sort((a,b) => parseInt(b.revenue) - parseInt(a.revenue)).map((w,i) => (
                <tr key={w.id}
                  style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'13px 16px', fontFamily:'Sora,sans-serif', fontWeight:700, color: i===0 ? 'var(--amber)' : 'var(--text)' }}>{i+1}</td>
                  <td style={{ padding:'13px 16px', color:'var(--text)', fontWeight:600 }}>{w.name}</td>
                  <td style={{ padding:'13px 16px', color:'var(--text-muted)' }}>{w.city}</td>
                  <td style={{ padding:'13px 16px', color:'var(--text)' }}>{w.retailers}</td>
                  <td style={{ padding:'13px 16px', color:'var(--text-muted)' }}>~{Math.round(w.retailers * 3.8)}</td>
                  <td style={{ padding:'13px 16px', color:'var(--green)', fontWeight:600 }}>{w.revenue}</td>
                  <td style={{ padding:'13px 16px' }}>
                    <span style={{ background: w.plan==='Pro' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)', color: w.plan==='Pro' ? 'var(--amber)' : 'var(--text-muted)', padding:'3px 10px', borderRadius:6, fontSize:'0.72rem', fontWeight:700 }}>{w.plan}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Alerts Panel ──────────────────────────────────────────────────────────────
function AlertsPanel() {
  const alerts = [
    { icon:'⚠️', title:'Trial Expiring',       desc:'Gujarat Foods trial expires in 5 days. No payment method added.', type:'warning', time:'Now'    },
    { icon:'🔴', title:'Account Suspended',    desc:'Surat Traders suspended due to unpaid subscription for 30+ days.', type:'danger',  time:'1d ago' },
    { icon:'🆕', title:'New Registration',     desc:'Gujarat Foods registered and awaiting admin approval.',            type:'info',    time:'2h ago' },
    { icon:'📦', title:'High Order Volume',    desc:'Delhi Provisions processed 340 orders today — highest this month.',type:'success', time:'3h ago' },
    { icon:'💳', title:'Payment Failed',       desc:'Surat Traders Pro subscription payment declined.',                 type:'danger',  time:'2d ago' },
    { icon:'✅', title:'Onboarding Complete',  desc:'Bangalore Distro completed setup and placed first orders.',        type:'success', time:'3d ago' },
  ]

  const typeColors = {
    warning: { bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)', dot:'var(--amber)' },
    danger:  { bg:'rgba(239,68,68,0.08)',  border:'rgba(239,68,68,0.2)',  dot:'var(--red)'   },
    info:    { bg:'rgba(6,182,212,0.08)',  border:'rgba(6,182,212,0.2)',  dot:'var(--teal)'  },
    success: { bg:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.2)', dot:'var(--green)' },
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:'0.875rem', color:'var(--text-muted)', marginBottom:4 }}>6 alerts — 2 require immediate attention</div>
      {alerts.map((a, i) => {
        const c = typeColors[a.type]
        return (
          <div key={i} style={{ display:'flex', gap:16, padding:'18px 20px', background:c.bg, border:`1px solid ${c.border}`, borderRadius:12, transition:'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform='translateX(4px)'}
            onMouseLeave={e => e.currentTarget.style.transform='translateX(0)'}>
            <div style={{ width:40, height:40, borderRadius:10, background:`${c.dot}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 }}>{a.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text)' }}>{a.title}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{a.time}</div>
              </div>
              <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', lineHeight:1.5 }}>{a.desc}</div>
            </div>
            <div style={{ width:8, height:8, borderRadius:'50%', background:c.dot, flexShrink:0, marginTop:6, boxShadow:`0 0 6px ${c.dot}` }} />
          </div>
        )
      })}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [active, setActive]       = useState('overview')
  const [collapsed, setCollapsed] = useState(false)

  const sidebarWidth = collapsed ? 68 : 240

  const pageTitle = {
    overview:      'Platform Overview',
    wholesalers:   'Manage Wholesalers',
    subscriptions: 'Subscriptions',
    analytics:     'Analytics',
    alerts:        'Alerts & Notifications',
  }[active]

  const renderPanel = () => {
    if (active === 'wholesalers')   return <WholesalersPanel />
    if (active === 'subscriptions') return <SubscriptionsPanel />
    if (active === 'analytics')     return <AnalyticsPanel />
    if (active === 'alerts')        return <AlertsPanel />

    // ── Overview ──
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
          <StatCard icon="🏢" label="Total Wholesalers"  value="6"      delta="+2 this month"        deltaType="up"  color="amber"  />
          <StatCard icon="💰" label="Platform Revenue"   value="₹4.1L"  delta="+18% from last month" deltaType="up"  color="green"  />
          <StatCard icon="🏪" label="Total Retailers"    value="622"    delta="across all networks"   deltaType="up"  color="teal"   />
          <StatCard icon="📦" label="Orders This Month"  value="4,821"  delta="+19% MoM"             deltaType="up"  color="purple" />
          <StatCard icon="⏳" label="Pending Approvals"  value="1"      delta="Gujarat Foods"         deltaType="neutral" color="amber" />
          <StatCard icon="⚙️" label="System Uptime"     value="99.8%"  delta="Last 30 days"         deltaType="up"  color="green"  />
        </div>

        {/* Plan distribution */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:22 }}>
            <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, marginBottom:18, fontSize:'0.95rem' }}>📊 Plan Distribution</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {planStats.map(p => (
                <div key={p.plan}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--text)' }}>{p.plan} Plan</span>
                    <span style={{ fontSize:'0.82rem', color: p.color, fontWeight:700 }}>{p.count} accounts · {p.revenue}</span>
                  </div>
                  <div style={{ height:6, background:'var(--card-2)', borderRadius:999, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${(p.count/wholesalers.length)*100}%`, background: p.color, borderRadius:999, transition:'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
            <div style={{ padding:'18px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'0.95rem' }}>🕐 Recent Activity</div>
              <button onClick={() => setActive('alerts')} style={{ fontSize:'0.75rem', color:'var(--amber)', background:'transparent', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:600 }}>View All →</button>
            </div>
            <div style={{ padding:'8px 0' }}>
              {recentActivity.slice(0,5).map((a,i) => (
                <div key={i} style={{ display:'flex', gap:12, padding:'10px 20px', transition:'background 0.15s', cursor:'default' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <div style={{ width:32, height:32, borderRadius:8, background:'var(--card-2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>{a.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'0.82rem', color:'var(--text)', lineHeight:1.4, marginBottom:2 }}>{a.text}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending approvals */}
        <div style={{ background:'var(--card)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:14, padding:22 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'0.95rem' }}>⏳ Pending Approvals</div>
            <span style={{ background:'var(--amber-dim)', color:'var(--amber)', fontSize:'0.78rem', fontWeight:700, padding:'3px 12px', borderRadius:999 }}>1 pending</span>
          </div>
          {wholesalers.filter(w=>w.status==='Pending').map(w => (
            <div key={w.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', background:'var(--card-2)', borderRadius:10, border:'1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight:700, color:'var(--text)', marginBottom:3 }}>{w.name}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{w.owner} · {w.city} · Joined {w.joined}</div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button style={{ padding:'8px 18px', background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.25)', color:'var(--green)', borderRadius:8, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:'0.82rem' }}>✓ Approve</button>
                <button style={{ padding:'8px 18px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'var(--red)', borderRadius:8, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:'0.82rem' }}>✕ Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--navy)', fontFamily:'DM Sans,sans-serif' }}>
      <AdminSidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} />

      <div style={{ marginLeft:sidebarWidth, flex:1, display:'flex', flexDirection:'column', transition:'margin-left 0.3s ease', minWidth:0 }}>
        {/* Topbar */}
        <header style={{ position:'sticky', top:0, zIndex:40, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', height:64, background:'rgba(10,22,40,0.92)', backdropFilter:'blur(12px)', borderBottom:'1px solid var(--border)' }}>
          <div>
            <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:'1.1rem', fontWeight:700, color:'var(--text)' }}>{pageTitle}</h1>
            <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:1 }}>
              {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => setActive('alerts')} style={{ position:'relative', width:38, height:38, background:'var(--card)', border:'1px solid var(--border)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'1rem' }}>
              🔔
              <span style={{ position:'absolute', top:7, right:7, width:7, height:7, background:'var(--red)', borderRadius:'50%', border:'1.5px solid var(--navy)' }} />
            </button>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(139,92,246,0.15)', border:'2px solid #8B5CF6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:800, color:'#8B5CF6', cursor:'pointer' }}>SA</div>
          </div>
        </header>

        <main style={{ padding:'28px 32px 48px', flex:1 }}>
          {renderPanel()}
        </main>
      </div>
    </div>
  )
}
