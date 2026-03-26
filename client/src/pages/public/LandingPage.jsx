import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import Button from '../../components/ui/Button'

// ─── Data ───────────────────────────────────────────────────────────────────

const problems = [
  {
    icon: '🚶',
    title: 'Salesmen Manually Visit Every Shop',
    desc: 'Hours wasted on physical visits just to collect orders that could be placed digitally in seconds.',
  },
  {
    icon: '📋',
    title: 'No Real-Time Inventory Visibility',
    desc: 'Overselling, stockouts, and fulfillment confusion because no one knows actual stock levels.',
  },
  {
    icon: '📒',
    title: 'Credit Tracked in Notebooks',
    desc: 'Informal credit systems lead to disputes, missed collections, and revenue loss.',
  },
  {
    icon: '📉',
    title: 'Zero Business Analytics',
    desc: 'No data on who your top retailers are, which products move, or where revenue is leaking.',
  },
]

const features = [
  { icon: '📦', bg: 'rgba(245,158,11,0.12)', title: 'Order Management', desc: 'Full order lifecycle from creation to delivery. Approve, reject, dispatch — with real-time status tracking for all parties.' },
  { icon: '🏭', bg: 'rgba(6,182,212,0.12)',   title: 'Inventory Tracking', desc: 'Live stock levels, low-stock alerts, product-level analytics, and multi-warehouse support — all in one view.' },
  { icon: '💳', bg: 'rgba(16,185,129,0.12)',  title: 'Credit & Payment System', desc: 'Set credit limits per retailer, track dues, send reminders, and reconcile payments. No more notebook ledgers.' },
  { icon: '🏪', bg: 'rgba(239,68,68,0.12)',   title: 'Retailer Management', desc: 'Custom pricing per retailer, relationship history, order patterns, and a self-service portal for shopkeepers.' },
  { icon: '👥', bg: 'rgba(139,92,246,0.12)',  title: 'Salesman Tools', desc: 'Assign routes, track performance, manage retailer visits, and let field reps place orders on behalf of retailers.' },
  { icon: '📈', bg: 'rgba(59,130,246,0.12)',  title: 'Business Analytics', desc: 'Sales trends, top products, best retailers, revenue forecasts, and credit risk dashboards — all visual and actionable.' },
]

const trustStats = [
  { num: '500+',  sub: 'Retailers Managed' },
  { num: '₹10Cr+', sub: 'Orders Processed' },
  { num: '40+',   sub: 'Salesmen Onboarded' },
  { num: '3x',    sub: 'Faster Order Cycles' },
]

const steps = [
  { num: '1', title: 'Register Your Business',  desc: 'Create your wholesaler account and set up your business profile in under 5 minutes.' },
  { num: '2', title: 'Add Products & Stock',    desc: 'Import or manually add your product catalog with current inventory levels.' },
  { num: '3', title: 'Onboard Your Network',    desc: 'Add salesmen and invite retailers. Set routes, credit limits, and pricing rules.' },
  { num: '4', title: 'Go Live & Grow',          desc: 'Start receiving digital orders, track everything in real-time, and scale effortlessly.' },
]

const roles = {
  wholesaler: {
    label: '🏢 Wholesaler',
    title: 'Wholesaler Dashboard',
    desc: 'The command center of your distribution business. Monitor all orders, track inventory, manage your retailer network, and get full financial visibility.',
    features: [
      'Approve or reject incoming orders',
      'Set custom prices per retailer',
      'Monitor all salesman activity',
      'Track credit exposure & collections',
      'View real-time business analytics',
      'Manage product catalog & stock',
    ],
    avatar: '🏢', name: 'Rajesh Mehta', role: 'Wholesaler · Mumbai',
    rows: [
      { label: 'Order #1042 — Sharma Traders', tag: 'Pending',    tagClass: 'pending' },
      { label: 'Order #1041 — Patel Store',    tag: 'Dispatched', tagClass: 'approved' },
      { label: 'Credit Due — Gupta Bros',      tag: '₹12,000',    tagClass: 'credit' },
      { label: 'Low Stock — Basmati 25kg',     tag: 'Alert',      tagClass: 'pending' },
    ],
  },
  salesman: {
    label: '🚶 Salesman',
    title: 'Salesman Mobile View',
    desc: 'Built for the field. Salesmen can manage their assigned retailers, place orders on their behalf, and track their daily targets without any paperwork.',
    features: [
      'View assigned retailer list',
      'Place orders on behalf of retailers',
      'Track daily order count & revenue',
      'See credit status of each retailer',
      'Collect payment confirmations',
    ],
    avatar: '🚶', name: 'Anil Yadav', role: 'Salesman · Route B - Andheri',
    rows: [
      { label: 'Sharma Traders',   tag: 'Visited',    tagClass: 'approved' },
      { label: 'New Bharat Store', tag: 'Pending',    tagClass: 'pending' },
      { label: "Today's Orders",   tag: '14 placed',  tagClass: 'approved' },
      { label: 'Target Achievement', tag: '78%',      tagClass: 'credit' },
    ],
  },
  retailer: {
    label: '🏪 Retailer',
    title: 'Retailer Self-Service Portal',
    desc: 'Give your shopkeepers the ability to place orders anytime, check their account balance, and view order history — reducing calls to your office.',
    features: [
      'Browse product catalog with custom pricing',
      'Place orders directly from mobile',
      'View order history & status',
      'Check credit balance & dues',
      'Download payment receipts',
    ],
    avatar: '🏪', name: "Priya's Kirana", role: 'Retailer · Borivali West',
    rows: [
      { label: 'Order Placed ✓', tag: 'Confirmed', tagClass: 'approved' },
      { label: 'Credit Limit',   tag: '₹25,000',  tagClass: 'credit' },
      { label: 'Amount Due',     tag: '₹8,200',   tagClass: 'pending' },
      { label: 'Last Order',     tag: '3 days ago', tagClass: '' },
    ],
  },
  admin: {
    label: '⚙️ Admin',
    title: 'Platform Admin Console',
    desc: 'Manage the entire SaaS platform — onboard new wholesalers, monitor system health, handle subscriptions, and control platform-level settings.',
    features: [
      'Onboard & manage wholesalers',
      'Monitor platform usage & metrics',
      'Manage subscription plans',
      'View system-wide analytics',
      'Handle support & escalations',
    ],
    avatar: '⚙️', name: 'Platform Admin', role: 'System Owner',
    rows: [
      { label: 'Active Wholesalers',         tag: '24',          tagClass: 'approved' },
      { label: 'New Signup — Gujarat Foods', tag: 'Review',      tagClass: 'pending' },
      { label: 'Monthly Revenue',            tag: '₹1.8L',       tagClass: 'credit' },
      { label: 'System Health',              tag: '99.8% uptime',tagClass: 'approved' },
    ],
  },
}

const barHeights = [55, 70, 45, 85, 60, 95, 75, 50, 80, 65, 90, 72]

// ─── Tag styles ──────────────────────────────────────────────────────────────
const tagStyles = {
  pending:  { background: 'rgba(245,158,11,0.15)', color: 'var(--amber)' },
  approved: { background: 'rgba(16,185,129,0.15)', color: 'var(--green)' },
  credit:   { background: 'rgba(6,182,212,0.15)',  color: 'var(--teal)'  },
  '':       { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' },
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [activeRole, setActiveRole] = useState('wholesaler')
  const fadeRefs = useRef([])

  // Scroll-triggered fade-in
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    fadeRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const addFadeRef = (el) => {
    if (el && !fadeRefs.current.includes(el)) fadeRefs.current.push(el)
  }

  const role = roles[activeRole]

  return (
    <div style={{ background: 'var(--navy)', minHeight: '100vh' }}>
      <Navbar />

      {/* ── HERO ── */}
      <section
        className="relative flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ minHeight: '100vh', padding: '120px 5% 80px' }}
      >
        {/* Glow blobs */}
        <div className="animate-drift1 pointer-events-none absolute"
          style={{ width: 600, height: 600, top: -100, left: -100,
            background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)' }} />
        <div className="animate-drift2 pointer-events-none absolute"
          style={{ width: 500, height: 500, bottom: -100, right: -100,
            background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)' }} />

        {/* Grid overlay */}
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
          }} />

        {/* Badge */}
        <div className="animate-fadeDown inline-flex items-center gap-2 mb-7 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
          style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--amber)' }}>
          <span className="animate-pulse-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--amber)' }} />
          Now in Beta — Built for Tier 2 &amp; 3 Markets
        </div>

        {/* Headline */}
        <h1 className="animate-fadeDown-1 font-extrabold tracking-tight mb-6"
          style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', letterSpacing: '-0.03em', maxWidth: 820 }}>
          The <span style={{ color: 'var(--amber)' }}>Distribution OS</span><br />
          for Modern Wholesalers
        </h1>

        {/* Subtext */}
        <p className="animate-fadeDown-2 mb-10"
          style={{ fontSize: 'clamp(1rem,2vw,1.2rem)', color: 'var(--text-muted)', maxWidth: 580, lineHeight: 1.7 }}>
          Stop managing orders on paper and WhatsApp. DistroOS gives your entire distribution
          network — salesmen, retailers, and finance — one powerful digital platform.
        </p>

        {/* CTAs */}
        <div className="animate-fadeDown-3 flex gap-4 justify-center flex-wrap">
          <Link to="/register"><Button variant="primary" size="lg">🚀 Start Free Trial</Button></Link>
          <Button variant="outline" size="lg">Watch Demo →</Button>
        </div>

        {/* Dashboard Mockup */}
        <div className="animate-fadeUp relative mt-16 w-full" style={{ maxWidth: 960 }}>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}>

            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ background: 'var(--navy-3)', borderColor: 'var(--border)' }}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <div className="flex-1 mx-3 px-3 py-1 rounded text-xs font-mono"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                app.distro-os.com/dashboard/wholesaler
              </div>
            </div>

            {/* Mockup body */}
            <div className="grid" style={{ gridTemplateColumns: '200px 1fr', minHeight: 380 }}>
              {/* Sidebar */}
              <div className="hidden md:block border-r py-5" style={{ background: 'var(--navy-2)', borderColor: 'var(--border)' }}>
                <div className="px-4 pb-4 font-bold text-sm border-b mb-3" style={{ fontFamily: 'Sora', borderColor: 'var(--border)' }}>
                  Distro<span style={{ color: 'var(--amber)' }}>OS</span>
                </div>
                {[
                  { icon: '📊', label: 'Dashboard', active: true },
                  { icon: '📦', label: 'Orders' },
                  { icon: '🏭', label: 'Inventory' },
                  { icon: '🏪', label: 'Retailers' },
                  { icon: '💳', label: 'Credit' },
                  { icon: '👥', label: 'Salesmen' },
                  { icon: '📈', label: 'Analytics' },
                ].map((item) => (
                  <div key={item.label}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs cursor-pointer transition-all duration-150"
                    style={{
                      color: item.active ? 'var(--amber)' : 'var(--text-muted)',
                      background: item.active ? 'rgba(245,158,11,0.08)' : 'transparent',
                      borderLeft: item.active ? '2px solid var(--amber)' : '2px solid transparent',
                    }}>
                    <span>{item.icon}</span> {item.label}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="p-5" style={{ background: 'var(--card)' }}>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-semibold text-base">Wholesaler Dashboard</h3>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Today, Feb 19 2026</span>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: "Today's Orders", value: '47',    color: 'var(--amber)', delta: '↑ 12% from yesterday' },
                    { label: 'Revenue',        value: '₹2.4L', color: 'var(--green)', delta: '↑ 8% this week' },
                    { label: 'Active Retailers',value:'128',   color: 'var(--teal)',  delta: '+4 this month' },
                    { label: 'Credit Dues',    value: '₹84K',  color: 'var(--red)',   delta: '3 overdue' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-3.5"
                      style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
                      <div className="text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                      <div className="text-xl font-bold" style={{ fontFamily: 'Sora', color: s.color }}>{s.value}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--green)' }}>{s.delta}</div>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div className="flex items-end gap-1.5 rounded-xl p-3.5 overflow-hidden"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)', height: 120 }}>
                  {barHeights.map((h, i) => (
                    <div key={i} className="flex-1 rounded-t animate-growUp transition-opacity duration-200 hover:opacity-100"
                      style={{
                        height: `${h}%`,
                        background: i === 5 || i === 9 ? 'var(--teal)' : 'var(--amber)',
                        opacity: 0.7,
                        animationDelay: `${i * 0.05}s`,
                      }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="flex flex-wrap items-center justify-center gap-12 py-6 px-[5%] border-t border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--navy-2)' }}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Built for India's wholesale networks
        </span>
        {trustStats.map((s) => (
          <div key={s.sub} className="text-center">
            <div className="text-2xl font-extrabold" style={{ fontFamily: 'Sora', color: 'var(--amber)' }}>{s.num}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── PROBLEM SECTION ── */}
      <section style={{ padding: '100px 5%', background: 'var(--navy-2)' }}>
        <div className="section-tag" style={{ display:'inline-block', fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--amber)', marginBottom:14 }}>The Problem</div>
        <h2 className="font-extrabold mb-4" style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', letterSpacing:'-0.02em' }}>
          Traditional distribution<br/>is broken
        </h2>
        <p className="mb-0" style={{ fontSize:'1.05rem', color:'var(--text-muted)', maxWidth:540, lineHeight:1.7 }}>
          Most small wholesalers still run their business on manual visits, paper ledgers, and WhatsApp messages — losing time, money, and control.
        </p>

        <div ref={addFadeRef} className="fade-in grid gap-14 mt-14" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {/* Problem cards */}
          <ul className="flex flex-col gap-4 list-none">
            {problems.map((p) => (
              <li key={p.title}
                className="flex gap-4 items-start rounded-xl p-5 border transition-all duration-200"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(239,68,68,0.3)'; e.currentTarget.style.transform='translateX(4px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateX(0)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.1)' }}>{p.icon}</div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">{p.title}</h4>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Before / After */}
          <div className="flex flex-col gap-6">
            {[
              {
                type: 'before', label: '❌ Before DistroOS', color: 'var(--red)',
                items: ['Salesman visits 30 shops daily','Orders written in notebooks','Credit collected on memory','No idea of inventory levels','Retailer has no self-service'],
              },
              {
                type: 'after', label: '✅ After DistroOS', color: 'var(--green)',
                items: ['Orders placed digitally in 30s','Salesman manages 3x more accounts','Credit tracked & auto-reminded','Live inventory at every warehouse','Retailer self-orders anytime'],
              },
            ].map((card) => (
              <div key={card.type} className="rounded-xl p-6 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: card.color }}>{card.label}</h4>
                {card.items.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm mb-2 last:mb-0"
                    style={{ color: 'var(--text-muted)', textDecoration: card.type === 'before' ? 'line-through' : 'none' }}>
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '100px 5%' }}>
        <div style={{ display:'inline-block', fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--amber)', marginBottom:14 }}>Core Features</div>
        <h2 className="font-extrabold mb-4" style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', letterSpacing:'-0.02em' }}>
          Everything your distribution<br/>network needs
        </h2>
        <p style={{ fontSize:'1.05rem', color:'var(--text-muted)', maxWidth:540, lineHeight:1.7 }}>
          Five powerful modules that cover every aspect of modern B2B wholesale distribution.
        </p>

        <div ref={addFadeRef} className="fade-in grid gap-6 mt-14" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {features.map((f) => (
            <div key={f.title}
              className="rounded-xl p-7 border relative overflow-hidden transition-all duration-300 group"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(245,158,11,0.25)'; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 20px 40px rgba(0,0,0,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5" style={{ background: f.bg }}>
                {f.icon}
              </div>
              <h3 className="font-bold text-base mb-2.5">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROLES ── */}
      <section id="roles" style={{ padding: '100px 5%', background: 'var(--navy-2)' }}>
        <div style={{ display:'inline-block', fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--amber)', marginBottom:14 }}>Role-Based Access</div>
        <h2 className="font-extrabold mb-4" style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', letterSpacing:'-0.02em' }}>
          One platform, four roles
        </h2>
        <p style={{ fontSize:'1.05rem', color:'var(--text-muted)', maxWidth:540, lineHeight:1.7 }}>
          Every user gets a tailored interface designed for their specific job — no clutter, no confusion.
        </p>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mt-12 mb-8">
          {Object.entries(roles).map(([key, r]) => (
            <button key={key} onClick={() => setActiveRole(key)}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold border cursor-pointer transition-all duration-200"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                background: activeRole === key ? 'var(--amber-dim)' : 'transparent',
                borderColor: activeRole === key ? 'rgba(245,158,11,0.3)' : 'var(--border)',
                color: activeRole === key ? 'var(--amber)' : 'var(--text-muted)',
              }}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Role panel */}
        <div ref={addFadeRef} className="fade-in grid gap-10 items-center" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div>
            <h3 className="font-bold text-2xl mb-3">{role.title}</h3>
            <p className="mb-6" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{role.desc}</p>
            <ul className="flex flex-col gap-3 list-none">
              {role.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <span style={{ color: 'var(--green)' }}>✓</span> {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Role visual card */}
          <div className="rounded-xl p-6 border flex flex-col gap-3" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg border-2"
                style={{ background: 'var(--amber-dim)', borderColor: 'var(--amber)' }}>
                {role.avatar}
              </div>
              <div>
                <div className="font-semibold text-sm">{role.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{role.role}</div>
              </div>
            </div>
            {role.rows.map((row) => (
              <div key={row.label} className="flex justify-between items-center rounded-lg px-3 py-2.5 text-sm"
                style={{ background: 'var(--card-2)' }}>
                <span>{row.label}</span>
                {row.tag && (
                  <span className="text-xs px-2 py-0.5 rounded font-semibold"
                    style={tagStyles[row.tagClass] || tagStyles['']}>
                    {row.tag}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: '100px 5%' }}>
        <div style={{ display:'inline-block', fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--amber)', marginBottom:14 }}>How It Works</div>
        <h2 className="font-extrabold mb-4" style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', letterSpacing:'-0.02em' }}>
          Up and running in minutes
        </h2>
        <p style={{ fontSize:'1.05rem', color:'var(--text-muted)', maxWidth:540, lineHeight:1.7 }}>
          No technical expertise needed. DistroOS is designed for real business users — not IT teams.
        </p>

        <div ref={addFadeRef} className="fade-in flex flex-wrap gap-8 mt-14 relative">
          {steps.map((s, i) => (
            <div key={s.num} className="flex-1 text-center" style={{ minWidth: 200 }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 font-extrabold text-2xl border-2 relative z-10"
                style={{ fontFamily: 'Sora', background: 'var(--card)', borderColor: 'var(--amber)', color: 'var(--amber)' }}>
                {s.num}
              </div>
              <h4 className="font-bold text-base mb-2">{s.title}</h4>
              <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 5%', background: 'var(--navy-2)' }}>
        <div ref={addFadeRef} className="fade-in max-w-2xl mx-auto text-center rounded-2xl p-16 border relative overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="pointer-events-none absolute" style={{ top:-80, left:'50%', transform:'translateX(-50%)', width:300, height:300,
            background:'radial-gradient(circle, rgba(245,158,11,0.12), transparent 70%)' }} />
          <h2 className="font-extrabold mb-4" style={{ fontSize:'2.2rem', letterSpacing:'-0.02em' }}>
            Ready to modernize<br/>your distribution?
          </h2>
          <p className="mb-9 text-lg" style={{ color: 'var(--text-muted)' }}>
            Join hundreds of wholesalers already running their business on DistroOS.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/register"><Button variant="primary" size="lg">🚀 Start Free Trial</Button></Link>
            <Button variant="ghost" size="lg">Schedule a Demo</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
