'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const MOCK_TICKER = [
  { label: 'JSE Index', value: '412,558.32', change: '+0.84%', up: true },
  { label: 'USD/JMD', value: '157.42', change: '+0.12%', up: true },
  { label: 'BOJ Policy Rate', value: '6.00%', change: '0.00', up: null as boolean | null },
  { label: 'Gasolene 87', value: 'J$209.62/L', change: '-0.6%', up: false },
  { label: 'Gasolene 90', value: 'J$217.33/L', change: '-0.4%', up: false },
  { label: 'Auto Diesel', value: 'J$238.88/L', change: '-0.3%', up: false },
  { label: 'GOJ 10-Yr Bond', value: '8.35%', change: '+0.04', up: true },
  { label: 'GBP/JMD', value: '211.00', change: '+0.10%', up: true },
  { label: 'CAD/JMD', value: '112.19', change: '-0.08%', up: false },
]

// All 14 parishes, grouped roughly by county (Surrey, Middlesex, Cornwall)
// so the filter list reads in a sensible island order.
const PARISHES = [
  'All',
  'Kingston', 'St. Andrew', 'St. Thomas', 'Portland',
  'St. Mary', 'St. Ann', 'Trelawny', 'St. Catherine', 'Clarendon', 'Manchester',
  'St. James', 'Hanover', 'Westmoreland', 'St. Elizabeth',
]

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
  { id: 6, category: 'Real Estate', parish: 'St. Andrew', time: '3h ago',
    headline: 'Barbican-Liguanea corridor sees steady townhouse demand',
    bullets: ['Resale prices up modestly on limited new supply', 'Diaspora buyers remain a top demand driver', 'New gated developments planned near Hope Road'] },
  { id: 7, category: 'Agriculture', parish: 'Manchester', time: '6h ago',
    headline: 'Christiana-area coffee and citrus farmers expand output',
    bullets: ['Cooperative adds new processing line', 'Targets higher-margin export grades', 'Backed by Development Bank of Jamaica financing'] },
  { id: 8, category: 'Fishing & Tourism', parish: 'St. Thomas', time: '10h ago',
    headline: 'Morant Bay eco-tourism and fisheries projects get a boost',
    bullets: ['New cold-storage unit for the fishing cooperative', 'Eco-lodge pipeline grows along the south coast', 'Road upgrades improve access from Kingston'] },
  { id: 9, category: 'Tourism', parish: 'Portland', time: '12h ago',
    headline: 'Port Antonio boutique hotel pipeline keeps growing',
    bullets: ['Two new boutique properties under construction', 'Blue Lagoon area sees renewed investor interest', 'Airlift from Ken Jones Aerodrome under review'] },
  { id: 10, category: 'Agro-processing', parish: 'St. Mary', time: '14h ago',
    headline: 'St. Mary agro-processors ramp up for export season',
    bullets: ['Coconut and breadfruit processing capacity expanded', 'New packaging line targets diaspora grocers', 'Supported by EXIM Bank Jamaica'] },
  { id: 11, category: 'Tourism & Real Estate', parish: 'Trelawny', time: '16h ago',
    headline: 'Falmouth cruise port traffic lifts local retail and housing demand',
    bullets: ['Record cruise-call numbers this season', 'New short-term rental supply near the historic district', 'Local vendors report stronger foot traffic'] },
  { id: 12, category: 'Tourism', parish: 'Hanover', time: '18h ago',
    headline: 'Lucea sees quiet but steady boutique resort growth',
    bullets: ['Smaller-footprint resort projects favored over mega-resorts', 'Local employment ticks up on hospitality hiring', 'Road network upgrades continue toward Negril'] },
  { id: 13, category: 'Tourism & Real Estate', parish: 'Westmoreland', time: '20h ago',
    headline: 'Negril hospitality sector reports strong occupancy',
    bullets: ['High-season occupancy tracking above last year', 'New villa and condo developments along Long Bay', 'Local vendors push for more direct airlift'] },
  { id: 14, category: 'Agriculture & Tourism', parish: 'St. Elizabeth', time: '22h ago',
    headline: 'Black River and Treasure Beach see mixed agri-tourism growth',
    bullets: ['Eco-tourism bookings up on river safari demand', 'Allspice and pimento exporters report firm pricing', 'New guesthouse supply concentrated in Treasure Beach'] },
  { id: 15, category: 'Agriculture', parish: 'Clarendon', time: '1d ago',
    headline: 'May Pen agro-processing hub expands citrus and sugar output',
    bullets: ['New cold-storage facility supports export timing', 'Sugar cooperative reports stable yields', 'Road links to Vernamfield logistics hub cited as a plus'] },
]

const REAL_ESTATE = [
  { parish: 'Kingston', area: 'New Kingston', type: 'Commercial Office', jmd: 85000000, yield: '7.2%' },
  { parish: 'St. Andrew', area: 'Barbican', type: 'Luxury Townhouse', jmd: 62000000, yield: '5.1%' },
  { parish: 'St. Thomas', area: 'Morant Bay', type: 'Family Home', jmd: 14500000, yield: '6.3%' },
  { parish: 'Portland', area: 'Port Antonio', type: 'Eco-Lodge / Guesthouse', jmd: 32000000, yield: '8.1%' },
  { parish: 'St. Mary', area: 'Oracabessa', type: 'Beachfront Villa', jmd: 41000000, yield: '7.6%' },
  { parish: 'St. Ann', area: 'Ocho Rios', type: 'Beachfront Condo', jmd: 35000000, yield: '8.8%' },
  { parish: 'Trelawny', area: 'Falmouth', type: 'Short-Term Rental Townhouse', jmd: 26500000, yield: '7.9%' },
  { parish: 'St. Catherine', area: 'Portmore', type: 'Residential Lot', jmd: 9200000, yield: '6.0%' },
  { parish: 'Clarendon', area: 'May Pen', type: 'Family Home', jmd: 16800000, yield: '5.8%' },
  { parish: 'Manchester', area: 'Mandeville', type: 'Family Home', jmd: 28000000, yield: '5.5%' },
  { parish: 'St. James', area: 'Ironshore', type: 'Vacation Villa', jmd: 48500000, yield: '9.4%' },
  { parish: 'Hanover', area: 'Lucea', type: 'Boutique Resort Unit', jmd: 22000000, yield: '7.0%' },
  { parish: 'Westmoreland', area: 'Negril', type: 'Beachfront Villa', jmd: 55000000, yield: '9.8%' },
  { parish: 'St. Elizabeth', area: 'Treasure Beach', type: 'Guesthouse', jmd: 19500000, yield: '8.4%' },
]

const TECH = [
  { name: 'Flow Assist', sector: 'Fintech', round: 'Seed', usd: 450000, investors: 'Jamaica Digital Fund, Angel Syndicate JA' },
  { name: 'IslandGrid', sector: 'CleanTech / Energy', round: 'Pre-Seed', usd: 120000, investors: 'DBJ Innovation Grant' },
  { name: 'FarmLink JA', sector: 'AgriTech', round: 'Seed', usd: 300000, investors: 'Caribbean VC Partners' },
  { name: 'PortPulse', sector: 'Logistics SaaS', round: 'Series A', usd: 1800000, investors: 'Kingston Capital, EXIM JA' },
  { name: 'MedLink JA', sector: 'HealthTech', round: 'Grant', usd: 75000, investors: 'JBDC Digitalization Grant' },
]

// Fallback trend, used only until enough real daily rates have accumulated
// in Supabase (the chart needs at least 2 real points to draw a real line).
const MOCK_FX_TREND = {
  labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  data: [155.1,155.4,155.9,156.2,156.0,156.5,156.8,157.0,156.9,157.2,157.3,157.42],
}

function fmtUSD(jmd: number, rate: number) { return '$' + Math.round(jmd / rate).toLocaleString() }
function fmtJMD(jmd: number) { return 'J$' + jmd.toLocaleString() }
// Converts a JMD amount into another currency given a "JMD per 1 unit of that
// currency" rate (the same convention used for fx_gbp_jmd / fx_cad_jmd), and
// prefixes it with the currency's symbol.
function fmtForeign(jmd: number, rate: number, symbol: string) { return symbol + Math.round(jmd / rate).toLocaleString() }
// Converts a USD amount (used by the Tech & MSME table) into JMD or another
// foreign currency via the USD/JMD rate and that currency's own JMD rate.
function usdToJmd(usd: number, usdRate: number) { return usd * usdRate }
function usdToForeign(usd: number, usdRate: number, foreignRate: number, symbol: string) {
  return fmtForeign(usdToJmd(usd, usdRate), foreignRate, symbol)
}

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

// Pulls the real history for a single market_data "data_type" (e.g.
// 'fx_usd_jmd', 'boj_rate', 'gas_87', 'gas_90', 'gas_diesel') — populated by
// the Make.com automations. Returns an empty array if the table has no rows
// yet for that type; callers fall back to mock data in that case.
function useLiveSeries(dataType: string) {
  const [rows, setRows] = useState<{ value: number; updated_at: string }[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase
      .from('market_data')
      .select('value, updated_at')
      .eq('data_type', dataType)
      .order('updated_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setRows(
            data
              // Strips thousands-separator commas (e.g. a JSE index value like
              // "384,524.89") before parsing — some upstream feeds send
              // pre-formatted numbers, and parseFloat alone stops at the
              // first comma and silently truncates the value.
              .map(d => ({ value: parseFloat(String(d.value).replace(/,/g, '')), updated_at: d.updated_at }))
              .filter(d => !isNaN(d.value))
          )
        }
        setLoaded(true)
      })
  }, [dataType])

  return { rows, loaded }
}

// Shared helper: given a live series and a mock fallback number, work out
// the "current" value, the previous value (for a change indicator), and the
// percent change — or null/mock values if no live rows exist yet.
function latestAndChange(rows: { value: number; updated_at: string }[], mockValue: number) {
  const hasLive = rows.length > 0
  const latest = hasLive ? rows[rows.length - 1].value : mockValue
  const previous = rows.length > 1 ? rows[rows.length - 2].value : null
  const changePct = previous !== null ? ((latest - previous) / previous) * 100 : null
  return { hasLive, latest, previous, changePct }
}

function TickerMarquee({ ticker }: { ticker: typeof MOCK_TICKER }) {
  const row = [...ticker, ...ticker]
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

function RealEstateTab({ rates }: { rates: { usd: number; gbp: number; cad: number } }) {
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
              <th className="px-3 py-2">Price (JMD)</th><th className="px-3 py-2">Price (USD)</th>
              <th className="px-3 py-2">Price (GBP)</th><th className="px-3 py-2">Price (CAD)</th>
              <th className="px-3 py-2">Est. Yield</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[#1f2623] hover:bg-[#101512]">
                <td className="px-3 py-2 text-gray-300">{r.parish}</td>
                <td className="px-3 py-2 text-white font-medium">{r.area}</td>
                <td className="px-3 py-2 text-gray-300">{r.type}</td>
                <td className="px-3 py-2 text-gray-300">{fmtJMD(r.jmd)}</td>
                <td className="px-3 py-2 text-gray-400">{fmtUSD(r.jmd, rates.usd)}</td>
                <td className="px-3 py-2 text-gray-400">{fmtForeign(r.jmd, rates.gbp, '£')}</td>
                <td className="px-3 py-2 text-gray-400">{fmtForeign(r.jmd, rates.cad, 'CA$')}</td>
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

function TechTab({ rates }: { rates: { usd: number; gbp: number; cad: number } }) {
  return (
    <div className="overflow-x-auto border border-[#1f2623] rounded-lg">
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr className="bg-[#101512] text-left text-[10px] uppercase tracking-wider text-gray-400">
            <th className="px-3 py-2">Company</th><th className="px-3 py-2">Sector</th><th className="px-3 py-2">Round</th>
            <th className="px-3 py-2">Amount (USD)</th><th className="px-3 py-2">Amount (JMD)</th>
            <th className="px-3 py-2">Amount (GBP)</th><th className="px-3 py-2">Amount (CAD)</th>
            <th className="px-3 py-2">Investors / Grantors</th>
          </tr>
        </thead>
        <tbody>
          {TECH.map((t, i) => (
            <tr key={i} className="border-t border-[#1f2623] hover:bg-[#101512]">
              <td className="px-3 py-2 text-white font-medium">{t.name}</td>
              <td className="px-3 py-2 text-gray-300">{t.sector}</td>
              <td className="px-3 py-2"><span className="px-2 py-0.5 rounded bg-[#1f2623] text-amber-400 text-xs">{t.round}</span></td>
              <td className="px-3 py-2 text-emerald-400 font-semibold">${t.usd.toLocaleString()}</td>
              <td className="px-3 py-2 text-gray-400">{fmtJMD(Math.round(usdToJmd(t.usd, rates.usd)))}</td>
              <td className="px-3 py-2 text-gray-400">{usdToForeign(t.usd, rates.usd, rates.gbp, '£')}</td>
              <td className="px-3 py-2 text-gray-400">{usdToForeign(t.usd, rates.usd, rates.cad, 'CA$')}</td>
              <td className="px-3 py-2 text-gray-400 text-xs">{t.investors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PremiumTab({ fxTrend, isLive }: { fxTrend: { labels: string[]; data: number[] }, isLive: boolean }) {
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
        labels: fxTrend.labels,
        datasets: [{
          label: 'USD/JMD',
          data: fxTrend.data,
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
  }, [fxTrend])

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
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-gray-400">USD / JMD Trend</p>
          {isLive ? (
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 font-semibold">● LIVE</span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#1f2623] text-gray-500">MOCK</span>
          )}
        </div>
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

  const { rows: fxRows } = useLiveSeries('fx_usd_jmd')
  const { rows: jseRows } = useLiveSeries('jse_index')
  const { rows: bojRows } = useLiveSeries('boj_rate')
  const { rows: gas87Rows } = useLiveSeries('gas_87')
  const { rows: gas90Rows } = useLiveSeries('gas_90')
  const { rows: gasDieselRows } = useLiveSeries('gas_diesel')
  const { rows: gbpRows } = useLiveSeries('fx_gbp_jmd')
  const { rows: cadRows } = useLiveSeries('fx_cad_jmd')

  useEffect(() => {
    Promise.all([
      loadScript('https://cdn.tailwindcss.com', 'tailwind-cdn-script'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js', 'chartjs-cdn-script'),
    ]).then(() => setScriptsReady(true))
  }, [])

  const mockJse = parseFloat(MOCK_TICKER[0].value.replace(/,/g, ''))
  const mockFx = parseFloat(MOCK_TICKER[1].value)
  const mockBoj = parseFloat(MOCK_TICKER[2].value)
  const mockGas87 = parseFloat(MOCK_TICKER[3].value.replace('J$', '').replace('/L', ''))
  const mockGas90 = parseFloat(MOCK_TICKER[4].value.replace('J$', '').replace('/L', ''))
  const mockDiesel = parseFloat(MOCK_TICKER[5].value.replace('J$', '').replace('/L', ''))
  const mockGbp = parseFloat(MOCK_TICKER[7].value)
  const mockCad = parseFloat(MOCK_TICKER[8].value)

  const jse = latestAndChange(jseRows, mockJse)
  const fx = latestAndChange(fxRows, mockFx)
  const boj = latestAndChange(bojRows, mockBoj)
  const gas87 = latestAndChange(gas87Rows, mockGas87)
  const gas90 = latestAndChange(gas90Rows, mockGas90)
  const diesel = latestAndChange(gasDieselRows, mockDiesel)
  const gbp = latestAndChange(gbpRows, mockGbp)
  const cad = latestAndChange(cadRows, mockCad)

  const hasLiveJse = jse.hasLive
  const hasLiveFx = fx.hasLive
  const hasLiveBoj = boj.hasLive
  const hasLiveGas = gas87.hasLive || gas90.hasLive || diesel.hasLive
  const hasLiveOtherFx = gbp.hasLive || cad.hasLive
  const latestFx = fx.latest

  // Build the live ticker row: the GOJ bond stays mock (not automated yet);
  // everything else uses real Supabase values once the Make.com automations
  // have run at least once.
  const ticker = [
    {
      label: 'JSE Index',
      value: jse.latest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      change: jse.changePct !== null ? (jse.changePct >= 0 ? '+' : '') + jse.changePct.toFixed(2) + '%' : MOCK_TICKER[0].change,
      up: jse.changePct !== null ? jse.changePct >= 0 : MOCK_TICKER[0].up,
    },
    {
      label: 'USD/JMD',
      value: fx.latest.toFixed(2),
      change: fx.changePct !== null ? (fx.changePct >= 0 ? '+' : '') + fx.changePct.toFixed(2) + '%' : MOCK_TICKER[1].change,
      up: fx.changePct !== null ? fx.changePct >= 0 : MOCK_TICKER[1].up,
    },
    {
      label: 'GBP/JMD',
      value: gbp.latest.toFixed(2),
      change: gbp.changePct !== null ? (gbp.changePct >= 0 ? '+' : '') + gbp.changePct.toFixed(2) + '%' : MOCK_TICKER[7].change,
      up: gbp.changePct !== null ? gbp.changePct >= 0 : MOCK_TICKER[7].up,
    },
    {
      label: 'CAD/JMD',
      value: cad.latest.toFixed(2),
      change: cad.changePct !== null ? (cad.changePct >= 0 ? '+' : '') + cad.changePct.toFixed(2) + '%' : MOCK_TICKER[8].change,
      up: cad.changePct !== null ? cad.changePct >= 0 : MOCK_TICKER[8].up,
    },
    {
      label: 'BOJ Policy Rate',
      value: boj.latest.toFixed(2) + '%',
      change: boj.previous !== null ? (boj.latest - boj.previous >= 0 ? '+' : '') + (boj.latest - boj.previous).toFixed(2) : MOCK_TICKER[2].change,
      up: boj.previous !== null ? (boj.latest === boj.previous ? null : boj.latest > boj.previous) : MOCK_TICKER[2].up,
    },
    {
      label: 'Gasolene 87',
      value: 'J$' + gas87.latest.toFixed(2) + '/L',
      change: gas87.changePct !== null ? (gas87.changePct >= 0 ? '+' : '') + gas87.changePct.toFixed(1) + '%' : MOCK_TICKER[3].change,
      up: gas87.changePct !== null ? gas87.changePct >= 0 : MOCK_TICKER[3].up,
    },
    {
      label: 'Gasolene 90',
      value: 'J$' + gas90.latest.toFixed(2) + '/L',
      change: gas90.changePct !== null ? (gas90.changePct >= 0 ? '+' : '') + gas90.changePct.toFixed(1) + '%' : MOCK_TICKER[4].change,
      up: gas90.changePct !== null ? gas90.changePct >= 0 : MOCK_TICKER[4].up,
    },
    {
      label: 'Auto Diesel',
      value: 'J$' + diesel.latest.toFixed(2) + '/L',
      change: diesel.changePct !== null ? (diesel.changePct >= 0 ? '+' : '') + diesel.changePct.toFixed(1) + '%' : MOCK_TICKER[5].change,
      up: diesel.changePct !== null ? diesel.changePct >= 0 : MOCK_TICKER[5].up,
    },
    MOCK_TICKER[6],
  ]

  // The chart needs at least 2 real data points to draw a real trend —
  // until then, keep showing the mock 12-month trend so the chart never
  // looks broken or empty.
  const fxTrend = fxRows.length >= 2
    ? {
        labels: fxRows.map(r => new Date(r.updated_at).toLocaleDateString('en-JM', { month: 'short', day: 'numeric' })),
        data: fxRows.map(r => r.value),
      }
    : MOCK_FX_TREND

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'realestate', label: 'Real Estate' },
    { key: 'tech', label: 'Tech & MSME' },
    { key: 'premium', label: 'Premium' },
  ]

  // Header badge reflects exactly which feeds are currently live.
  const liveLabels: string[] = []
  if (hasLiveJse) liveLabels.push('JSE')
  if (hasLiveFx) liveLabels.push('USD/JMD')
  if (hasLiveOtherFx) liveLabels.push('FX')
  if (hasLiveBoj) liveLabels.push('BOJ')
  if (hasLiveGas) liveLabels.push('GAS')
  const badgeText = liveLabels.length === 0
    ? 'MOCK DATA · PROTOTYPE'
    : liveLabels.join(' + ') + ' LIVE' + (liveLabels.length < 5 ? ' · REST MOCK' : '')

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
          <span className="text-[10px] px-2 py-1 rounded bg-[#1f2623] text-gray-400">
            {badgeText}
          </span>
        </header>
        <TickerMarquee ticker={ticker} />
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
          {tab === 'realestate' && <RealEstateTab rates={{ usd: latestFx, gbp: gbp.latest, cad: cad.latest }} />}
          {tab === 'tech' && <TechTab rates={{ usd: latestFx, gbp: gbp.latest, cad: cad.latest }} />}
          {tab === 'premium' && <PremiumTab fxTrend={fxTrend} isLive={fxRows.length >= 2} />}
        </main>
      </div>
    </div>
  )
}
