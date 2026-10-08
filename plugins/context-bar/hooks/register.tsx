import type { Register } from 'claude-code'

const fmt = (n: number): string => {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

const WIDTH = 30

export const register: Register = on => {
  let base = 0
  let delta: number | null = null

  on('prompt.submit', async ($, e, next) => {
    const { context } = await $.session.usage()
    base = context.tokens ?? 0
    $.ui.invalidate('ui.render')
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const { context } = await $.session.usage()
    if (context.tokens !== undefined) delta = context.tokens - base
    $.ui.invalidate('ui.render')
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const r = await next(e)
    $.ui.invalidate('ui.render')
    return r
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const { context } = await $.session.usage()
    const tokens = context.tokens ?? 0
    const window = context.window
    const ratio = window > 0 ? Math.min(1, tokens / window) : 0
    const filled = Math.round(ratio * WIDTH)
    const bar = '█'.repeat(filled) + '░'.repeat(WIDTH - filled)
    const color = ratio >= 0.85 ? 'red' : ratio >= 0.6 ? 'yellow' : 'green'
    const shown = e.props.isWorking ? tokens - base : delta
    const label = e.props.isWorking ? 'this turn' : 'last turn'
    const { Box, Text } = $.ui.resolve(e)
    // what a plugin beneath drew (usage-limits) sits to the right of the bar
    const below = await next(e)

    return (
      <Box flexWrap="wrap" columnGap={3}>
        <Box flexShrink={0}>
          <Text color={color}>{bar}</Text>
          <Text dimColor> {fmt(tokens)} / {fmt(window)} ({context.percent ?? 0}%)</Text>
          {shown !== null && (
            <Text dimColor>  {shown < 0 ? '-' : '+'}{fmt(Math.abs(shown))} {label}</Text>
          )}
        </Box>
        {below.type !== 'engine' && below}
      </Box>
    )
  })
}
