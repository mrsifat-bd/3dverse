'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, animate, useMotionValue } from 'framer-motion'
import {
  Calculator, Layers, TrendingUp, Database, Zap, Clock, HardDrive, Save, Check, RotateCcw, Loader2,
} from 'lucide-react'
import {
  ESTIMATOR_DEFAULTS, computeEstimate, totalMinutes, getEstimatorDefaults, saveEstimatorDefaults,
} from '@/lib/estimator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const taka = (n) => `৳${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// Breakdown colours chosen to sit on the warm paper theme. These five parts
// sum exactly to the selling price.
const SEGMENTS = [
  { key: 'filament', label: 'Material', color: '#C0603A', Icon: Database },
  { key: 'electricity', label: 'Electricity', color: '#E0A33E', Icon: Zap },
  { key: 'labour', label: 'Labour', color: '#9A8F7A', Icon: Clock },
  { key: 'profit', label: 'Profit', color: '#4F9D69', Icon: TrendingUp },
  { key: 'machine', label: 'Machine', color: '#8C6E9E', Icon: HardDrive },
]

function numOrEmpty(v) {
  return v === undefined || v === null || Number.isNaN(v) ? '' : v
}

// Smoothly eases a number toward its target so figures count up/down.
function useAnimatedNumber(value) {
  const mv = useMotionValue(value)
  const [display, setDisplay] = useState(value)
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.5, ease: 'easeOut', onUpdate: setDisplay })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return display
}

const rise = (i = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut', delay: i * 0.07 },
})

export default function CostEstimator() {
  const [config, setConfig] = useState(ESTIMATOR_DEFAULTS)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [error, setError] = useState('')

  // Per-job print inputs — empty by default (render blank, not 0).
  const [filamentGrams, setFilamentGrams] = useState(undefined)
  const [printHours, setPrintHours] = useState(undefined)
  const [printMinutes, setPrintMinutes] = useState(undefined)
  const [machineCostEnabled, setMachineCostEnabled] = useState(false)

  // Load persisted admin defaults on mount.
  useEffect(() => {
    getEstimatorDefaults().then((c) => { setConfig(c); setLoaded(true) }).catch(() => setLoaded(true))
  }, [])

  // Auto machine-cost rule: ticks itself on whenever total time exceeds the
  // free window; the next time edit overrides any manual toggle.
  useEffect(() => {
    setMachineCostEnabled(totalMinutes(printHours, printMinutes) > (Number(config.freeHours) || 0) * 60)
  }, [printHours, printMinutes, config.freeHours])

  const results = useMemo(
    () => computeEstimate({ filamentGrams, printHours, printMinutes, machineCostEnabled }, config),
    [filamentGrams, printHours, printMinutes, machineCostEnabled, config],
  )

  const tm = totalMinutes(printHours, printMinutes)
  const shownSelling = useAnimatedNumber(results.selling)
  const [priceInt, priceDec] = shownSelling.toFixed(2).split('.')

  const handleNumberChange = (value, setter) => {
    if (value === '') { setter(undefined); return }
    const num = parseFloat(value)
    if (!Number.isNaN(num)) setter(num)
  }
  const setCfg = (k, v) => { setJustSaved(false); setConfig((c) => ({ ...c, [k]: v === '' ? '' : Number(v) })) }

  async function saveDefaults() {
    setSaving(true); setError('')
    try {
      const saved = await saveEstimatorDefaults(config)
      setConfig(saved)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2500)
    } catch (e) {
      setError(e.message || 'Could not save. Make sure you are logged in as an admin.')
    } finally {
      setSaving(false)
    }
  }
  function resetDefaults() { setConfig({ ...ESTIMATOR_DEFAULTS }); setJustSaved(false) }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div {...rise(0)} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-ink">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-clay/10 text-clay">
              <Calculator className="h-5 w-5" />
            </span>
            Cost Estimator
          </h1>
          <p className="mt-1.5 text-sm text-stone">Live pricing for a print job. Edit the defaults below and save them for next time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetDefaults} title="Reset to original defaults">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
          <Button size="sm" onClick={saveDefaults} disabled={saving} className="min-w-[9.5rem] justify-center">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : justSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : justSaved ? 'Saved' : 'Save as defaults'}
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="grid items-start gap-6 xl:grid-cols-12">
        {/* Left: inputs */}
        <div className="grid gap-6 md:grid-cols-2 xl:col-span-8">
          {/* Print parameters */}
          <motion.div {...rise(1)} className="h-full">
            <Card className="flex h-full flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink">
                  <Layers className="h-4 w-4 text-clay" /> Print parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5">
                <Field label="Filament (g)">
                  <Input type="number" min="0" inputMode="decimal" placeholder="0" value={numOrEmpty(filamentGrams)}
                    onChange={(e) => handleNumberChange(e.target.value, setFilamentGrams)} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Duration (h)">
                    <Input type="number" min="0" placeholder="0" value={numOrEmpty(printHours)}
                      onChange={(e) => handleNumberChange(e.target.value, setPrintHours)} />
                  </Field>
                  <Field label="Minutes">
                    <Input type="number" min="0" max="59" placeholder="0" value={numOrEmpty(printMinutes)}
                      onChange={(e) => handleNumberChange(e.target.value, setPrintMinutes)} />
                  </Field>
                </div>
                <AnimatePresence>
                  {tm > 0 && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="-mt-1 text-[11px] font-medium uppercase tracking-wider text-stone">
                      Total print time · {Math.floor(tm / 60)}h {tm % 60}m
                    </motion.p>
                  )}
                </AnimatePresence>
                <div className="mt-auto flex items-center justify-between gap-3 rounded-xl border border-line bg-cream/50 px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink">Machine cost</p>
                      <AnimatePresence>
                        {machineCostEnabled && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                            className="rounded-full bg-[#8C6E9E]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8C6E9E]">
                            On
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <p className="text-xs text-stone">{taka(config.machineRatePerHour).replace('.00', '')}/hr after the first {config.freeHours}h</p>
                  </div>
                  <Switch checked={machineCostEnabled} onCheckedChange={setMachineCostEnabled} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Economics (editable defaults) */}
          <motion.div {...rise(2)} className="h-full">
            <Card className="flex h-full flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink">
                  <TrendingUp className="h-4 w-4 text-clay" /> Economics
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5">
                <Field label="Filament (৳/kg)">
                  <Input type="number" min="0" value={numOrEmpty(config.filamentCostPerKg)} onChange={(e) => setCfg('filamentCostPerKg', e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
                  <Field label="Power (৳/unit)">
                    <Input type="number" min="0" value={numOrEmpty(config.electricityRate)} onChange={(e) => setCfg('electricityRate', e.target.value)} />
                  </Field>
                  <Field label="Printer (Watts)">
                    <Input type="number" min="0" value={numOrEmpty(config.printerWattage)} onChange={(e) => setCfg('printerWattage', e.target.value)} />
                  </Field>
                </div>

                <SliderField label="Labour" suffix="%" color="#C0603A" value={Number(config.labourPercent) || 0} max={100}
                  onChange={(v) => setCfg('labourPercent', v)} />
                <SliderField label="Profit margin" suffix="%" color="#4F9D69" value={Number(config.profitMargin) || 0} max={500}
                  onChange={(v) => setCfg('profitMargin', v)} />

                <div className="mt-auto grid grid-cols-2 gap-4 border-t border-line pt-4">
                  <Field label="Machine (৳/hr)">
                    <Input type="number" min="0" value={numOrEmpty(config.machineRatePerHour)} onChange={(e) => setCfg('machineRatePerHour', e.target.value)} />
                  </Field>
                  <Field label="Free hours">
                    <Input type="number" min="0" step="0.5" value={numOrEmpty(config.freeHours)} onChange={(e) => setCfg('freeHours', e.target.value)} />
                  </Field>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right: results (sticky on large screens) */}
        <motion.div {...rise(3)} className="space-y-6 xl:sticky xl:top-6 xl:col-span-4 xl:self-start">
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 -translate-y-10 translate-x-10 rounded-full bg-clay/15 blur-3xl" />
            <CardContent className="relative p-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-stone">Calculated price</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xl font-medium text-stone">৳</span>
                <span className="font-display text-5xl font-bold tracking-tight text-ink tabular-nums">
                  {Number(priceInt).toLocaleString('en-US')}
                </span>
                <span className="ml-0.5 text-sm font-medium text-stone tabular-nums">.{priceDec}</span>
              </div>
              <p className="mt-3 text-xs text-stone">
                Making cost {taka(results.production)} + profit {taka(results.profit)}
                {results.machine > 0 ? ` + machine ${taka(results.machine)}` : ''}
              </p>
            </CardContent>
          </Card>

          {/* Breakdown donut */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-stone">Price breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Donut results={results} />
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-stone">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <BreakdownItem label="Material" amount={results.filament} Icon={Database} subtext={`${filamentGrams || 0} g`} />
              <BreakdownItem label="Electricity" amount={results.electricity} Icon={Zap} subtext={`Unit cost ৳${config.electricityRate}`} />
              <BreakdownItem label="Labour" amount={results.labour} Icon={Clock} subtext={`${config.labourPercent}% of base`} />
              <AnimatePresence>
                {machineCostEnabled && results.machine > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <BreakdownItem label="Machine cost" amount={results.machine} Icon={HardDrive} subtext="added to selling price" />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="space-y-3 border-t border-line pt-4">
                <Row label="Making cost" value={taka(results.production)} />
                <Row label={`Net profit (${config.profitMargin}%)`} value={`+ ${taka(results.profit)}`} accent="#4F9D69" />
                {machineCostEnabled && results.machine > 0 && (
                  <Row label="Machine cost" value={`+ ${taka(results.machine)}`} accent="#8C6E9E" />
                )}
                <div className="flex items-center justify-between border-t border-line pt-3">
                  <span className="text-sm font-semibold text-ink">Selling price</span>
                  <span className="font-display text-lg font-bold text-ink tabular-nums">{taka(results.selling)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {!loaded && <p className="text-xs text-stone">Loading saved defaults…</p>}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-stone">{label}</Label>
      {children}
    </div>
  )
}

function SliderField({ label, suffix, color, value, max, onChange }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const spring = { type: 'spring', stiffness: 320, damping: 32 }
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-stone">{label}</Label>
        <div className="flex items-center gap-1">
          <Input type="number" min="0" max={max} value={value}
            onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
            className="h-7 w-16 px-2 py-0 text-center text-xs font-semibold" style={{ color }} />
          <span className="text-xs font-bold" style={{ color }}>{suffix}</span>
        </div>
      </div>
      <div className="relative flex h-5 items-center">
        <div className="absolute inset-x-0 h-2 rounded-full bg-line" />
        <motion.div className="absolute left-0 h-2 rounded-full" style={{ background: color }}
          animate={{ width: `${pct}%` }} transition={spring} />
        <motion.div className="absolute h-4 w-4 rounded-full border-2 border-paper shadow-sm"
          style={{ background: color, x: '-50%' }} animate={{ left: `${pct}%` }} transition={spring} />
        <input type="range" min="0" max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label} className="absolute inset-0 w-full cursor-pointer opacity-0" />
      </div>
    </div>
  )
}

function BreakdownItem({ label, amount, Icon, subtext }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-cream/60">
        <Icon className="h-4 w-4 text-clay" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">{label}</span>
          <span className="text-sm font-semibold text-ink tabular-nums">{taka(amount)}</span>
        </div>
        <p className="text-[11px] uppercase tracking-wider text-stone">{subtext}</p>
      </div>
    </div>
  )
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium" style={accent ? { color: accent } : undefined}>{label}</span>
      <span className="text-sm font-semibold tabular-nums" style={accent ? { color: accent } : { color: 'rgb(var(--ink))' }}>{value}</span>
    </div>
  )
}

// Dependency-free SVG donut of the five price components. All five arcs are
// always rendered (zero-value ones collapse to nothing) so the CSS transitions
// stay smooth as figures change. The centre shows the running total.
function Donut({ results }) {
  const data = SEGMENTS.map((s) => ({ ...s, value: Math.max(0, Number(results[s.key]) || 0) }))
  const total = data.reduce((a, b) => a + b.value, 0)
  const r = 52
  const C = 2 * Math.PI * r
  let offset = 0
  const arcs = data.map((d) => {
    const frac = total > 0 ? d.value / total : 0
    const seg = { ...d, dash: frac * C, gap: C - frac * C, off: -offset * C }
    offset += frac
    return seg
  })

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgb(var(--line))" strokeWidth="14" />
          {arcs.map((a) => (
            <circle key={a.key} cx="70" cy="70" r={r} fill="none" stroke={a.color} strokeWidth="14"
              strokeDasharray={`${a.dash} ${a.gap}`} strokeDashoffset={a.off} strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray .6s cubic-bezier(.4,0,.2,1), stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)' }} />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone">Total</span>
          <span className="font-display text-[15px] font-bold text-ink tabular-nums">৳{Math.round(total).toLocaleString('en-US')}</span>
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {data.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0
          return (
            <li key={d.key} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
              <span className="flex-1 text-ink">{d.label}</span>
              <span className="tabular-nums text-stone">{pct.toFixed(0)}%</span>
              <span className="w-20 text-right font-medium tabular-nums text-ink">{taka(d.value)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
