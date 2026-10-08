import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120 },
} as const

// stands for the engine: a context window 11% full
const engine = (on: On) => {
  on('session.usage', () => ({
    value: { startedAt: 0, context: { tokens: 111_200, window: 1_000_000, percent: 11 }, rateLimits: [] },
  }))
}

test('draws the bar alone when nothing is beneath', async ($, on) => {
  engine(on)
  on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'engine', ref: 0 }))

  const ui = await $.ui.mount({ plugin: 'context-bar', surface: 'terminal', ...BAND })
  expect((await ui.find({ type: 'Box' }))?.text).toMatch(/░ 111\.2k \/ 1M \(11%\)$/)
})

test('puts what a plugin beneath drew to the right of the bar', async ($, on) => {
  engine(on)
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    return <Box><Text>LIMITS</Text></Box>
  })

  const ui = await $.ui.mount({ plugin: 'context-bar', surface: 'terminal', ...BAND })
  expect((await ui.find({ type: 'Box' }))?.text).toMatch(/111\.2k \/ 1M \(11%\).*LIMITS$/)
})
