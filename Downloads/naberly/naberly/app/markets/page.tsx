'use client'
import { useState, useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

// Same live PayPal app already used for Boosts/Sponsor packages.
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_LIVE || ''
// Two PayPal subscription Plan IDs (created once in the PayPal dashboard
// under Account Settings > Products and services > Subscriptions). Each
// must be set as a Vercel environment variable before this goes live.
const PREMIUM_PLANS = {
  monthly: { planId: process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_MONTHLY_PLAN_ID || '', label: 'Monthly', priceLabel: '$4.99 / month' },
  annual: { planId: process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_ANNUAL_PLAN_ID || '', label: 'Annual', priceLabel: '$39.99 / year (save ~33%)' },
} as const

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

// "yieldExplainer" and "roundExplainer" translate a finance term into one
// plain-English sentence, shown in the detail panel so a non-specialist
// reader isn't left guessing what "Est. Yield" or "Seed" means.
const REAL_ESTATE = [
  { parish: 'Kingston', area: 'New Kingston', type: 'Commercial Office', jmd: 85000000, yield: '7.2%',
    blurb: 'An office building in New Kingston, the city\'s main business district. Businesses rent space here, and that rent is what generates the return shown below.' },
  { parish: 'St. Andrew', area: 'Barbican', type: 'Luxury Townhouse', jmd: 62000000, yield: '5.1%',
    blurb: 'A higher-end townhouse in Barbican, a residential area popular with professionals and returning-resident Jamaicans.' },
  { parish: 'St. Thomas', area: 'Morant Bay', type: 'Family Home', jmd: 14500000, yield: '6.3%',
    blurb: 'A standard family house in Morant Bay, the parish capital of St. Thomas on the south-east coast.' },
  { parish: 'Portland', area: 'Port Antonio', type: 'Eco-Lodge / Guesthouse', jmd: 32000000, yield: '8.1%',
    blurb: 'A small nature-focused guesthouse in Port Antonio, a tourism town known for rainforest and river attractions.' },
  { parish: 'St. Mary', area: 'Oracabessa', type: 'Beachfront Villa', jmd: 41000000, yield: '7.6%',
    blurb: 'A house directly on the beach in Oracabessa, a quiet north-coast town between Ocho Rios and Port Maria.' },
  { parish: 'St. Ann', area: 'Ocho Rios', type: 'Beachfront Condo', jmd: 35000000, yield: '8.8%',
    blurb: 'An apartment-style unit on the beach in Ocho Rios, a major cruise-ship and resort town.' },
  { parish: 'Trelawny', area: 'Falmouth', type: 'Short-Term Rental Townhouse', jmd: 26500000, yield: '7.9%',
    blurb: 'A townhouse in Falmouth, meant to be rented out short-term (like Airbnb) rather than lived in full-time, taking advantage of cruise-ship visitor traffic.' },
  { parish: 'St. Catherine', area: 'Portmore', type: 'Residential Lot', jmd: 9200000, yield: '6.0%',
    blurb: 'An empty piece of land in Portmore, a fast-growing commuter town just outside Kingston, ready for someone to build on.' },
  { parish: 'Clarendon', area: 'May Pen', type: 'Family Home', jmd: 16800000, yield: '5.8%',
    blurb: 'A standard family house in May Pen, the parish capital of Clarendon in central Jamaica.' },
  { parish: 'Manchester', area: 'Mandeville', type: 'Family Home', jmd: 28000000, yield: '5.5%',
    blurb: 'A standard family house in Mandeville, a hill-town known for its cooler climate and retiree population.' },
  { parish: 'St. James', area: 'Ironshore', type: 'Vacation Villa', jmd: 48500000, yield: '9.4%',
    blurb: 'A holiday home in Ironshore, near Montego Bay\'s hotel strip and the airport, typically rented out to tourists.' },
  { parish: 'Hanover', area: 'Lucea', type: 'Boutique Resort Unit', jmd: 22000000, yield: '7.0%',
    blurb: 'A unit inside a small resort property in Lucea, a quieter alternative to the bigger resort towns nearby.' },
  { parish: 'Westmoreland', area: 'Negril', type: 'Beachfront Villa', jmd: 55000000, yield: '9.8%',
    blurb: 'A house on the beach in Negril, one of Jamaica\'s best-known tourist destinations, famous for Seven Mile Beach.' },
  { parish: 'St. Elizabeth', area: 'Treasure Beach', type: 'Guesthouse', jmd: 19500000, yield: '8.4%',
    blurb: 'A small guesthouse in Treasure Beach, a laid-back fishing-village-turned-tourist-spot on the south coast.' },
]
// Plain-English explanation of "Est. Yield," shown once in the Real Estate
// detail panel rather than repeated on every row.
const YIELD_EXPLAINER = '"Est. Yield" is a rough estimate of the yearly rental income as a percentage of the purchase price — for example, a 7% yield on a J$10,000,000 property means roughly J$700,000 a year in rent, before expenses like maintenance, taxes and property management.'

const TECH = [
  { name: 'Flow Assist', sector: 'Fintech', round: 'Seed', usd: 450000, investors: 'Jamaica Digital Fund, Angel Syndicate JA',
    blurb: 'Flow Assist builds tools to help people manage everyday money — things like budgeting, bill reminders, or simple payments.' },
  { name: 'IslandGrid', sector: 'CleanTech / Energy', round: 'Pre-Seed', usd: 120000, investors: 'DBJ Innovation Grant',
    blurb: 'IslandGrid works on cleaner, more reliable power solutions — for example, solar or smarter electricity use for homes and businesses.' },
  { name: 'FarmLink JA', sector: 'AgriTech', round: 'Seed', usd: 300000, investors: 'Caribbean VC Partners',
    blurb: 'FarmLink JA connects farmers with buyers and helps them track crops, prices, or deliveries more easily using technology.' },
  { name: 'PortPulse', sector: 'Logistics SaaS', round: 'Series A', usd: 1800000, investors: 'Kingston Capital, EXIM JA',
    blurb: 'PortPulse makes software that helps shipping and port companies track cargo and move goods more efficiently.' },
  { name: 'MedLink JA', sector: 'HealthTech', round: 'Grant', usd: 75000, investors: 'JBDC Digitalization Grant',
    blurb: 'MedLink JA builds tools that help clinics or patients manage health records and appointments digitally.' },
]
// Plain-English glossary for funding-round terms, shown in the Tech detail
// panel so "Seed," "Pre-Seed," "Series A," and "Grant" aren't left unexplained.
const ROUND_EXPLAINER: Record<string, string> = {
  'Pre-Seed': 'The very earliest stage of funding, usually used to test an idea before the business has real customers yet.',
  'Seed': 'Early funding used to build the first version of a product and find its first paying customers.',
  'Series A': 'A later funding round for a business that already has customers and revenue, used to grow faster.',
  'Grant': 'Money given to the business that does not need to be paid back or exchanged for ownership — often from a government or development agency.',
}

// Plain-English glossary for government procurement methods, shown in the
// Government Contracts tab. Matching is substring-based so small variations
// in how GOJEP labels a method (e.g. with or without the "(SS)" abbreviation)
// still resolve to an explanation.
function explainProcurementMethod(method: string): string {
  const m = (method || '').toLowerCase()
  if (m.includes('single source')) return 'The government went directly to one supplier without a competitive bidding process — usually because that supplier is the only practical option, or the situation was urgent.'
  if (m.includes('restricted bidding')) return 'Only a limited, pre-selected group of suppliers was invited to bid, rather than opening it up to everyone.'
  if (m.includes('emergency')) return 'An emergency procedure was used to get something fixed or supplied urgently, bypassing the usual lengthier bidding timeline.'
  if (m.includes('open') || m.includes('national competitive') || m.includes('international competitive')) return 'This was openly advertised, and any qualified supplier could submit a bid.'
  if (m.includes('request for quotation') || m.includes('rfq')) return 'The government asked a small number of suppliers to each submit a price quote for comparison.'
  return 'A government procurement method used to select the supplier for this contract.'
}

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
// GOJEP publishes dates as "DD/MM/YYYY HH:mm:ss" text — parsed manually here
// since that format isn't natively understood by `new Date(...)`.
function fmtGovDate(raw: string): string {
  if (!raw) return ''
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (!match) return raw
  const [, dd, mm, yyyy] = match
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString('en-JM', { year: 'numeric', month: 'short', day: 'numeric' })
}
// Parses a comma-formatted contract amount (e.g. "2,127,500.00") into a
// number — same pattern already used for the JSE index value.
function parseGovAmount(raw: string): number {
  const n = parseFloat(String(raw).replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

// Wraps a value for safe inclusion as one CSV field (quotes it and escapes
// any quote characters inside it), used by the Premium CSV export.
function csvEscape(value: string | number): string {
  const s = String(value)
  return '"' + s.replace(/"/g, '""') + '"'
}

// Plain historical trend stats over a trailing window — NOT a prediction of
// where the rate is headed next, just what it has actually done. Used by
// the Premium tab in place of any forward-looking "predictive insight,"
// since predicting market direction for paying subscribers would read as
// financial advice.
function computeTrendStats(rows: { value: number; updated_at: string }[], days = 90) {
  if (rows.length === 0) return null
  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000
  const recent = rows.filter(r => new Date(r.updated_at).getTime() >= cutoffMs)
  const windowRows = recent.length >= 2 ? recent : rows
  const values = windowRows.map(r => r.value)
  const high = Math.max(...values)
  const low = Math.min(...values)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const latest = rows[rows.length - 1].value
  return { high, low, avg, latest, count: values.length, days: recent.length >= 2 ? days : windowRows.length }
}

// A plain-language, informational observation about where USD/JMD sits
// within its own recent range — not advice to send money now or later,
// just a description of where today's rate falls historically. This is
// the "remittance-timing indicator" shown in-app rather than a push/email
// alert, which would need separate notification infrastructure.
function remittanceIndicator(stats: ReturnType<typeof computeTrendStats>): { tone: 'good' | 'caution' | 'neutral'; text: string } | null {
  if (!stats || stats.high === stats.low) return null
  const position = (stats.latest - stats.low) / (stats.high - stats.low) // 0 (at low) .. 1 (at high)
  if (position >= 0.85) {
    return {
      tone: 'good',
      text: `USD/JMD (J$${stats.latest.toFixed(2)}) is near its ${stats.days}-day high of J$${stats.high.toFixed(2)}. Each US dollar is converting to more Jamaican dollars than it has recently — generally a stronger time to send money to Jamaica, value-wise.`,
    }
  }
  if (position <= 0.15) {
    return {
      tone: 'caution',
      text: `USD/JMD (J$${stats.latest.toFixed(2)}) is near its ${stats.days}-day low of J$${stats.low.toFixed(2)}. Each US dollar is converting to fewer Jamaican dollars than it has recently.`,
    }
  }
  return {
    tone: 'neutral',
    text: `USD/JMD (J$${stats.latest.toFixed(2)}) is within its typical ${stats.days}-day range of J$${stats.low.toFixed(2)}–J$${stats.high.toFixed(2)}.`,
  }
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

// Pulls real, already-awarded government contract records (populated by the
// Make.com → Apify/GOJEP automation) from Supabase. This is deliberately
// scoped to awarded contracts, not open-for-bidding tenders, and the UI
// built from it only ever links to the public notice PDF — never the bid
// submission portal — to keep this strictly informational, not a bidding tool.
function useGovContracts() {
  const [contracts, setContracts] = useState<{
    id: string
    title: string
    procuring_entity: string
    procurement_method: string
    contract_amount: string
    published_date: string
    notice_pdf_url: string
  }[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase
      .from('gov_contracts')
      .select('id, title, procuring_entity, procurement_method, contract_amount, published_date, notice_pdf_url')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setContracts(data)
        setLoaded(true)
      })
  }, [])

  return { contracts, loaded }
}

// Pulls real, currently OPEN (not yet awarded) government tenders — scraped
// from GOJEP's public "Competitions of opened bids" page via the Make.com
// automation. Same informational-only approach as useGovContracts: the UI
// built from this only ever links to the public notice page, never a bid
// submission flow.
function useGovOpenTenders() {
  const [tenders, setTenders] = useState<{
    id: string
    gojep_resource_id: string
    title: string
    reference_number: string
    procuring_entity: string
    procurement_method: string
    submission_deadline: string
    status: string
    notice_url: string
  }[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase
      .from('gov_open_tenders')
      .select('id, gojep_resource_id, title, reference_number, procuring_entity, procurement_method, submission_deadline, status, notice_url')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setTenders(data)
        setLoaded(true)
      })
  }, [])

  return { tenders, loaded }
}

// Genuinely open-for-bidding GOJEP tenders — real data, but NOT automated:
// GOJEP's live-search page is CAPTCHA-gated, so this table is refreshed
// manually (you run the search yourself, paste the results to Claude, and
// it updates this table with a fresh SQL seed). See master notes.
function useGovOpenBids() {
  const [bids, setBids] = useState<{
    id: string
    title: string
    reference_number: string
    procuring_entity: string
    submission_deadline: string
    procurement_method: string
    status: string
    notice_url: string | null
  }[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase
      .from('gov_open_bids')
      .select('id, title, reference_number, procuring_entity, submission_deadline, procurement_method, status, notice_url')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setBids(data)
        setLoaded(true)
      })
  }, [])

  return { bids, loaded }
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

function LandFraudGuideBox() {
  const [openGuide, setOpenGuide] = useState(false)
  return (
    <div className="bg-[#101512] border border-[#1f2623] rounded-lg p-4 mb-4">
      <button onClick={() => setOpenGuide(v => !v)} className="w-full flex items-center justify-between text-left">
        <div>
          <p className="text-white font-semibold text-sm">🛡️ Land Fraud Protection Guide</p>
          <p className="text-xs text-gray-500">Real steps from the National Land Agency to protect a property before and after you buy — not legal advice.</p>
        </div>
        <span className="text-amber-400 text-xs whitespace-nowrap ml-3">{openGuide ? 'Hide ▲' : 'Show ▼'}</span>
      </button>
      {openGuide && (
        <div className="mt-4 space-y-4 text-sm text-gray-300">
          <div>
            <p className="text-amber-400 font-semibold mb-1">Never rely on the duplicate Certificate of Title alone</p>
            <p>The NLA itself warns against this — a court order, caveat, or pending transaction can exist on the official register without appearing on the owner's copy. Always do an official search before you buy, not just a look at their paperwork.</p>
          </div>
          <div>
            <p className="text-amber-400 font-semibold mb-1">Lodge a caveat if you have a claim or interest in land</p>
            <p>A caveat is a legal notice under the Registration of Titles Act that blocks any transfer or mortgage on a property from being registered until it's resolved — the strongest protection available short of being the registered owner. You do <span className="text-white">not</span> need the duplicate title to lodge one.</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
              <li>Cost: a lodgement fee of 0.5% of the value of the interest you're claiming.</li>
              <li>What you'll need: the caveat form (in duplicate), supporting documents (agreement for sale, mortgage deed, receipts, etc.) or a statutory declaration if you have none, and an address for service within Kingston.</li>
              <li>Once lodged, the Registrar must notify you of any attempted dealing on the property, giving you 14 days to seek a court order before it can proceed.</li>
            </ul>
          </div>
          <div>
            <p className="text-amber-400 font-semibold mb-1">When to consider lodging one</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>You've signed an agreement for sale but the title hasn't transferred to you yet.</li>
              <li>You've advanced money (a deposit, a mortgage) against a property that isn't yet registered in your name.</li>
              <li>You're a family member protecting an inherited property from being quietly transferred by someone else.</li>
            </ul>
          </div>
          <div className="bg-[#0c0f0d] border border-[#1f2623] rounded-md p-3">
            <p className="text-white font-semibold mb-1">To lodge a caveat or ask the NLA directly:</p>
            <p className="text-gray-400">National Land Agency, 8 Ardenne Road, Kingston 10 · <a href="mailto:asknla@nla.gov.jm" className="text-amber-400 underline">asknla@nla.gov.jm</a> · 876-750-5263 / 876-946-5263 / 876-418-5089</p>
          </div>
          <p className="text-xs text-gray-500">Always get an attorney-at-law to review a property transaction before you send money or sign anything — this guide explains what the official protections are, not a substitute for legal advice.</p>
        </div>
      )}
    </div>
  )
}

function RealEstateTab({ rates }: { rates: { usd: number; gbp: number; cad: number } }) {
  const [parish, setParish] = useState('All')
  const [q, setQ] = useState('')
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const rows = REAL_ESTATE.filter(r =>
    (parish === 'All' || r.parish === parish) &&
    (q === '' || r.area.toLowerCase().includes(q.toLowerCase()) || r.type.toLowerCase().includes(q.toLowerCase()))
  )
  const open = openIdx !== null ? rows[openIdx] : null
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
      <div className="bg-[#101512] border border-[#1f2623] rounded-lg p-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-400">Need an official title search or land registry record for a specific property?</p>
        <a href="https://elandjamaica.nla.gov.jm" target="_blank" rel="noopener noreferrer"
          className="text-xs text-amber-400 hover:text-amber-300 underline whitespace-nowrap">
          Search eLandJamaica directly →
        </a>
      </div>
      <LandFraudGuideBox />
      {open && (
        <div className="bg-[#101512] border border-amber-600/40 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-white font-semibold">{open.type} — {open.area}, {open.parish}</p>
              <p className="text-xs text-gray-500">This is general information, not an offer or recommendation to buy.</p>
            </div>
            <button onClick={() => setOpenIdx(null)} className="text-gray-400 hover:text-white text-sm px-2">✕ Close</button>
          </div>
          <p className="text-sm text-gray-300 mb-3">{open.blurb}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-sm">
            <div><p className="text-[10px] uppercase text-gray-500">Price (JMD)</p><p className="text-white">{fmtJMD(open.jmd)}</p></div>
            <div><p className="text-[10px] uppercase text-gray-500">Price (USD)</p><p className="text-white">{fmtUSD(open.jmd, rates.usd)}</p></div>
            <div><p className="text-[10px] uppercase text-gray-500">Price (GBP)</p><p className="text-white">{fmtForeign(open.jmd, rates.gbp, '£')}</p></div>
            <div><p className="text-[10px] uppercase text-gray-500">Price (CAD)</p><p className="text-white">{fmtForeign(open.jmd, rates.cad, 'CA$')}</p></div>
          </div>
          <p className="text-xs text-gray-400"><span className="text-amber-400 font-semibold">Est. Yield: {open.yield}.</span> {YIELD_EXPLAINER}</p>
        </div>
      )}
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
              <tr key={i} onClick={() => setOpenIdx(i)}
                className={'border-t border-[#1f2623] hover:bg-[#101512] cursor-pointer ' + (openIdx === i ? 'bg-[#141a17]' : '')}>
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

// ───────────────────────── Jamaica Life tab ─────────────────────────
// Seven practical, everyday-value boxes. Every figure below was read directly
// from the named official/public source (checked Oct 2026). Nothing is invented.
// Where a source does not publish a number or a status, the box says so.

function LifeBox({ icon, title, blurb, source, children }: {
  icon: string; title: string; blurb: string; source: string; children?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-[#101512] border border-[#1f2623] rounded-lg p-4">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-start justify-between text-left gap-3">
        <div>
          <p className="text-white font-semibold text-sm">{icon} {title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{blurb}</p>
        </div>
        <span className="text-amber-400 text-xs whitespace-nowrap">{open ? 'Hide ▲' : 'Open ▼'}</span>
      </button>
      {open && (
        <div className="mt-4 text-sm text-gray-300 space-y-3">
          {children}
          <p className="text-[11px] text-gray-500 border-t border-[#1f2623] pt-2">Source: {source}</p>
        </div>
      )}
    </div>
  )
}

const REMIT_ROWS: { firm: string; how: string; fee: number; margin: number; totalPct: number }[] = [
  { firm: 'Walmart2World', how: 'Debit card · online · cash pickup', fee: 0, margin: -2.25, totalPct: -2.25 },
  { firm: 'Walmart2World', how: 'Debit card · agent · cash pickup', fee: 5.99, margin: -0.35, totalPct: 2.65 },
  { firm: 'MoneyGram', how: 'Bank account · online · cash pickup', fee: 2.80, margin: 1.80, totalPct: 3.20 },
  { firm: 'Jamaica National', how: 'Cash · bank branch · cash pickup', fee: 6.50, margin: 0, totalPct: 3.25 },
  { firm: 'Ria', how: 'Bank account · online · cash pickup', fee: 4.00, margin: 1.93, totalPct: 3.93 },
  { firm: 'CAM', how: 'Cash · agent · cash pickup', fee: 8.00, margin: 0, totalPct: 4.00 },
  { firm: 'Ria', how: 'Debit card · online · cash pickup', fee: 4.90, margin: 1.93, totalPct: 4.38 },
  { firm: 'Remitly', how: 'Debit card · online · to bank account', fee: 2.99, margin: 3.35, totalPct: 4.85 },
  { firm: 'Walmart2World', how: 'Credit card · online · cash pickup', fee: 11.99, margin: -0.35, totalPct: 5.65 },
  { firm: 'Western Union', how: 'Bank/debit/credit · online · cash pickup', fee: 4.99, margin: 3.86, totalPct: 6.36 },
  { firm: 'Ria', how: 'Cash · agent · cash pickup', fee: 9.00, margin: 1.93, totalPct: 6.43 },
  { firm: 'Western Union', how: 'Cash · agent · cash pickup', fee: 8.00, margin: 3.39, totalPct: 7.39 },
  { firm: 'Ria', how: 'Credit card · online · cash pickup', fee: 11.00, margin: 1.93, totalPct: 7.43 },
  { firm: 'MoneyGram', how: 'Credit card · online · cash pickup', fee: 11.99, margin: 1.80, totalPct: 7.80 },
  { firm: 'Xoom', how: 'Debit card/bank · online · cash pickup', fee: 0, margin: 9.29, totalPct: 9.29 },
  { firm: 'Xoom', how: 'Credit card · online · cash pickup', fee: 5.87, margin: 9.29, totalPct: 12.23 },
  { firm: 'Walmart2World', how: 'Cash · agent · cash pickup', fee: 14.00, margin: 5.68, totalPct: 12.68 },
]

function JamaicaLifeTab({ rate, rateIsLive }: { rate: number; rateIsLive: boolean }) {
  const SEND = 200
  const rows = REMIT_ROWS.map(r => ({
    ...r,
    totalUsd: (r.totalPct / 100) * SEND,
    jmdReceived: Math.round((SEND - r.fee) * rate * (1 - r.margin / 100)),
  }))
  return (
    <div>
      <div className="bg-[#101512] border border-[#1f2623] rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-400">Everyday money, paperwork and safety information for Jamaicans at home and abroad — each box is built only from an official or published source, named at the bottom of the box. Where a source doesn't publish something (a deadline, a rate), the box says so rather than guessing.</p>
      </div>
      <div className="grid grid-cols-1 gap-3">

        <LifeBox icon="💸" title="Sending money to Jamaica: what it really costs" blurb="Real fees and exchange-rate markups on a US$200 transfer, provider by provider, cheapest first."
          source="World Bank, Remittance Prices Worldwide — United States → Jamaica corridor, Q3 2025 (collected Aug 13–28, 2025). Dollar figures are the World Bank's; the JMD column is our estimate.">
          <p className="text-gray-400">The "total cost" is the transfer fee plus the hidden markup on the exchange rate. The average across all providers was 6.06% (about US$12.12 on US$200). Official rates move daily, so check the provider's own screen before sending — this shows who has been cheapest and who has not.</p>
          <div className="overflow-x-auto border border-[#1f2623] rounded-lg">
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="bg-[#0c0f0d] text-left text-[10px] uppercase tracking-wider text-gray-400">
                  <th className="px-2 py-2">Provider</th><th className="px-2 py-2">How</th>
                  <th className="px-2 py-2">Fee</th><th className="px-2 py-2">Rate markup</th>
                  <th className="px-2 py-2">Total cost</th><th className="px-2 py-2">Est. JMD received</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-[#1f2623]">
                    <td className="px-2 py-2 text-white font-medium">{r.firm}</td>
                    <td className="px-2 py-2 text-gray-400">{r.how}</td>
                    <td className="px-2 py-2 text-gray-300">${r.fee.toFixed(2)}</td>
                    <td className="px-2 py-2 text-gray-300">{r.margin.toFixed(2)}%</td>
                    <td className="px-2 py-2 text-emerald-400 font-semibold">{r.totalPct.toFixed(2)}% (${r.totalUsd.toFixed(2)})</td>
                    <td className="px-2 py-2 text-gray-300">{fmtJMD(r.jmdReceived)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-500">
            Est. JMD received = (US$200 − fee) × {rateIsLive ? "today's USD/JMD rate on this site" : 'a placeholder USD/JMD rate (live feed currently unavailable)'} (J${rate.toFixed(2)}) × (1 − markup). A negative markup means the provider's rate was better than the reference rate. Bank of Jamaica publishes the official market rate at boj.org.jm.
          </p>
        </LifeBox>

        <LifeBox icon="🏠" title="NHT contribution refund" blurb="Who can claim back National Housing Trust contributions, and when."
          source="National Housing Trust, nht.gov.jm/refunds (read Oct 2026).">
          <p><span className="text-amber-400 font-semibold">Regular refund:</span> you become eligible in the 8th year after the contributions were made. For example, contributions made in 2018 can be claimed now, along with earlier years. Employees, self-employed and voluntary contributors can apply.</p>
          <p><span className="text-amber-400 font-semibold">Special refunds</span> (no waiting period): retirees, invalidity pensioners, expatriates leaving Jamaica, and agents of deceased contributors.</p>
          <p className="text-gray-400">Have ready: your NIS number, TRN, valid ID, and the registered names of every company you worked for and the years you worked at each.</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <a href="https://www.nht.gov.jm/refunds" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">NHT refund rules →</a>
            <a href="https://online.nht.gov.jm" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">NHT Online portal (apply) →</a>
          </div>
        </LifeBox>

        <LifeBox icon="🧾" title="Government fees, plainly" blurb="What passports, driver's licences and vehicle licences officially cost — so no one overcharges you."
          source="PICA (pica.gov.jm/passport/fees) and Tax Administration Jamaica (jamaicatax.gov.jm/rates-and-fees). PICA's table is labelled effective June 1, 2015; TAJ's page shows no effective date. Fees can change — confirm at the office or on the agency's site before paying.">
          <div>
            <p className="text-amber-400 font-semibold mb-1">Passport (applied for in Jamaica, JMD)</p>
            <ul className="list-disc list-inside text-gray-400 space-y-0.5">
              <li>Adult regular: J$6,500 · rush 3 days J$9,500 · next day J$11,500 · same day J$16,500</li>
              <li>Adult replacement: J$11,500 · rush 3 days J$14,500 · next day J$16,500 · same day J$21,500</li>
              <li>Minor regular: J$4,000 · rush 3 days J$6,000 · next day J$7,000 · same day J$9,000</li>
              <li>Minor replacement: J$7,000 · rush 3 days J$9,000 · next day J$10,000 · same day J$12,500</li>
              <li>Overseas applications: adult regular US$80 / £50, adult replacement US$160 / £100, minor regular US$50 / £30, minor replacement US$100 / £50 (consulates may add a processing fee)</li>
            </ul>
          </div>
          <div>
            <p className="text-amber-400 font-semibold mb-1">Driver's licence (TAJ)</p>
            <ul className="list-disc list-inside text-gray-400 space-y-0.5">
              <li>Private: J$5,400 · General: J$7,200 · Motorcycle: J$4,140</li>
              <li>Provisional (learner's), 1 year: J$1,800 · Substitute: J$4,140</li>
            </ul>
          </div>
          <div>
            <p className="text-amber-400 font-semibold mb-1">Private motor vehicle licence, 12 months (TAJ)</p>
            <ul className="list-disc list-inside text-gray-400 space-y-0.5">
              <li>Up to 1199cc: J$9,240 · electric cars: J$9,240</li>
              <li>1200–2999cc: J$12,600 · 3000–3999cc: J$28,800 · over 3999cc: J$43,650</li>
            </ul>
          </div>
          <p className="text-gray-400">Business registration and land-title search fees: we could not confirm current official amounts (the published figures we found were years out of date), so we are not showing any. Check the Companies Office of Jamaica and the National Land Agency directly.</p>
        </LifeBox>

        <LifeBox icon="🚀" title="Funding programmes for small businesses" blurb="Standing loan and grant programmes from DBJ and EXIM Bank — with what each one actually says about its status."
          source="Development Bank of Jamaica (dbankjm.com, dbjserve.com, dbjgemini.com), Jamaica Observer (May 21, 2025), EXIM Bank Jamaica (eximbankja.com). None of these pages publish application deadlines.">
          <p className="text-gray-400">Honest note: no official page we found publishes live deadlines or whether intake is open right now. Call or email the lender to confirm before you plan around any of these.</p>
          <ul className="space-y-2">
            <li><span className="text-white font-semibold">DBJ loans</span> (via approved financial institutions): Credit Enhancement Facility, M5 Energy Loan, Agribiz Loan Facility, M5 Recovery. For MSMEs with annual revenue up to J$425 million; DBJ finances up to 90% of project cost. Rates and amounts are not published on the page.</li>
            <li><span className="text-white font-semibold">DBJ GEMINI+</span>: enterprise-readiness programme (grants, credit-readiness, financial literacy). Tier 2 (small business) incubator/accelerator grant up to J$800,000. Apply at dbjgemini.com. Call 1-876-929-5161.</li>
            <li><span className="text-white font-semibold">DBJ SERVE</span> (listed on dbjserve.com): Go-Digital Voucher up to J$300,000 grant; Go-Digital Loan J$800,000 at 2% over 3 years; MSME Recovery Loan J$10 million at 5% over 8 years. The page does not say whether these are currently open.</li>
            <li><span className="text-white font-semibold">EXIM Bank SME Growth Initiative</span>: borrow up to the Jamaican equivalent of US$500,000 for equipment, upgrades, working capital or market research; maximum 5 years including a 12-month principal moratorium. For productive-sector businesses (e.g. export, manufacturing, tourism, creative industries) with annual earnings under J$360 million. Apply online or through participating commercial banks.</li>
            <li><span className="text-red-300 font-semibold">On hold:</span> DBJ's IGNITE (up to J$7 million) and Innovation Grant Fund (up to J$20 million) were paused in May 2025 after their funding was exhausted, with no restart date given.</li>
          </ul>
          <p className="text-xs text-gray-500">DBJ: (876) 929-4000 · mail@dbankjm.com</p>
        </LifeBox>

        <LifeBox icon="🏦" title="Bank loan & mortgage rates" blurb="Published borrowing rates from the banks that post them publicly."
          source="jm.scotiabank.com (Borrowing Rates page) and jnbank.com (Mortgage Rates page), read Oct 3, 2026. Rates change; these are what the banks displayed that day.">
          <div>
            <p className="text-amber-400 font-semibold mb-1">Scotiabank Jamaica (APR / EAIR)</p>
            <ul className="list-disc list-inside text-gray-400 space-y-0.5">
              <li>Mortgages: 8.50% – 12.49%</li>
              <li>Lot loans: 8.50% – 12.49%</li>
              <li>Auto, new: 8.50% – 11.75% · Auto, used: 10.10% – 14.75%</li>
              <li>Cash-secured loans: 9.00% – 11.00%</li>
              <li>Unsecured loans: 18.00% – 24.99%</li>
            </ul>
          </div>
          <div>
            <p className="text-amber-400 font-semibold mb-1">JN Bank — mortgages</p>
            <ul className="list-disc list-inside text-gray-400 space-y-0.5">
              <li>JN Home Loan (purchase/construction): 9.85% (up to 90% financing)</li>
              <li>Home Equity Loan: 9.85% · Home Enhancement Loan: 9.85% · Refinancing (owner-occupied): 9.85%</li>
              <li>Lot with infrastructure: 9.85% · Lot without infrastructure: 10.35%</li>
              <li>Residential investment: 10.35% · Resort properties: 10.50% · Commercial mortgage: 9.75%</li>
              <li>Foreign-currency residential mortgage: US 6.00%, CAN 5.75%, £6.75%</li>
            </ul>
          </div>
          <p className="text-gray-400">NCB's rates page could not be read automatically, and JMMB publishes deposit rates but not loan rates, so neither is shown. Always ask the bank for your personal rate — it depends on your term, collateral and credit.</p>
        </LifeBox>

        <LandFraudGuideBox />

        <LifeBox icon="🌀" title="Hurricane preparedness checklist" blurb="What to do before, during and after a hurricane — and where to get live advisories."
          source="Jamaica Information Service (JIS) — Hurricane Safety Tips. For live storm information use ODPEM and the Meteorological Service of Jamaica; this checklist is not an alert feed.">
          <div>
            <p className="text-amber-400 font-semibold mb-1">Before the season</p>
            <ul className="list-disc list-inside text-gray-400 space-y-0.5">
              <li>Check and repair your roof, shutters, hooks and latches; secure galvanized sheeting</li>
              <li>Keep lumber/plywood on hand for boarding up; trim trees near power lines and buildings</li>
              <li>Secure small structures such as sheds and outdoor kitchens</li>
              <li>Service emergency cooking equipment (coal stove); keep kerosene and coal dry</li>
              <li>Store non-perishable food in waterproof containers; gather first-aid supplies</li>
            </ul>
          </div>
          <div>
            <p className="text-amber-400 font-semibold mb-1">Emergency kit</p>
            <p className="text-gray-400">Water · non-perishable food · flashlights and batteries · battery-powered radio · hurricane lamp and matches · boots and raincoats · plastic bags, nails, hammer and tools · first-aid supplies (iodine, bandages, eye lotion) · kerosene and coal.</p>
          </div>
          <div>
            <p className="text-amber-400 font-semibold mb-1">During</p>
            <ul className="list-disc list-inside text-gray-400 space-y-0.5">
              <li>Stay indoors and keep children inside; if you are away from home, stay where you are</li>
              <li>If the house shows signs of breaking up, shelter under a sturdy table or in a strong closet</li>
              <li>Block unboarded windows with heavy objects; listen to the radio for updates</li>
            </ul>
          </div>
          <div>
            <p className="text-amber-400 font-semibold mb-1">After</p>
            <ul className="list-disc list-inside text-gray-400 space-y-0.5">
              <li>Do not touch loose electrical wires — report them; report broken water or sewer lines to the parish council</li>
              <li>Boil all drinking water until it is confirmed safe; do not walk barefoot (broken glass)</li>
              <li>Seek medical attention for injuries; watch for fallen trees and debris</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <a href="https://www.odpem.gov.jm" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">ODPEM (official) →</a>
            <a href="https://x.com/MetserviceJA" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">Met Service Jamaica (live alerts) →</a>
          </div>
        </LifeBox>

      </div>
    </div>
  )
}

function TechTab({ rates }: { rates: { usd: number; gbp: number; cad: number } }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const open = openIdx !== null ? TECH[openIdx] : null
  return (
    <div>
      {open && (
        <div className="bg-[#101512] border border-amber-600/40 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-white font-semibold">{open.name}</p>
              <p className="text-xs text-gray-500">This is general information, not an offer or recommendation to invest.</p>
            </div>
            <button onClick={() => setOpenIdx(null)} className="text-gray-400 hover:text-white text-sm px-2">✕ Close</button>
          </div>
          <p className="text-sm text-gray-300 mb-3">{open.blurb}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-sm">
            <div><p className="text-[10px] uppercase text-gray-500">Amount (USD)</p><p className="text-white">${open.usd.toLocaleString()}</p></div>
            <div><p className="text-[10px] uppercase text-gray-500">Amount (JMD)</p><p className="text-white">{fmtJMD(Math.round(usdToJmd(open.usd, rates.usd)))}</p></div>
            <div><p className="text-[10px] uppercase text-gray-500">Amount (GBP)</p><p className="text-white">{usdToForeign(open.usd, rates.usd, rates.gbp, '£')}</p></div>
            <div><p className="text-[10px] uppercase text-gray-500">Amount (CAD)</p><p className="text-white">{usdToForeign(open.usd, rates.usd, rates.cad, 'CA$')}</p></div>
          </div>
          <p className="text-xs text-gray-400 mb-1"><span className="text-amber-400 font-semibold">Funding stage: {open.round}.</span> {ROUND_EXPLAINER[open.round] || ''}</p>
          <p className="text-xs text-gray-400">Backed by: {open.investors}</p>
        </div>
      )}
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
              <tr key={i} onClick={() => setOpenIdx(i)}
                className={'border-t border-[#1f2623] hover:bg-[#101512] cursor-pointer ' + (openIdx === i ? 'bg-[#141a17]' : '')}>
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
    </div>
  )
}

function GovContractsTab() {
  const { contracts, loaded } = useGovContracts()
  const [search, setSearch] = useState('')
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  // No date cutoff — mirrors GOJEP's own "Contract Award Notices" listing,
  // which shows every awarded contract on record rather than aging old
  // ones out after a fixed window.
  const filtered = contracts.filter(c => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return c.title?.toLowerCase().includes(s) || c.procuring_entity?.toLowerCase().includes(s)
  })

  return (
    <div>
      <div className="bg-[#101512] border border-[#1f2623] rounded-lg p-3 mb-4">
        <p className="text-sm text-gray-300">
          <span className="text-amber-400 font-semibold">What this is:</span> Awarded Contracts — publicly posted records of government contracts that have been awarded, sourced from Jamaica's official procurement portal (GOJEP). This is for transparency only — it is not a listing of open or closed bids, and NaberlyJA does not help anyone bid on or win government work.
        </p>
      </div>

      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setOpenIdx(null) }}
        placeholder="Search by project or government entity..."
        className="w-full mb-4 bg-[#101512] border border-[#1f2623] rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
      />

      {!loaded && <p className="text-sm text-gray-500">Loading contracts...</p>}
      {loaded && filtered.length === 0 && <p className="text-sm text-gray-500">No contracts found yet.</p>}

      <div className="space-y-2">
        {filtered.map((c, i) => {
          const amount = parseGovAmount(c.contract_amount)
          const isOpen = openIdx === i
          return (
            <div key={c.id} className="border border-[#1f2623] rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className={'w-full text-left px-4 py-3 hover:bg-[#101512] ' + (isOpen ? 'bg-[#141a17]' : '')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.procuring_entity} · {fmtGovDate(c.published_date)}</p>
                  </div>
                  <p className="text-amber-400 font-semibold text-sm whitespace-nowrap">{fmtJMD(amount)}</p>
                </div>
              </button>
              {isOpen && (
                <div className="px-4 py-3 border-t border-[#1f2623] bg-[#0d1210]">
                  <p className="text-xs text-gray-400 mb-2">
                    <span className="text-amber-400 font-semibold">Procurement method: {c.procurement_method}.</span> {explainProcurementMethod(c.procurement_method)}
                  </p>
                  {c.notice_pdf_url && (
                    <a href={c.notice_pdf_url} target="_blank" rel="noopener noreferrer"
                      className="inline-block text-xs text-amber-400 hover:text-amber-300 underline">
                      View official notice (PDF) →
                    </a>
                  )}
                  <p className="text-[11px] text-gray-500 mt-2">This is general information from a public record, not an offer, endorsement, or recommendation.</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Despite the name "gov_open_tenders," this data is sourced from GOJEP's
// "Competitions of opened bids" page — meaning the bidding window has
// already CLOSED and these are awaiting evaluation, not accepting new
// bids. The table/hook name is kept as-is to avoid an extra migration,
// but the UI below is deliberately explicit that these are closed.
// Mirrors GOJEP's own "Closed Bids" listing — real closed-bid tenders
// only, no merging in of aged-out contract awards.
type ClosedBidRow = {
  id: string
  title: string
  procuring_entity: string
  procurement_method: string
  badge: string
  detailLabel: string
  detailValue: string
  noticeUrl: string
  closedNote: string
}

function GovClosedBidsTab() {
  const { tenders, loaded } = useGovOpenTenders()
  const [search, setSearch] = useState('')
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const rows: ClosedBidRow[] = tenders.map(t => ({
    id: 'tender-' + t.id,
    title: t.title,
    procuring_entity: t.procuring_entity,
    procurement_method: t.procurement_method,
    badge: 'Closed · ' + t.status,
    detailLabel: 'Bid Submission Deadline (passed)',
    detailValue: t.submission_deadline,
    noticeUrl: t.notice_url,
    closedNote: 'Bidding is closed for this tender — it can no longer be bid on.',
  }))

  const filtered = rows.filter(r => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return r.title?.toLowerCase().includes(s) || r.procuring_entity?.toLowerCase().includes(s)
  })

  return (
    <div>
      <div className="bg-[#101512] border border-[#1f2623] rounded-lg p-3 mb-4">
        <p className="text-sm text-gray-300">
          <span className="text-amber-400 font-semibold">What this is:</span> Closed Bids — government tenders whose bidding window has already <span className="text-red-400 font-semibold">closed</span> and are being evaluated. Across all sectors, sourced live from Jamaica's official procurement portal (GOJEP). <span className="font-semibold text-white">None of these can still be bid on.</span> This is for transparency only — NaberlyJA does not facilitate bidding.
        </p>
      </div>

      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setOpenIdx(null) }}
        placeholder="Search by project or government entity..."
        className="w-full mb-4 bg-[#101512] border border-[#1f2623] rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
      />

      {!loaded && <p className="text-sm text-gray-500">Loading closed bids...</p>}
      {loaded && filtered.length === 0 && <p className="text-sm text-gray-500">No closed bids found yet.</p>}

      <div className="space-y-2">
        {filtered.map((r, i) => {
          const isOpen = openIdx === i
          return (
            <div key={r.id} className="border border-[#1f2623] rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className={'w-full text-left px-4 py-3 hover:bg-[#101512] ' + (isOpen ? 'bg-[#141a17]' : '')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.procuring_entity}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-900/40 text-red-400 font-semibold whitespace-nowrap">{r.badge}</span>
                </div>
              </button>
              {isOpen && (
                <div className="px-4 py-3 border-t border-[#1f2623] bg-[#0d1210]">
                  <div className="bg-red-900/20 border border-red-600/30 rounded-md px-3 py-2 mb-3">
                    <p className="text-xs text-red-300 font-semibold">{r.closedNote}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div><p className="text-[10px] uppercase text-gray-500">{r.detailLabel}</p><p className="text-white">{r.detailValue}</p></div>
                    <div><p className="text-[10px] uppercase text-gray-500">Current Status</p><p className="text-white">{r.badge}</p></div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    <span className="text-amber-400 font-semibold">Procurement method: {r.procurement_method}.</span> {explainProcurementMethod(r.procurement_method)}
                  </p>
                  {r.noticeUrl && (
                    <a href={r.noticeUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-block text-xs text-amber-400 hover:text-amber-300 underline">
                      View official notice →
                    </a>
                  )}
                  <p className="text-[11px] text-gray-500 mt-2">This is general information from a public record, not an offer, endorsement, or recommendation. NaberlyJA does not facilitate bidding.</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Real, currently-open-for-bidding GOJEP tenders — manually refreshed (see
// useGovOpenBids above for why). Green "Open" badges distinguish these from
// the red "Closed"/"Awarded" badges on the other two tabs.
function OpenBidsTab() {
  const { bids, loaded } = useGovOpenBids()
  const [search, setSearch] = useState('')
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const filtered = bids.filter(b => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return b.title?.toLowerCase().includes(s) || b.procuring_entity?.toLowerCase().includes(s)
  })

  return (
    <div>
      <div className="bg-[#101512] border border-[#1f2623] rounded-lg p-3 mb-4">
        <p className="text-sm text-gray-300">
          <span className="text-amber-400 font-semibold">What this is:</span> Open Bids — government tenders <span className="text-emerald-400 font-semibold">currently accepting bids</span>, sourced from Jamaica's official procurement portal (GOJEP). Because GOJEP's live search requires solving a CAPTCHA, this list is refreshed by hand periodically rather than updated automatically — dates shown were accurate as of the last refresh. Always confirm the deadline on the official notice before relying on it. This is for transparency only — NaberlyJA does not facilitate bidding.
        </p>
      </div>

      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setOpenIdx(null) }}
        placeholder="Search by project or government entity..."
        className="w-full mb-4 bg-[#101512] border border-[#1f2623] rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
      />

      {!loaded && <p className="text-sm text-gray-500">Loading open bids...</p>}
      {loaded && filtered.length === 0 && <p className="text-sm text-gray-500">No open bids found yet.</p>}

      <div className="space-y-2">
        {filtered.map((b, i) => {
          const isOpen = openIdx === i
          return (
            <div key={b.id} className="border border-[#1f2623] rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className={'w-full text-left px-4 py-3 hover:bg-[#101512] ' + (isOpen ? 'bg-[#141a17]' : '')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white text-sm font-medium">{b.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{b.procuring_entity}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 font-semibold whitespace-nowrap">Open</span>
                </div>
              </button>
              {isOpen && (
                <div className="px-4 py-3 border-t border-[#1f2623] bg-[#0d1210]">
                  <div className="bg-emerald-900/20 border border-emerald-600/30 rounded-md px-3 py-2 mb-3">
                    <p className="text-xs text-emerald-300 font-semibold">This bid is currently open — it can still be bid on.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div><p className="text-[10px] uppercase text-gray-500">Bid Submission Deadline</p><p className="text-white">{b.submission_deadline}</p></div>
                    <div><p className="text-[10px] uppercase text-gray-500">Reference Number</p><p className="text-white">{b.reference_number}</p></div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    <span className="text-amber-400 font-semibold">
                      Procurement method:{' '}
                      <a href="https://www.gojep.gov.jm/epps/prepareCurrentOpportunities.do?currentType=cft" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300">
                        {b.procurement_method}
                      </a>.
                    </span> {explainProcurementMethod(b.procurement_method)}
                  </p>
                  {b.notice_url ? (
                    <a href={b.notice_url} target="_blank" rel="noopener noreferrer"
                      className="inline-block text-xs text-amber-400 hover:text-amber-300 underline">
                      View official notice (PDF) →
                    </a>
                  ) : (
                    <a href="https://www.gojep.gov.jm/epps/prepareCurrentOpportunities.do?currentType=cft" target="_blank" rel="noopener noreferrer"
                      className="inline-block text-xs text-amber-400 hover:text-amber-300 underline">
                      Search this bid on GOJEP directly →
                    </a>
                  )}
                  <p className="text-[11px] text-gray-500 mt-2">This is general information from a public record, not an offer, endorsement, or recommendation. NaberlyJA does not facilitate bidding.</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
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

  // Live and built, shown to subscribers as real features below. Only
  // things actually gated behind the subscription belong here — Contract
  // Award Notices, Closed Bids, and the eLandJamaica link all live on
  // free top-level tabs, so they're deliberately left off this list.
  const liveBenefits = [
    'Raw CSV data exports (JSE, FX, real estate)',
    'Historical high / low / average trend stats (JSE & FX)',
    'Diaspora remittance-timing indicator (in-app)',
    '5-year BOJ policy rate history (real data, backfilled from BOJ’s own published records)',
  ]
  // Open Bids is now live as its own free tab (see OpenBidsTab) — real
  // data, manually refreshed since GOJEP's live search is CAPTCHA-gated.
  // Nothing currently in progress for Premium specifically.
  const comingSoon: string[] = []
  // JSE Index history has no real backfill source (StacksJA's index_history
  // tool is MCP-only, not a plain REST endpoint) — so unlike BOJ, it isn't a
  // one-time backfill. It builds real depth one real day at a time from the
  // existing daily automation. Shown honestly below rather than implied to
  // already have years of depth.

  // Raw history for the trend stats, the remittance indicator, and the
  // CSV export below — fetched independently of the page-level ticker
  // data so this tab works the same even if its parent changes.
  const { rows: fxHistory } = useLiveSeries('fx_usd_jmd')
  const { rows: jseHistory } = useLiveSeries('jse_index')
  const fxStats = computeTrendStats(fxHistory, 90)
  const jseStats = computeTrendStats(jseHistory, 90)
  const indicator = remittanceIndicator(fxStats)

  const [exporting, setExporting] = useState(false)
  // Builds one combined CSV covering every live market_data series plus
  // the Real Estate listings, and triggers a browser download. Runs
  // entirely client-side — no new backend needed.
  async function exportMarketDataCsv() {
    setExporting(true)
    try {
      const dataTypes = ['jse_index', 'fx_usd_jmd', 'fx_gbp_jmd', 'fx_cad_jmd', 'boj_rate', 'gas_87', 'gas_90', 'gas_diesel']
      const sections: string[] = []
      for (const dt of dataTypes) {
        const { data } = await supabase
          .from('market_data')
          .select('value, updated_at')
          .eq('data_type', dt)
          .order('updated_at', { ascending: true })
        const header = `# ${dt}\ndate,value`
        const body = (data || []).map(d => [csvEscape(d.updated_at), csvEscape(d.value)].join(',')).join('\n')
        sections.push(header + (body ? '\n' + body : ''))
      }
      const reHeader = '# real_estate\nparish,area,type,price_jmd,est_yield'
      const reBody = REAL_ESTATE.map(r => [csvEscape(r.parish), csvEscape(r.area), csvEscape(r.type), csvEscape(r.jmd), csvEscape(r.yield)].join(',')).join('\n')
      sections.push(reHeader + '\n' + reBody)

      const csv = sections.join('\n\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `naberlyja-market-data-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  // Real subscription state: who's logged in, and are they already Premium.
  const [userId, setUserId] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [isAdminAccess, setIsAdminAccess] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [subError, setSubError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        // Site admins get Premium automatically — no need to pay yourself to
        // test or use your own feature.
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', data.user.id).single()
        if (profile?.is_admin) {
          setIsPremium(true)
          setIsAdminAccess(true)
        } else {
          const { data: sub } = await supabase
            .from('premium_subscriptions')
            .select('status')
            .eq('user_id', data.user.id)
            .eq('status', 'active')
            .maybeSingle()
          setIsPremium(!!sub)
        }
      }
      setCheckingAuth(false)
    })
  }, [])

  // Called once PayPal confirms the subscription was approved. This writes
  // our own record of it to Supabase so the rest of the app can check
  // "is this user Premium" without calling PayPal every time. Note: if the
  // subscription is later cancelled or a renewal payment fails, PayPal
  // won't tell Supabase about that automatically yet — that needs a PayPal
  // webhook wired up as a follow-on step; for now this only tracks
  // successful sign-ups.
  async function recordSubscription(subscriptionId: string, plan: 'monthly' | 'annual') {
    if (!userId) return
    const periodEnd = new Date()
    if (plan === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1)
    else periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    await supabase.from('premium_subscriptions').upsert([{
      user_id: userId,
      plan,
      status: 'active',
      paypal_subscription_id: subscriptionId,
      started_at: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    }], { onConflict: 'user_id' })
    setIsPremium(true)
  }

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
        <ul className="space-y-2 mb-2">
          {liveBenefits.map((l, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-amber-500">🔒</span>{l}
            </li>
          ))}
        </ul>
        <ul className="space-y-2 mb-4">
          {comingSoon.map((l, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-gray-600">🔒</span>{l} <span className="text-[10px] uppercase text-gray-600">(coming soon)</span>
            </li>
          ))}
        </ul>

        {checkingAuth && (
          <p className="text-xs text-gray-500">Checking your account...</p>
        )}

        {!checkingAuth && !userId && (
          <Link href="/login" className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-5 py-2.5 rounded-md">
            Log in to subscribe
          </Link>
        )}

        {!checkingAuth && userId && isPremium && (
          <div className="bg-emerald-900/30 border border-emerald-600/40 rounded-md px-4 py-3">
            <p className="text-emerald-400 font-semibold text-sm">
              {isAdminAccess ? '✓ Full access (admin)' : "✓ You're a Premium subscriber"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isAdminAccess
                ? 'As the site admin, you always have full access to Premium content.'
                : 'Thank you for supporting NaberlyJA. Manage or cancel anytime from your PayPal account.'}
            </p>

            <div className="mt-4 pt-4 border-t border-emerald-600/20 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Trend Stats</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-black/30 rounded-md p-3">
                    <p className="text-xs text-gray-400 mb-1">USD / JMD</p>
                    {fxStats ? (
                      <>
                        <p className="text-sm text-white">
                          High <span className="text-emerald-400">J${fxStats.high.toFixed(2)}</span> · Low <span className="text-red-400">J${fxStats.low.toFixed(2)}</span> · Avg J${fxStats.avg.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">Based on {fxStats.count} real day{fxStats.count === 1 ? '' : 's'} of data.</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">Not enough history yet.</p>
                    )}
                  </div>
                  <div className="bg-black/30 rounded-md p-3">
                    <p className="text-xs text-gray-400 mb-1">JSE Index</p>
                    {jseStats ? (
                      <>
                        <p className="text-sm text-white">
                          High <span className="text-emerald-400">{jseStats.high.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> · Low <span className="text-red-400">{jseStats.low.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> · Avg {jseStats.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">Based on {jseStats.count} real day{jseStats.count === 1 ? '' : 's'} of data — building daily.</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">Not enough history yet.</p>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">These are historical facts, not a prediction of where rates are headed next.</p>
              </div>

              {indicator && (
                <div className={'rounded-md p-3 text-sm ' + (indicator.tone === 'good' ? 'bg-emerald-900/20 border border-emerald-600/30 text-emerald-200' : indicator.tone === 'caution' ? 'bg-amber-900/20 border border-amber-600/30 text-amber-200' : 'bg-black/30 border border-[#1f2623] text-gray-300')}>
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Remittance-Timing Indicator</p>
                  <p>{indicator.text}</p>
                  <p className="text-[11px] text-gray-500 mt-1">A general observation based on recent rate history — not financial advice.</p>
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Raw Data Export</p>
                <button
                  onClick={exportMarketDataCsv}
                  disabled={exporting}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm px-4 py-2 rounded-md"
                >
                  {exporting ? 'Preparing...' : 'Download Market Data (CSV)'}
                </button>
                <p className="text-[11px] text-gray-500 mt-1">JSE, FX (USD/GBP/CAD), BOJ rate, gas prices, and Real Estate listings.</p>
              </div>
            </div>
          </div>
        )}

        {!checkingAuth && userId && !isPremium && (
          <div>
            <div className="flex gap-2 mb-3">
              {(Object.keys(PREMIUM_PLANS) as Array<keyof typeof PREMIUM_PLANS>).map(key => (
                <button key={key} onClick={() => setBillingCycle(key)}
                  className={'flex-1 text-left px-3 py-2 rounded-md border text-xs ' +
                    (billingCycle === key ? 'bg-amber-500 text-black border-amber-500 font-semibold' : 'border-[#2a332e] text-gray-300 hover:border-amber-500')}>
                  <div className="font-semibold">{PREMIUM_PLANS[key].label}</div>
                  <div className={billingCycle === key ? 'text-black/70' : 'text-gray-500'}>{PREMIUM_PLANS[key].priceLabel}</div>
                </button>
              ))}
            </div>

            {subError && (
              <p className="text-xs text-red-400 mb-2">{subError}</p>
            )}

            {PAYPAL_CLIENT_ID && PREMIUM_PLANS[billingCycle].planId ? (
              <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, vault: true, intent: 'subscription', currency: 'USD' }}>
                <PayPalButtons
                  key={billingCycle}
                  style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'subscribe' }}
                  createSubscription={(_data: any, actions: any) => {
                    return actions.subscription.create({ plan_id: PREMIUM_PLANS[billingCycle].planId })
                  }}
                  onApprove={async (data: any) => {
                    if (data.subscriptionID) await recordSubscription(data.subscriptionID, billingCycle)
                  }}
                  onError={() => setSubError('Something went wrong. Please try again or contact support.')}
                />
              </PayPalScriptProvider>
            ) : (
              <p className="text-xs text-gray-500">Subscriptions aren't set up yet — check back soon.</p>
            )}
          </div>
        )}
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
    { key: 'openbids', label: 'Open Bids' },
    { key: 'closedbids', label: 'Closed Bids' },
    { key: 'government', label: 'Awarded Contracts' },
    { key: 'life', label: 'Jamaica Life' },
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
          {tab === 'openbids' && <OpenBidsTab />}
          {tab === 'closedbids' && <GovClosedBidsTab />}
          {tab === 'government' && <GovContractsTab />}
          {tab === 'life' && <JamaicaLifeTab rate={latestFx} rateIsLive={hasLiveFx} />}
          {tab === 'premium' && <PremiumTab fxTrend={fxTrend} isLive={fxRows.length >= 2} />}
        </main>
      </div>
    </div>
  )
}
