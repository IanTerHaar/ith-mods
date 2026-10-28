import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const HINT = {
  plugin: 'model-line',
  surface: 'terminal',
  component: 'PromptHint',
  props: { isDraft: false, isWorking: false, hint: '? for shortcuts' },
} as const

// stands for the engine: a session on `model`, its hint line drawn from the props it is handed
const engine = (on: On, model: string) => {
  on('session.model', () => ({ value: model }))
  on('ui.render', { component: 'PromptHint' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>{e.props.hint}{e.props.tail ?? ''}</Text>
  })
}

test('puts the model at the end of the hint line', async ($, on) => {
  engine(on, 'Opus 5.5')

  const ui = await $.ui.mount(HINT)
  expect((await ui.find({ type: 'Text' }))?.text).toBe('? for shortcuts · Opus 5.5')
})

test('keeps a tail a plugin above added', async ($, on) => {
  engine(on, 'Sonnet 5.5')

  const ui = await $.ui.mount({ ...HINT, props: { ...HINT.props, tail: ' · focus' } })
  expect((await ui.find({ type: 'Text' }))?.text).toBe('? for shortcuts · focus · Sonnet 5.5')
})

test('leaves the line alone when there is no model', async ($, on) => {
  engine(on, '')

  const ui = await $.ui.mount(HINT)
  expect((await ui.find({ type: 'Text' }))?.text).toBe('? for shortcuts')
})
