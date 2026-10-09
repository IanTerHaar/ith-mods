import { expect, test } from 'claude-code/testing'

const PANE = { plugin: 'ruin', component: 'Pane', requestId: 'ruin', props: {} } as const
const SIZE = { columns: 100, rows: 36 }

const mountTerminal = async ($: any) => {
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.resize(SIZE)
  return ui
}
const shown = async (ui: any, text: RegExp) => await ui.find({ type: 'Text', text, in: 'ruin' })

test('registers /ruin on session start and opens the pane when it runs', async ($, on) => {
  const opened: string[] = []
  const commands: string[] = []
  on('command.register', (_$: any, e: any) => {
    commands.push(e.name)
    return { value: undefined } as any
  })
  on('session.start', () => ({ cwd: '/work' }) as any)
  on('ui.open', (_$: any, e: any) => {
    opened.push(e.id)
    return { value: { isPlaced: true } } as any
  })

  await $.session.start({ cwd: '/work' } as any)
  const answer: any = await $.command.run({ command: 'ruin', args: '' } as any)

  expect(commands).toContain('ruin')
  expect(opened).toContain('ruin')
  expect(answer.text).toContain('RUIN')
})

test('the pane is the game: one Client running ruin.tsx', async $ => {
  const ui = await mountTerminal($)
  const client = await ui.find({ type: 'Client' })

  expect(client?.props.module).toBe('hooks/ruin.tsx')
  await ui.unmount()
})

test('opens on the title screen and Space starts level 1', async $ => {
  const ui = await mountTerminal($)

  expect(await shown(ui, /press SPACE to start/)).toBeDefined()
  await ui.key({ key: 'space' })
  await ui.advance(200)
  expect(await shown(ui, /press SPACE to start/)).toBeUndefined()
  expect(await shown(ui, /HP 100/)).toBeDefined()
  expect(await shown(ui, /HANGAR/)).toBeDefined()
  await ui.unmount()
})

test('a literal space character starts the game too', async $ => {
  const ui = await mountTerminal($)

  await ui.key({ key: ' ' })
  await ui.advance(200)
  expect(await shown(ui, /HP 100/)).toBeDefined()
  await ui.unmount()
})

test('firing spends ammo, switching to an unowned weapon is refused', async $ => {
  const ui = await mountTerminal($)
  await ui.key({ key: 'space' })
  await ui.advance(200)
  expect(await shown(ui, /AMMO  40/)).toBeDefined()

  await ui.key({ key: 'space' })
  await ui.advance(300)
  expect(await shown(ui, /AMMO  39/)).toBeDefined()

  await ui.key({ key: '3' })
  await ui.advance(100)
  expect(await shown(ui, /do not have that weapon/)).toBeDefined()
  expect(await shown(ui, /PISTOL/)).toBeDefined()
  await ui.unmount()
})

test('every frame stays inside the tree budget the engine enforces', async $ => {
  const ui = await mountTerminal($)
  await ui.key({ key: 'space' })
  for (let i = 0; i < 40; i++) {
    await ui.key({ key: i % 3 ? 'right' : 'up' })
    await ui.advance(120)
  }
  const tree = await ui.drawn({ in: 'ruin' })

  expect(JSON.stringify(tree).length).toBeLessThan(100_000)
  await ui.unmount()
})
