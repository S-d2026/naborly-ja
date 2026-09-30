'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const TICKER = [
  { label: 'JSE Index', value: '412,558.32', change: '+0.84%', up: true },
  { label: 'USD/JMD', value: '157.42', change: '+0.12%', up: true },
  { label: 'BOJ Policy Rate', value: '6.00%', change: '0.00', up: null },
  { label: 'Gas E10 87', value: 'J$189.90/L', change: '-0.6%', up: false },
  { label: 'GOJ 10-Yr Bond', value: '8.35%', change: '+0.04', up: true },
]

const PARISHES = ['All', 'Kingston', 'St. Andrew', 'St. James', 'St. Ann', 'St. Catherine']

const NEWS = [
  { id: 1, category: 'JSE Disclosure', parish: 'Kingston', time: '2h ago',
    headline: 'NCB Financial Group reports Q3 net profit up 11%',
    bullets: ['Net profit J$4.2B, up from J$3.8B YoY', 'Loan portfolio grew 9% on SME lending', 'Board declares interim dividend of J$0.45/share'] },
  { id: 2, category: 'BOJ Announcement', parish: 'Kingston', time: '5h ago',
    headline: 'BOJ holds policy rate at 6.00% amid inflation watch',
    bullets: ['Headline inflation at 5.8%, within target band', 'Cites stable JMD and controlled demand pressures', 'Next rate decision due next quarter'] },
  { id: 3, category: 'Port Logistics', parish: 'St. Catherine', time: '8h ago',
    headline: 'Kingston Wharves reports record container throughput',
    bullets: ['Q3 volume up 14% YoY on transshipment growth', 'New cranes cut vessel turnaround by 18%', 'Eyes expansion into Vernamfield logistics hub'] },
  { id: 4, category: 'Tourism & Real Estate', parish: 'St. James', time: '1d ago',
    headline: 'Montego Bay resort corridor sees fresh hotel investment',
    bullets: ['New 220-room property breaks ground near Rose Hall', 'Projected 450 direct jobs by 2027', 'Adds to 1,800+ rooms in MoBay pipeline'] },
  { id: 5, category: 'Agriculture', parish: 'St. Ann', time: '1d ago',
    headline: 'Ocho Rios agro-processors expand export capacity',
    bullets: ['New cold-storage facility doubles export throughput', 'Targets UK and Canadian diaspora grocers', 'Backed by EXIM Bank Jamaica financing'] },
]

const REAL_ESTATE = [
  { parish: 'Kingston', area: 'New Kingston', type: 'Commercial Office', jmd: 85000000, yield: '7.2%' },
  { parish: 'St. Andrew', area: 'Barbican', type: 'Luxury Townhouse', jmd: 62000000, yield: '5.1%' },
  { parish: 'St. James', area: 'Ironshore', type: 'Vacation Villa', jmd: 48500000, yield: '9.4%' },
  { parish: 'St. Ann', area: 'Ocho Rios', type: 'Beachfront Condo', jmd: 35000000, yield: '8.8%' },
  { parish: 'St. Catherine', area: 'Portmore', type: 'Residential Lot', jmd: 9200000, yield: '6.0%' },
  { parish: 'Manchester', area: 'Mandeville', type: 'Family Home', jmd: 28000000, yield: '5.5%' },
]

const TECH = [
  { name: 'Flow Assist', sector: 'Fintech', round: 'Seed', amount: 'US$450,000', investors: 'Jamaica Digital Fund, Angel Syndicate JA' },
  { name: 'IslandGrid', sector: 'CleanTech / Energy', round: 'Pre-Seed', amount: 'US$120,000', investors: 'DBJ Innovation Grant' },
  { name: 'FarmLink JA', sector: 'AgriTech', round: 'Seed', amount: 'US$300,000', investors: 'Caribbean VC Partners' },
  { name: 'PortPulse', sector: 'Logistics SaaS', round: 'Series A', amount: 'US$1.8M', investors: 'Kingston Capital, EXIM JA' },
  { name: 'MedLink JA', sector: 'HealthTech', round: 'Grant', amount: 'US$75,000', investors: 'JBDC Digitalization Grant' },
]

const FX_TREND = {
  labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  data: [155.1,155.4,155.9,156.2,156.0,156.5,156.8,157.0,156.9,157.2,157.3,157.42],
}

function fmtUSD(jmd: number) { return '$' + Math.round(jmd / 157.42).toLocaleString() }
function fmtJMD(jmd: number) { return 'J$' + jmd.toLocaleString() }

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById(id)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.id = id
    s.onload = () => resolve()
    document.head.appendChild(s)
  })
}

function TickerMarquee() {
  const row = [...TICKER, ...TICKER]
  return (
    <div className="bg-black border-y border-[#1f2623] overflow-hidden py-2">
      <div className="marquee-track">
        {row.map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-6 whitespace-nowrap text-xs font-mono">
            <span className="text-gray-400">{t.label}</span>
            <span className="text-white font-semibold">{t.value}</span>
            <span className={t.up === null ? 'text-gray-400' : t.up ? 'text-emerald-400' : 'text-red-400'}>
              {t.up === null ? '' : t.up ? '▲' : '▼'} {t.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function NewsTab() {
  const [parish, setParish] = useState('All')
  const filtered = parish === 'All' ? NEWS : NEWS.filter(n => n.parish === parish)
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {PARISHES.map(p => (
          <button key={p} onClick={() => setParish(p)}
            className={'px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ' +
              (parish === p ? 'bg-amber-500 text-black border-amber-500 font-semibold' : 'border-[#2a332e] text-gray-300 hover:border-amber-500')}>
            {p}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(n => (
          <div key={n.id} className="bg-[#101512] border border-[#1f2623] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">{n.category}</span>
              <span className="text-[10px] text-gray-500">{n.parish} · {n.time}</span>
            </div>
            <p className="text-sm font-semibold text-white mb-2">{n.headline}</p>
            <ul className="space-y-1">
              {n.bullets.map((b, i) => (
                <li key={i} className="text-xs text-gray-400 flex gap-2">
                  <span className="text-emerald-400">•</span><span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-500 text-center py-10">No stories for this parish yet.</p>}
      </div>
    </div>
  )
}

function RealEstateTab() {
  const [parish, setParish] = useState('All')
  const [q, setQ] = useState('')
  const rows = REAL_ESTATE.filter(r =>
    (parish === 'All' || r.parish === parish) &&
    (q === '' || r.area.toLowerCase().includes(q.toLowerCase()) || r.type.toLowerCase().includes(q.toLowerCase()))
  )
  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search area or property type..."
          className="flex-1 bg-[#101512] border border-[#2a332e] rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500" />
        <select value={parish} onChange={e => setParish(e.target.value)}
          className="bg-[#101512] border border-[#2a332e] rounded-md px-3 py-2 text-sm text-white outline-none focus:border-amber-500">
          {PARISHES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto border border-[#1f2623] rounded-lg">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="bg-[#101512] text-left text-[10px] uppercase tracking-wider text-gray-400">
              <th className="px-3 py-2">Parish</th><th className="px-3 py-2">Area</th><th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Price (JMD)</th><th className="px-3 py-2">Price (USD)</th><th className="px-3 py-2">Est. Yield</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[#1f2623] hover:bg-[#101512]">
                <td className="px-3 py-2 text-gray-300">{r.parish}</td>
                <td className="px-3 py-2 text-white font-medium">{r.area}</td>
                <td className="px-3 py-2 text-gray-300">{r.type}</td>
                <td className="px-3 py-2 text-gray-300">{fmtJMD(r.jmd)}</td>
                <td className="px-3 py-2 text-gray-400">{fmtUSD(r.jmd)}</td>
                <td className="px-3 py-2 text-emerald-400 font-semibold">{r.yield}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-sm text-gray-500 text-center py-10">No matches.</p>}
      </div>
    </div>
  )
}

function TechTab() {
  return (
    <div className="overflow-x-auto border border-[#1f2623] rounded-lg">
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr className="bg-[#101512] text-left text-[10px] uppercase tracking-wider text-gray-400">
            <th className="px-3 py-2">Company</th><th className="px-3 py-2">Sector</th><th className="px-3 py-2">Round</th>
            <th className="px-3 py-2">Amount</th><th className="px-3 py-2">Investors / Grantors</th>
          </tr>
        </thead>
        <tbody>
          {TECH.map((t, i) => (
            <tr key={i} className="border-t border-[#1f2623] hover:bg-[#101512]">
              <td className="px-3 py-2 text-white font-medium">{t.name}</td>
              <td className="px-3 py-2 text-gray-300">{t.sector}</td>
              <td className="px-3 py-2"><span className="px-2 py-0.5 rounded bg-[#1f2623] text-amber-400 text-xs">{t.round}</span></td>
              <td className="px-3 py-2 text-emerald-400 font-semibold">{t.amount}</td>
              <td className="px-3 py-2 text-gray-400 text-xs">{t.investors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PremiumTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const ChartLib = (window as any).Chart
    if (!ChartLib) return
    if (chartRef.current) chartRef.current.destroy()
    chartRef.current = new ChartLib(canvasRef.current, {
      type: 'line',
      data: {
        labels: FX_TREND.labels,
        datasets: [{
          label: 'USD/JMD',
          data: FX_TREND.data,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#9ca3af', font: { size: 10 } }, grid: { color: '#1f2623' } },
          y: { ticks: { color: '#9ca3af', font: { size: 10 } }, grid: { color: '#1f2623' } },
        },
      },
    })
    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [])

  const locked = [
    'Raw CSV data exports (JSE, FX, real estate)',
    'AI-powered predictive market insights',
    'Historical land registry lookups by parish',
    'Full BOJ / JSE disclosure archive (5-year)',
    'Diaspora remittance-timing FX alerts',
  ]

  return (
    <div>
      <div className="bg-[#101512] border border-[#1f2623] rounded-lg p-4 mb-5">
        <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">USD / JMD — 12-Month Trend</p>
        <div className="h-56"><canvas ref={canvasRef}></canvas></div>
      </div>
      <div className="relative bg-gradient-to-br from-amber-900/30 to-black border border-amber-600/40 rounded-lg p-5 overflow-hidden">
        <p className="text-amber-400 font-bold text-sm mb-1">🔒 Unlock Diaspora Premium Insights</p>
        <p className="text-xs text-gray-400 mb-4">Go beyond headlines — the full toolkit for serious Jamaica-market watchers.</p>
        <ul className="space-y-2 mb-4">
          {locked.map((l, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-amber-500">🔒</span>{l}
            </li>
          ))}
        </ul>
        <button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-5 py-2.5 rounded-md">
          Upgrade to Premium
        </button>
      </div>
    </div>
  )
}

export default function MarketsPage() {
  const [tab, setTab] = useState('overview')
  const [scriptsReady, setScriptsReady] = useState(false)

  useEffect(() => {
    Promise.all([
      loadScript('https://cdn.tailwindcss.com', 'tailwind-cdn-script'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js', 'chartjs-cdn-script'),
    ]).then(() => setScriptsReady(true))
  }, [])

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'realestate', label: 'Real Estate' },
    { key: 'tech', label: 'Tech & MSME' },
    { key: 'premium', label: 'Premium' },
  ]

  if (!scriptsReady) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0e0d', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif', fontSize: 13 }}>
        Loading markets...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e0d' }}>
      <style>{`
        @keyframes markets-marquee { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
        .marquee-track { display:flex; width:max-content; animation: markets-marquee 28s linear infinite; }
      `}</style>
      <div className="max-w-5xl mx-auto pb-10">
        <header className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 18 }}>←</Link>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">NaberlyJA <span className="text-amber-500">Markets</span></h1>
              <p className="text-[11px] text-gray-500">Jamaica business &amp; market intelligence, in your Naberhood</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-1 rounded bg-[#1f2623] text-gray-400">MOCK DATA · PROTOTYPE</span>
        </header>
        <TickerMarquee />
        <nav className="flex gap-1 px-4 py-3 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={'px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ' +
                (tab === t.key ? 'bg-amber-500 text-black' : 'bg-[#101512] text-gray-300 border border-[#1f2623] hover:border-amber-500')}>
              {t.label}
            </button>
          ))}
        </nav>
        <main className="px-4">
          {tab === 'overview' && <NewsTab />}
          {tab === 'realestate' && <RealEstateTab />}
          {tab === 'tech' && <TechTab />}
          {tab === 'premium' && <PremiumTab />}
        </main>
      </div>
    </div>
  )
}
