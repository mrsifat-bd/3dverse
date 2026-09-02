'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, animate, useMotionValue } from 'framer-motion'
import {
  Calculator, Layers, SlidersHorizontal, TrendingUp, Database, Zap, Clock, HardDrive,
  Save, Check, RotateCcw, Loader2, Info, BarChart3,
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
  transition: { duration: 0.4, ease: 'easeOut', delay: i * 0.06 },
})

export default function CostEstimator() {
  const [config, setConfig] = useState(ESTIMATOR_DEFAULTS)
  const [savedConfig, setSavedConfig] = useState(ESTIMATOR_DEFAULTS)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [error, setError] = useState('')

  // Per-job print inputs. Print time is a single decimal-hours field now
  // (e.g. 2.5 = 2h 30m); minutes is kept at 0 so the calculation is unchanged.
  const [filamentGrams, setFilamentGrams] = useState(undefined)
  const [printHours, setPrintHours] = useState(undefined)
  const printMinutes = undefined // no separate minutes field — decimal hours cover it
  const [machineCostEnabled, setMachineCostEnabled] = useState(false)

  // Load persisted admin defaults on mount.
  useEffect(() => {
    getEstimatorDefaults()
      .then((c) => { setConfig(c); setSavedConfig(c); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  // Auto machine-cost rule: ticks itself on whenever total time exceeds the
  // free window; the next time edit overrides any manual toggle.
  useEffect(() => {
    setMachineCostEnabled(totalMinutes(printHours, printMinutes) > (Number(config.freeHours) || 0) * 60)
  }, [printHours, config.freeHours])

  const results = useMemo(
    () => computeEstimate({ filamentGrams, printHours, printMinutes, machineCostEnabled }, config),
    [filamentGrams, printHours, machineCostEnabled, config],
  )

  const tm = Math.round(totalMinutes(printHours, printMinutes))
  const hasJobInput = (Number(filamentGrams) || 0) > 0 || tm > 0
  const shownSelling = useAnimatedNumber(results.selling)
  const [priceInt, priceDec] = shownSelling.toFixed(2).split('.')

  // Cost-settings dirty tracking → unsaved-changes chip + accidental-loss guard.
  const dirty = loaded && JSON.stringify(config) !== JSON.stringify(savedConfig)
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

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
      setSavedConfig(saved)
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
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...rise(0)} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-ink">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-clay/10 text-clay">
              <Calculator className="h-5 w-5" />
            </span>
            Cost Estimator
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-stone">
            Price a single print in real time — enter the job details, tune your cost settings, and save them
            as defaults for next time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AnimatePresence>
            {dirty && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="inline-flex items-center gap-1 rounded-full bg-[#C99A4E]/15 px-2.5 py-1 text-xs font-medium text-[#8a6a2e]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#C99A4E]" /> Unsaved changes
              </motion.span>
            )}
          </AnimatePresence>
          <Button variant="ghost" size="sm" onClick={resetDefaults} title="Reset cost settings to the original defaults">
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

      {/* Row 1 — the job (big) and the price (big), equal height */}
      <div className="grid items-stretch gap-6 lg:grid-cols-12">
        <motion.div {...rise(1)} className="lg:col-span-7">
          <Card className="flex h-full flex-col border-clay/25">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink">
                <Layers className="h-4 w-4 text-clay" /> This print job
              </CardTitle>
              <span className="rounded-full bg-clay/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-clay">Required</span>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Filament used (g)" hint="Grams of material — copy it from your slicer.">
                  <Input type="number" min="0" inputMode="decimal" placeholder="e.g. 120" value={numOrEmpty(filamentGrams)} className="h-12 text-base"
                    onChange={(e) => handleNumberChange(e.target.value, setFilamentGrams)} />
                </Field>
                <Field label="Print time (hours)" hint={tm > 0 ? `= ${Math.floor(tm / 60)}h ${tm % 60}m` : 'Decimal hours — e.g. 2.5 means 2h 30m.'}>
                  <div className="relative">
                    <Input type="number" min="0" step="0.1" inputMode="decimal" placeholder="e.g. 2.5" value={numOrEmpty(printHours)} className="h-12 pr-10 text-base"
                      onChange={(e) => handleNumberChange(e.target.value, setPrintHours)} />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-stone">hr</span>
                  </div>
                </Field>
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 rounded-xl border border-line bg-cream/50 px-4 py-3.5">
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
                  <p className="text-xs text-stone">{taka(config.machineRatePerHour).replace('.00', '')}/hr after the first {config.freeHours}h — auto-adds on long prints.</p>
                </div>
                <Switch checked={machineCostEnabled} onCheckedChange={setMachineCostEnabled} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...rise(2)} className="lg:col-span-5">
          <Card className="relative flex h-full flex-col justify-center overflow-hidden border-clay/25">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-clay/[0.1] via-transparent to-transparent" />
            <div className="pointer-events-none absolute -right-8 -top-12 h-44 w-44 rounded-full bg-clay/15 blur-3xl" />
            <CardContent className="relative p-7">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-stone">Estimated selling price</p>
                <span className="rounded-full bg-clay/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-clay">per print</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-medium text-stone">৳</span>
                <span className="font-display text-6xl font-bold leading-none tracking-tight text-ink tabular-nums">
                  {Number(priceInt).toLocaleString('en-US')}
                </span>
                <span className="ml-1 text-base font-medium text-stone tabular-nums">.{priceDec}</span>
              </div>
              {hasJobInput ? (
                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  <MiniStat label="Making cost" value={taka(results.production)} />
                  <MiniStat label={`Profit · ${config.profitMargin || 0}%`} value={`+ ${taka(results.profit)}`} accent="#4F9D69" />
                </div>
              ) : (
                <p className="mt-4 text-sm text-stone">
                  Enter filament weight and print time to calculate.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 2 — price breakdown as a bar chart (full width) */}
      <motion.div {...rise(3)}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-stone">
              <BarChart3 className="h-4 w-4 text-clay" /> Price breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <BreakdownBars results={results} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Row 3 — cost settings + summary (below the fold is fine) */}
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <motion.div {...rise(4)} className="lg:col-span-7">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink">
                <SlidersHorizontal className="h-4 w-4 text-clay" /> Cost settings
              </CardTitle>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-stone">
                <Info className="h-3 w-3" /> Saved defaults — reused for every estimate.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Filament (৳/kg)" hint="Cost per kilogram.">
                  <Input type="number" min="0" value={numOrEmpty(config.filamentCostPerKg)} onChange={(e) => setCfg('filamentCostPerKg', e.target.value)} />
                </Field>
                <Field label="Power (৳/unit)" hint="Electricity per kWh.">
                  <Input type="number" min="0" value={numOrEmpty(config.electricityRate)} onChange={(e) => setCfg('electricityRate', e.target.value)} />
                </Field>
                <Field label="Printer (Watts)" hint="Printer power draw.">
                  <Input type="number" min="0" value={numOrEmpty(config.printerWattage)} onChange={(e) => setCfg('printerWattage', e.target.value)} />
                </Field>
              </div>

              <div className="grid gap-6 border-t border-line pt-5 sm:grid-cols-2">
                <SliderField label="Labour" suffix="%" color="#C0603A" value={Number(config.labourPercent) || 0} max={100}
                  onChange={(v) => setCfg('labourPercent', v)} />
                <SliderField label="Profit margin" suffix="%" color="#4F9D69" value={Number(config.profitMargin) || 0} max={500}
                  onChange={(v) => setCfg('profitMargin', v)} />
              </div>

              <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                <Field label="Machine (৳/hr)" hint="Rate charged after the free hours.">
                  <Input type="number" min="0" value={numOrEmpty(config.machineRatePerHour)} onChange={(e) => setCfg('machineRatePerHour', e.target.value)} />
                </Field>
                <Field label="Free hours" hint="Free print time before machine cost.">
                  <Input type="number" min="0" step="0.5" value={numOrEmpty(config.freeHours)} onChange={(e) => setCfg('freeHours', e.target.value)} />
                </Field>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...rise(5)} className="lg:col-span-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-stone">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <BreakdownItem label="Material" amount={results.filament} Icon={Database} subtext={`${filamentGrams || 0} g of filament`} />
              <BreakdownItem label="Electricity" amount={results.electricity} Icon={Zap} subtext={`${config.printerWattage}W · ${taka(config.electricityRate).replace('.00', '')}/unit`} />
              <BreakdownItem label="Labour" amount={results.labour} Icon={Clock} subtext={`${config.labourPercent}% of base cost`} />
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

      <AnimatePresence>
        {!loaded && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs text-stone">
            <Loader2 className="h-3 w-3 animate-spin" /> Syncing your saved defaults…
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-stone">{label}</Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-stone/90">{hint}</p>}
    </div>
  )
}

function MiniStat({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-line bg-paper/70 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums" style={accent ? { color: accent } : { color: 'rgb(var(--ink))' }}>{value}</p>
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

// Horizontal bar chart of the five price components (replaces the donut). Each
// bar's width is that component's share of the total; amounts sum to the price.
function BreakdownBars({ results }) {
  const data = SEGMENTS.map((s) => ({ ...s, value: Math.max(0, Number(results[s.key]) || 0) }))
  const total = data.reduce((a, b) => a + b.value, 0)
  const spring = { type: 'spring', stiffness: 240, damping: 30 }
  return (
    <div className="space-y-4">
      {data.map((d) => {
        const pct = total > 0 ? (d.value / total) * 100 : 0
        return (
          <div key={d.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
                <span className="truncate text-ink">{d.label}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="w-10 text-right tabular-nums text-stone">{pct.toFixed(0)}%</span>
                <span className="w-24 text-right font-semibold tabular-nums text-ink">{taka(d.value)}</span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
              <motion.div className="h-full rounded-full" style={{ background: d.color }}
                animate={{ width: `${pct}%` }} transition={spring} />
            </div>
          </div>
        )
      })}
      <div className="flex items-center justify-between border-t border-line pt-3.5">
        <span className="text-sm font-semibold text-ink">Total selling price</span>
        <span className="font-display text-lg font-bold text-ink tabular-nums">{taka(total)}</span>
      </div>
    </div>
  )
}
