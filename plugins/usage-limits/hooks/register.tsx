import type { Register, SessionRateLimit } from 'claude-code'

const WIDTH = 10
const WINDOWS = [
  { kind: 'five_hour', label: '5h' },
  { kind: 'seven_day', label: 'wk' },
]

const until = (ms: number): string => {
  const minutes = Math.max(0, Math.round(ms / 60_000))
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  return `${minutes}m`
}

export const register: Register = on => {
  on('session.start', ($, e, next) => {
    // keeps the reset countdowns moving while the session sits idle
    $.clock.every(60_000, () => $.ui.invalidate('ui.render'))
    return next(e)
  })

  on('session.measure', ($, e, next) => {
    if (e.changed.includes('rateLimits')) $.ui.invalidate('ui.render')
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    // whatever another plugin (context-bar) drew goes on the left; core's own
    // node means nothing did, and the limits start at the left edge
    const below = await next(e)
    const { rateLimits } = await $.session.usage()
    const limits = WINDOWS.map(w => ({ ...w, limit: rateLimits.find(r => r.kind === w.kind) }))
      .filter((w): w is typeof w & { limit: SessionRateLimit } => w.limit !== undefined)
    if (limits.length === 0) return below

    const now = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexWrap="wrap" columnGap={3}>
        {below.type !== 'engine' && below}
        {limits.map(({ label, limit }) => {
          const left = Math.max(0, Math.min(100, 100 - limit.percentUsed))
          const filled = Math.round((left / 100) * WIDTH)
          const color = left <= 15 ? 'red' : left <= 40 ? 'yellow' : 'green'
          const resets = limit.resetsAt ? Date.parse(limit.resetsAt) - now : NaN

          return (
            <Box flexShrink={0}>
              <Text dimColor>{label} </Text>
              <Text color={color}>{'█'.repeat(filled) + '░'.repeat(WIDTH - filled)}</Text>
              <Text dimColor> {Math.round(left)}% left</Text>
              {resets > 0 && <Text dimColor> · resets {until(resets)}</Text>}
            </Box>
          )
        })}
      </Box>
    )
  })
}
