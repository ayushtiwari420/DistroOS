import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer
      className="flex flex-wrap items-center justify-between gap-4 px-[5%] py-10 border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 no-underline">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
          style={{ background: 'var(--amber)' }}
        >
          📦
        </div>
        <span
          className="font-bold text-xl"
          style={{ fontFamily: 'Sora, sans-serif', color: 'var(--text)' }}
        >
          Distro<span style={{ color: 'var(--amber)' }}>OS</span>
        </span>
      </Link>

      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        © 2026 DistroOS. Built with ❤️ for India's wholesale ecosystem.
      </p>

      <ul className="flex gap-6 list-none">
        {['Privacy', 'Terms', 'Contact'].map((item) => (
          <li key={item}>
            <a
              href="#"
              className="text-sm no-underline transition-colors duration-200"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.target.style.color = 'var(--text)')}
              onMouseLeave={e => (e.target.style.color = 'var(--text-muted)')}
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  )
}
