import { expect, mock, test } from 'claude-code/testing'
import type { On, SessionRateLimit } from 'claude-code'

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120 },
} as const
const NOW = Date.parse('2026-10-08T12:00:00Z')

// stands for the engine: the account's windows, and a band nothing draws in
const engine = (on: On, rateLimits: SessionRateLimit[]) => {
  mock.clock(on, { now: NOW })
  on('session.usage', () => ({ value: { startedAt: NOW, context: { window: 1_000_000 }, rateLimits } }))
}

test('shows what is left of both windows, at the left edge', async ($, on) => {
  engine(on, [
    { kind: 'five_hour', percentUsed: 38, resetsAt: '2026-10-08T14:14:00Z' },
    { kind: 'seven_day', percentUsed: 91.5, resetsAt: '2026-10-11T15:00:00Z' },
  ])
  on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'engine', ref: 0 }))

  const ui = await $.ui.mount({ plugin: 'usage-limits', surface: 'terminal', ...BAND })
  expect(await ui.find({ type: 'Text', text: /62% left/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /resets 2h 14m/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /9% left/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /resets 3d 3h/ })).toBeDefined()
})

test('sits to the right of what a plugin beneath drew', async ($, on) => {
  engine(on, [{ kind: 'five_hour', percentUsed: 10 }])
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    return <Box><Text>CONTEXT</Text></Box>
  })

  const ui = await $.ui.mount({ plugin: 'usage-limits', surface: 'terminal', ...BAND })
  expect((await ui.find({ type: 'Box' }))?.text).toMatch(/CONTEXT.*5h .*90% left/)
})

test('draws nothing without a reading', async ($, on) => {
  engine(on, [])
  on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'engine', ref: 0 }))

  const ui = await $.ui.mount({ plugin: 'usage-limits', surface: 'terminal', ...BAND })
  expect(await ui.find({ type: 'Text', text: /left/ })).toBeUndefined()
})
