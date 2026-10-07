'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// "Do You Know Jamaica?" — who really owns well-known companies.
// Questions come from the `ownership_trivia` table in Supabase, so they can be
// updated (company sold, merged, etc.) without touching code. If the table is
// empty or missing, this component shows nothing at all.

type Row = {
  id: string
  company: string
  known_for: string | null
  verdict: 'jamaican' | 'foreign' | 'mixed'
  summary: string
  source_name: string | null
  source_url: string | null
  as_of: string
  everyday: boolean | null
}

const LABEL: Record<Row['verdict'], string> = {
  jamaican: 'Jamaican-owned',
  foreign: 'Foreign-owned',
  mixed: 'Both / partly',
}

const THEMES = {
  home: {
    card: '#EDE7D9', border: '#D8D0BC', text: '#18180F', muted: '#5A5A50',
    accent: '#C8821A', green: '#1B3A1D', btn: '#FFFFFF', btnBorder: '#D8D0BC',
    good: '#D0E8BC', goodText: '#1B3A1D', bad: '#F0CABA', badText: '#6B1E10',
    link: '#1B3A1D',
  },
  markets: {
    card: '#101512', border: '#1f2623', text: '#FFFFFF', muted: '#9CA3AF',
    accent: '#FBBF24', green: '#1B3A1D', btn: '#0a0e0d', btnBorder: '#2a332f',
    good: '#12301a', goodText: '#9be3ad', bad: '#3b1712', badText: '#f2b0a5',
    link: '#FBBF24',
  },
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function fmtDate(d: string) {
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-JM', { month: 'short', year: 'numeric' })
  } catch { return d }
}

export default function OwnershipTrivia({ variant }: { variant: 'home' | 'markets' }) {
  const t = THEMES[variant]
  const [rows, setRows] = useState<Row[]>([])
  const [order, setOrder] = useState<Row[]>([])
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<Row['verdict'] | null>(null)
  const [right, setRight] = useState(0)
  const [asked, setAsked] = useState(0)
  const [showList, setShowList] = useState(false)
  const [onlyEveryday, setOnlyEveryday] = useState(false)

  useEffect(() => {
    supabase
      .from('ownership_trivia')
      .select('id, company, known_for, verdict, summary, source_name, source_url, as_of, everyday')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) return
        const list = data as Row[]
        setRows(list)
        setOrder(shuffle(list))
      })
  }, [])

  if (order.length === 0) return null

  const q = order[idx % order.length]
  const answered = picked !== null
  const correct = picked === q.verdict

  function choose(v: Row['verdict']) {
    if (answered) return
    setPicked(v)
    setAsked(n => n + 1)
    if (v === q.verdict) setRight(n => n + 1)
  }

  function next() {
    setPicked(null)
    setIdx(i => i + 1)
  }

  const font = '-apple-system, sans-serif'
  const groups: { key: Row['verdict']; title: string }[] = [
    { key: 'jamaican', title: '🇯🇲 Jamaican-owned' },
    { key: 'foreign', title: '🌍 Foreign-owned' },
    { key: 'mixed', title: '🤝 Both / partly' },
  ]

  return (
    <div style={{ background: t.card, border: '1px solid ' + t.border, borderRadius: variant === 'home' ? 0 : 10, padding: 14, margin: variant === 'home' ? 0 : undefined, borderLeft: variant === 'home' ? 'none' : undefined, borderRight: variant === 'home' ? 'none' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
        <div>
          <p style={{ fontSize: 13, fontFamily: font, fontWeight: 700, color: t.text }}>🇯🇲 Do You Know Jamaica?</p>
          <p style={{ fontSize: 10, fontFamily: font, color: t.muted, marginTop: 2 }}>Who really owns the companies we all know?</p>
        </div>
        {asked > 0 && (
          <span style={{ fontSize: 10, fontFamily: font, color: t.accent, fontWeight: 700, whiteSpace: 'nowrap' }}>{right} of {asked} right</span>
        )}
      </div>

      <p style={{ fontSize: 16, color: t.text, marginBottom: 2 }}>{q.company}</p>
      {q.known_for && <p style={{ fontSize: 11, fontFamily: font, color: t.muted, marginBottom: 10 }}>{q.known_for}</p>}
      <p style={{ fontSize: 12, fontFamily: font, color: t.text, marginBottom: 8, fontWeight: 700 }}>Is it Jamaican-owned?</p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: answered ? 10 : 0 }}>
        {(['jamaican', 'foreign', 'mixed'] as Row['verdict'][]).map(v => {
          const isAnswer = answered && v === q.verdict
          const isWrongPick = answered && v === picked && v !== q.verdict
          return (
            <button
              key={v}
              onClick={() => choose(v)}
              disabled={answered}
              style={{
                flex: '1 1 90px',
                background: isAnswer ? t.good : isWrongPick ? t.bad : t.btn,
                color: isAnswer ? t.goodText : isWrongPick ? t.badText : t.text,
                border: '1px solid ' + (isAnswer ? t.goodText : isWrongPick ? t.badText : t.btnBorder),
                borderRadius: 8, padding: '9px 6px', fontSize: 11, fontFamily: font, fontWeight: 700,
                cursor: answered ? 'default' : 'pointer',
              }}
            >
              {LABEL[v]}
            </button>
          )
        })}
      </div>

      {answered && (
        <div>
          <p style={{ fontSize: 12, fontFamily: font, fontWeight: 700, color: correct ? t.goodText : t.badText, marginBottom: 4 }}>
            {correct ? '✓ Right!' : '✗ Not quite.'} Answer: {LABEL[q.verdict]}
          </p>
          <p style={{ fontSize: 12, fontFamily: font, color: t.text, lineHeight: 1.6, marginBottom: 6 }}>{q.summary}</p>
          <p style={{ fontSize: 10, fontFamily: font, color: t.muted, marginBottom: 10 }}>
            Checked {fmtDate(q.as_of)}
            {q.source_name ? ' · Source: ' : ''}
            {q.source_url && q.source_name
              ? <a href={q.source_url} target="_blank" rel="noopener noreferrer" style={{ color: t.link }}>{q.source_name}</a>
              : q.source_name}
          </p>
          <button onClick={next} style={{ background: t.green, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontFamily: font, fontWeight: 700, cursor: 'pointer' }}>
            Next question →
          </button>
        </div>
      )}

      <p style={{ fontSize: 9, fontFamily: font, color: t.muted, lineHeight: 1.5, marginTop: 12 }}>
        Ownership changes when companies are bought, sold or merged. Each answer is dated and sourced from public filings or news. General knowledge only — not investment advice.
      </p>

      {variant === 'markets' ? (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setShowList(v => !v)} style={{ background: 'none', border: 'none', color: t.accent, fontSize: 12, fontFamily: font, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
            {showList ? 'Hide the full list ▲' : 'See the full list (' + rows.length + ' companies) ▼'}
          </button>
          {showList && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {[{ on: false, label: 'All companies' }, { on: true, label: 'Everyday brands owned abroad' }].map(f => (
                  <button key={f.label} onClick={() => setOnlyEveryday(f.on)} style={{ background: onlyEveryday === f.on ? t.accent : 'transparent', color: onlyEveryday === f.on ? '#18180F' : t.text, border: '1px solid ' + t.accent, borderRadius: 14, padding: '6px 12px', fontSize: 11, fontFamily: font, fontWeight: 700, cursor: 'pointer' }}>
                    {f.label}
                  </button>
                ))}
              </div>
              {groups.map(g => {
                const list = rows.filter(r => r.verdict === g.key && (!onlyEveryday || (r.verdict === 'foreign' && r.everyday))).sort((a, b) => a.company.localeCompare(b.company))
                if (list.length === 0) return null
                return (
                  <div key={g.key} style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 12, fontFamily: font, fontWeight: 700, color: t.text, marginBottom: 6 }}>{g.title} ({list.length})</p>
                    {list.map(r => (
                      <div key={r.id} style={{ borderTop: '1px solid ' + t.border, padding: '8px 0' }}>
                        <p style={{ fontSize: 12, fontFamily: font, fontWeight: 700, color: t.text }}>{r.company}</p>
                        <p style={{ fontSize: 11, fontFamily: font, color: t.muted, lineHeight: 1.55 }}>{r.summary}</p>
                        <p style={{ fontSize: 9, fontFamily: font, color: t.muted, marginTop: 2 }}>
                          Checked {fmtDate(r.as_of)}
                          {r.source_name ? ' · ' : ''}
                          {r.source_url && r.source_name
                            ? <a href={r.source_url} target="_blank" rel="noopener noreferrer" style={{ color: t.link }}>{r.source_name}</a>
                            : r.source_name}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <Link href="/markets" style={{ display: 'inline-block', marginTop: 8, color: t.link, fontSize: 11, fontFamily: font, fontWeight: 700 }}>
          See the full list in Markets →
        </Link>
      )}
    </div>
  )
}
