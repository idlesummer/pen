import { Box, Text } from 'ink'
import React, { type ReactNode } from 'react'

// ─── Config Component Props ─────────────────────────────────────

interface XAxisProps {
  dataKey?: string
}

interface YAxisProps {
  domain?: [number, number]
}

interface CartesianGridProps {
  horizontal?: boolean
}

interface BarProps {
  dataKey: string
  fill?: string
  name?: string
  unit?: string
}

// ─── Config Components (render nothing, BarChart reads their props) ──

export function XAxis(_: XAxisProps) {
  return null
}
XAxis.displayName = 'XAxis'

export function YAxis(_?: YAxisProps) {
  return null
}
YAxis.displayName = 'YAxis'

export function CartesianGrid(_?: CartesianGridProps) {
  return null
}
CartesianGrid.displayName = 'CartesianGrid'

export function Bar(_: BarProps) {
  return null
}
Bar.displayName = 'Bar'

// ─── Internal Types ─────────────────────────────────────────────

interface BarConfig {
  dataKey: string
  fill: string
  name?: string
  unit?: string
}

interface ChartConfig {
  xDataKey: string
  yDomain?: [number, number]
  showYAxis: boolean
  showGrid: boolean
  bars: BarConfig[]
}

// ─── Constants ──────────────────────────────────────────────────

const BAR_W = 8
const GROUP_GAP = 3
const INNER_GAP = 1
const BLOCK = '█'
const BLOCK_CAP = '▀'
const GRID_CHAR = '·'

// ─── BarChart ───────────────────────────────────────────────────

interface BarChartProps {
  data: Record<string, unknown>[]
  children?: ReactNode
  height?: number
}

export function BarChart({ data, children, height = 10 }: BarChartProps) {
  const cfg = parseConfig(children)
  if (cfg.bars.length === 0 || data.length === 0) return null

  // ── Extract data per group ──
  const groups = data.map((d) => ({
    label: String(d[cfg.xDataKey] ?? ''),
    fill: typeof d.fill === 'string' ? d.fill : undefined,
    values: cfg.bars.map((b) => Number(d[b.dataKey]) || 0),
  }))

  // ── Y-axis scaling ──
  const rawMax = Math.max(...groups.flatMap((g) => g.values), 1)
  const yMax = cfg.yDomain ? cfg.yDomain[1] : ceilNice(rawMax)
  const yMin = cfg.yDomain ? cfg.yDomain[0] : 0
  const yRange = yMax - yMin || 1
  const yLabelW = cfg.showYAxis
    ? Math.max(String(yMax).length, String(yMin).length)
    : 0

  // ── Compute fill heights ──
  const fills = groups.map((g) =>
    g.values.map((v) => {
      const clamped = Math.max(v - yMin, 0)
      return Math.min(Math.round((clamped / yRange) * height), height)
    }),
  )

  // ── Layout math ──
  const barsPerGroup = cfg.bars.length
  const groupW =
    barsPerGroup * BAR_W + Math.max(0, barsPerGroup - 1) * INNER_GAP
  const totalW =
    data.length * groupW + Math.max(0, data.length - 1) * GROUP_GAP

  // ── Y-axis reference rows ──
  const yRefRows = [height, Math.ceil(height / 2), 1]

  return (
    <Box flexDirection="column">
      {/* Chart body */}
      {Array.from({ length: height }, (_, i) => {
        const row = height - i
        const isRef = yRefRows.includes(row)
        const yVal = isRef
          ? row === height
            ? yMax
            : row === 1
              ? yMin
              : Math.round((yMax + yMin) / 2)
          : null

        return (
          <Text key={row}>
            {/* Y-axis gutter */}
            {cfg.showYAxis && (
              <Text dimColor>
                {yVal !== null
                  ? `${String(yVal).padStart(yLabelW)} ┤ `
                  : `${' '.repeat(yLabelW)} │ `}
              </Text>
            )}

            {/* Bar groups */}
            {groups.map((group, gi) => {
              const gapStr =
                gi > 0
                  ? (cfg.showGrid && isRef ? GRID_CHAR : ' ').repeat(GROUP_GAP)
                  : ''
              return (
                <Text key={gi}>
                  {gapStr}
                  {group.values.map((_, bi) => {
                    const filled = row <= fills[gi][bi]
                    const isTop =
                      row === fills[gi][bi] && fills[gi][bi] > 0
                    const color = group.fill ?? cfg.bars[bi].fill
                    const innerGap =
                      bi > 0
                        ? (
                            cfg.showGrid && isRef && !filled
                              ? GRID_CHAR
                              : ' '
                          ).repeat(INNER_GAP)
                        : ''
                    return (
                      <Text key={bi}>
                        {innerGap}
                        <Text
                          color={filled ? color : undefined}
                          dimColor={!filled && cfg.showGrid && isRef}
                        >
                          {filled
                            ? (isTop ? BLOCK_CAP : BLOCK).repeat(BAR_W)
                            : cfg.showGrid && isRef
                              ? GRID_CHAR.repeat(BAR_W)
                              : ' '.repeat(BAR_W)}
                        </Text>
                      </Text>
                    )
                  })}
                </Text>
              )
            })}
          </Text>
        )
      })}

      {/* X-axis line */}
      <Text dimColor>
        {cfg.showYAxis ? `${' '.repeat(yLabelW)} └─` : ''}
        {'─'.repeat(totalW)}
      </Text>

      {/* X-axis labels (centered under each group) */}
      <Text>
        {cfg.showYAxis && <Text>{' '.repeat(yLabelW + 3)}</Text>}
        {groups.map((g, gi) => {
          const cellW = groupW + (gi < groups.length - 1 ? GROUP_GAP : 0)
          const label = g.label.slice(0, cellW)
          const padL = Math.floor((cellW - label.length) / 2)
          const padR = cellW - label.length - padL
          return (
            <Text key={gi} dimColor>
              {' '.repeat(padL)}
              {label}
              {' '.repeat(padR)}
            </Text>
          )
        })}
      </Text>

      {/* Legend */}
      <Box marginTop={1} gap={2} flexWrap="wrap">
        {cfg.bars.length === 1
          ? groups.map((g, gi) => {
              const unit = cfg.bars[0].unit ?? ''
              return (
                <Text key={gi}>
                  <Text color={g.fill ?? cfg.bars[0].fill}>{'● '}</Text>
                  <Text>{g.label} </Text>
                  <Text dimColor>
                    ({g.values[0]}
                    {unit})
                  </Text>
                </Text>
              )
            })
          : cfg.bars.map((b, bi) => (
              <Text key={bi}>
                <Text color={b.fill}>{'● '}</Text>
                <Text>{b.name ?? b.dataKey}</Text>
              </Text>
            ))}
      </Box>
    </Box>
  )
}

// ─── Helpers ────────────────────────────────────────────────────

function parseConfig(children: ReactNode): ChartConfig {
  const cfg: ChartConfig = {
    xDataKey: 'name',
    showYAxis: false,
    showGrid: false,
    bars: [],
  }

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const type = child.type as { displayName?: string }

    switch (type.displayName) {
      case 'XAxis':
        cfg.xDataKey = (child.props as XAxisProps).dataKey ?? 'name'
        break
      case 'YAxis':
        cfg.showYAxis = true
        cfg.yDomain = (child.props as YAxisProps).domain
        break
      case 'CartesianGrid':
        cfg.showGrid = true
        break
      case 'Bar': {
        const p = child.props as BarProps
        cfg.bars.push({
          dataKey: p.dataKey,
          fill: p.fill ?? 'white',
          name: p.name,
          unit: p.unit,
        })
        break
      }
    }
  })

  return cfg
}

/** Round up to a "nice" chart-friendly number */
function ceilNice(n: number): number {
  if (n <= 0) return 10
  const mag = Math.pow(10, Math.floor(Math.log10(n)))
  const norm = n / mag
  if (norm <= 1) return mag
  if (norm <= 2) return 2 * mag
  if (norm <= 5) return 5 * mag
  return 10 * mag
}
