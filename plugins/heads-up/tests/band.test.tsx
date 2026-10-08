import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const BAND = {
  plugin: 'heads-up',
  surface: 'terminal',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120 },
} as const
const NOW = Date.parse('2026-10-08T12:00:00Z')

type World = { tool?: (e: any) => unknown; decision?: 'allow' | 'ask' | 'deny'; hasBand?: boolean }

// stands for the engine: a band nothing draws in, and tools that answer as told
const engine = (on: On, { tool = () => ({ result: 'ok' }), decision = 'allow', hasBand = false }: World = {}) => {
  const clock = mock.clock(on, { now: NOW })
  if (!hasBand) on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'engine', ref: 0 }))
  on('prompt.submit', (_$: any, e: any) => ({ text: e.text, context: e.context }))
  on('tool.check', () => ({ decision }))
  on('classic.PermissionRequest', () => ({}) as any)
  on('tool.call', (_$: any, e: any) => tool(e) as any)
  on('turn.complete', (_$: any, e: any) => ({ text: e.answer }))
  return clock
}

const failing = () => ({ isError: true as const, result: 'x', text: 'exit 1' })
const text = async ($: any, match: string | RegExp) => (await $.ui.mount(BAND)).find({ type: 'Text', text: match })
const ended = (reason: string, more: object = {}) => ({ answer: 'done', reason, isAborted: reason === 'aborted', turnId: 't', ...more }) as any

test('draws nothing while nothing has happened', async ($, on) => {
  engine(on)

  expect(await text($, /●/)).toBeUndefined()
})

test('says what Claude wants permission for while its dialog is open', async ($, on) => {
  let seen: unknown
  // the engine's order inside a call: the check, the dialog, then the tool
  engine(on, {
    decision: 'ask',
    tool: async e => {
      await $.tool.check({ tool: e.tool, input: { command: e.command }, tool_use_id: e.tool_use_id } as any)
      await $.classic.PermissionRequest({ hook_event_name: 'PermissionRequest', tool_name: e.tool, tool_input: { command: e.command } } as any)
      seen = await text($, 'Claude needs permission · Bash: rm -rf build')
      return { result: 'ok' }
    },
  })

  await $.tool.call({ tool: 'Bash', command: 'rm -rf   build', tool_use_id: 't1' } as any)
  expect(seen).toBeDefined()
  expect(await text($, /permission/)).toBeUndefined()
})

test('an ask that no dialog follows stays quiet', async ($, on) => {
  let seen: unknown
  // auto mode: the classifier settles the ask, and the person is never asked
  engine(on, {
    decision: 'ask',
    tool: async e => {
      await $.tool.check({ tool: e.tool, input: { command: e.command }, tool_use_id: e.tool_use_id } as any)
      seen = await text($, /permission/)
      return { result: 'ok' }
    },
  })

  await $.tool.call({ tool: 'Bash', command: 'rm -rf build', tool_use_id: 't1' } as any)
  expect(seen).toBeUndefined()
})

test('one of two dialogs answered leaves the other up', async ($, on) => {
  let release = () => {}
  const held = new Promise<void>(resolve => (release = resolve))
  engine(on, {
    decision: 'ask',
    tool: async e => {
      await $.tool.check({ tool: e.tool, input: { command: e.command }, tool_use_id: e.tool_use_id } as any)
      await $.classic.PermissionRequest({ hook_event_name: 'PermissionRequest', tool_name: e.tool, tool_input: { command: e.command } } as any)
      if (e.tool_use_id === 't2') await held
      return { result: 'ok' }
    },
  })

  const second = $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: 't2' } as any)
  await $.tool.call({ tool: 'Bash', command: 'npm publish', tool_use_id: 't1' } as any)
  expect(await text($, 'Claude needs permission · Bash: git push')).toBeDefined()

  release()
  await second
  expect(await text($, /permission/)).toBeUndefined()
})

test('says Claude asked a question while the question is open', async ($, on) => {
  let seen: unknown
  engine(on, {
    tool: async () => {
      seen = await text($, 'Claude asked you a question')
      return { result: 'ok' }
    },
  })

  await $.tool.call({ tool: 'AskUserQuestion', questions: [], tool_use_id: 't1' } as any)
  expect(seen).toBeDefined()
  expect(await text($, /question/)).toBeUndefined()
})

test('counts failed tool calls and names the last, until dismissed', async ($, on) => {
  engine(on, { tool: e => (e.tool === 'Read' ? { result: 'ok' } : failing()) })

  await $.tool.call({ tool: 'Bash', command: 'npm test', tool_use_id: 't1' } as any)
  expect(await text($, 'Tool call failed · Bash: npm test')).toBeDefined()

  await $.tool.call({ tool: 'Read', file_path: '/repo/a.ts', tool_use_id: 't2' } as any)
  await $.tool.call({ tool: 'Edit', file_path: 'C:\\repo\\src\\b.ts', old_string: 'a', new_string: 'b', tool_use_id: 't3' } as any)
  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: '2 tool calls failed · last Edit: b.ts' })).toBeDefined()

  await ui.press({ key: 'dismiss' })
  expect(await text($, /failed/)).toBeUndefined()
})

test('a call the person denied is no failure', async ($, on) => {
  engine(on, { tool: () => ({ deny: 'the person said no' }) })

  await $.tool.call({ tool: 'Bash', command: 'npm test', tool_use_id: 't1' } as any)
  expect(await text($, /failed/)).toBeUndefined()
})

test('notes the end of a turn that ran a minute or more, until the next prompt', async ($, on) => {
  const clock = engine(on)

  await $.prompt.submit({ text: 'quick one', wait: false } as any)
  await clock.advance(59_000)
  await $.turn.complete(ended('answer'))
  expect(await text($, /Turn finished/)).toBeUndefined()

  await $.prompt.submit({ text: 'long one', wait: false } as any)
  await clock.advance(134_000)
  await $.turn.complete(ended('answer'))
  expect(await text($, 'Turn finished after 2m 14s')).toBeDefined()

  await $.prompt.submit({ text: 'next', wait: false } as any)
  expect(await text($, /Turn finished/)).toBeUndefined()
})

test('a turn that died on an error is noted however short, an interrupted one never', { options: { turnAfter: 'always' } }, async ($, on) => {
  const clock = engine(on)

  await $.prompt.submit({ text: 'go', wait: false } as any)
  await clock.advance(5_000)
  await $.turn.complete(ended('aborted'))
  expect(await text($, /Turn/)).toBeUndefined()

  await $.prompt.submit({ text: 'go', wait: false } as any)
  await clock.advance(5_000)
  await $.turn.complete(ended('error'))
  expect(await text($, 'Turn stopped on an error after 5s')).toBeDefined()
})

test('a subagent finishing is not the turn finishing', { options: { turnAfter: 'always' } }, async ($, on) => {
  engine(on)

  await $.prompt.submit({ text: 'go', wait: false } as any)
  await $.turn.complete(ended('answer', { agentId: 'a1' }))
  expect(await text($, /Turn finished/)).toBeUndefined()
})

test('a background task reporting back leaves the notices up', async ($, on) => {
  engine(on, { tool: failing })

  await $.tool.call({ tool: 'Bash', command: 'npm test', tool_use_id: 't1' } as any)
  await $.prompt.submit({ text: '<task-notification>\n<task-id>b1</task-id>\n</task-notification>', wait: false } as any)
  expect(await text($, /failed/)).toBeDefined()
})

test('turnAfter never: no finished turn is noted', { options: { turnAfter: 'never' } }, async ($, on) => {
  const clock = engine(on)

  await $.prompt.submit({ text: 'long one', wait: false } as any)
  await clock.advance(600_000)
  await $.turn.complete(ended('answer'))
  expect(await text($, /Turn finished/)).toBeUndefined()
})

test('keeps what a plugin beneath drew under the box', async ($, on) => {
  engine(on, { tool: failing, hasBand: true })
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    return <Box><Text>CONTEXT</Text></Box>
  })

  await $.tool.call({ tool: 'Bash', command: 'npm test', tool_use_id: 't1' } as any)
  expect((await (await $.ui.mount(BAND)).find({ type: 'Box' }))?.text).toMatch(/Tool call failed · Bash: npm test.*CONTEXT$/)
})

for (const [side, justify] of [['right', 'flex-end'], ['left', 'flex-start']] as const) {
  test(`side ${side}: the box sits against that edge`, { options: { side } }, async ($, on) => {
    engine(on, { tool: failing })

    await $.tool.call({ tool: 'Bash', command: 'npm test', tool_use_id: 't1' } as any)
    const boxes = await (await $.ui.mount(BAND)).findAll({ type: 'Box' })
    expect(boxes.some(box => box.props.justifyContent === justify)).toBe(true)
  })
}
