import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PANE_TOOLS = ['mcp__Claude_Browser__preview_start', 'mcp__Claude_Browser__navigate']

type World = {
  tool?: (e: any) => unknown
  decision?: 'allow' | 'ask' | 'deny'
  installed?: string[]
  tools?: string[]
  pane?: (e: any) => unknown
}
// what the plugin did in the running test: every window's argv, how many are open now, every call to
// the pane, every toast
let windows: string[][] = []
let open = 0
let paneCalls: string[] = []
let toasts: string[] = []

// stands for the engine: browsers that are installed, windows that stay open until ended, tools that
// answer as told
const engine = (on: On, { tool = () => ({ result: 'ok' }), decision = 'allow', installed = [EDGE], tools = [], pane }: World = {}) => {
  windows = []
  open = 0
  paneCalls = []
  toasts = []
  // the engine asks by the path as this machine spells it
  on('fs.exists', (_$: any, e: any) => ({ value: installed.includes(e.path.replaceAll('\\', '/')) }))
  on('env.get', (_$: any, e: any) => ({ value: e.name === 'USERPROFILE' ? 'C:/Users/me' : undefined }))
  on('tool.list', () => ({ value: tools.map(name => ({ name, description: '', mcp: true })) }))
  on('mcp.call', (_$: any, e: any) => {
    paneCalls.push(`${e.tool} ${JSON.stringify(e.args)}`)
    return { value: pane ? pane(e) : { content: [{ type: 'text', text: '{"tabId":7}' }], isError: false } } as any
  })
  on('process.spawn', async function* (_$: any, e: any, next: any) {
    windows.push([...e.argv])
    open += 1
    try {
      await new Promise(resolve => next.signal.addEventListener('abort', resolve))
    } finally {
      open -= 1
    }
    return { code: 1, signal: null }
  } as any)
  on('ui.toast', (_$: any, e: any) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('tool.check', () => ({ decision }))
  on('classic.PermissionRequest', () => ({}) as any)
  on('tool.call', (_$: any, e: any) => tool(e) as any)
  on('turn.complete', (_$: any, e: any) => ({ text: e.answer }))
  on('session.end', (_$: any, e: any) => ({ sessionId: e.sessionId }))
}


const start = ($: any) => $.turn.start({ text: 'go', turnId: 't' })
const ended = (reason: string, more: object = {}) => ({ answer: 'done', reason, isAborted: reason === 'aborted', turnId: 't', ...more }) as any
// the engine's order inside a call the person is asked about: the check, the dialog, then the tool
const asked = async ($: any, e: any) => {
  await $.tool.check({ tool: e.tool, input: { command: e.command }, tool_use_id: e.tool_use_id } as any)
  await $.classic.PermissionRequest({ hook_event_name: 'PermissionRequest', tool_name: e.tool, tool_input: { command: e.command } } as any)
}

test('nothing opens until a turn starts', async ($, on) => {
  engine(on)

  await $.tool.call({ tool: 'Read', file_path: '/repo/a.ts', tool_use_id: 't1' } as any)
  expect(windows).toEqual([])
})

test('the reels open in a window of their own while the turn runs, and close when it ends', async ($, on) => {
  engine(on)

  await start($)
  expect(open).toBe(1)
  expect(windows).toEqual([
    [
      EDGE,
      '--app=https://www.instagram.com/reels/',
      '--user-data-dir=C:/Users/me/.claude/reels/profile',
      '--window-size=430,900',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-crash-restore-bubble',
    ],
  ])

  await $.tool.call({ tool: 'Read', file_path: '/repo/a.ts', tool_use_id: 't1' } as any)
  expect(open).toBe(1)

  await $.turn.complete(ended('answer'))
  expect(open).toBe(0)
  expect(windows.length).toBe(1)
})

for (const reason of ['aborted', 'error'] as const) {
  test(`a turn that ended ${reason} closes them too`, async ($, on) => {
    engine(on)

    await start($)
    expect(open).toBe(1)
    await $.turn.complete(ended(reason))
    expect(open).toBe(0)
  })
}

test('closed while a permission dialog is open, back once it is answered', async ($, on) => {
  let during = -1
  engine(on, {
    decision: 'ask',
    tool: async e => {
      await asked($, e)
      during = open
      return { result: 'ok' }
    },
  })

  await start($)
  await $.tool.call({ tool: 'Bash', command: 'rm -rf build', tool_use_id: 't1' } as any)
  expect(during).toBe(0)
  expect(open).toBe(1)
  expect(windows.length).toBe(2)
})

test('an ask that no dialog follows leaves them open', async ($, on) => {
  let during = -1
  // auto mode: the classifier settles the ask, and the person is never asked
  engine(on, {
    decision: 'ask',
    tool: async e => {
      await $.tool.check({ tool: e.tool, input: { command: e.command }, tool_use_id: e.tool_use_id } as any)
      during = open
      return { result: 'ok' }
    },
  })

  await start($)
  await $.tool.call({ tool: 'Bash', command: 'rm -rf build', tool_use_id: 't1' } as any)
  expect(during).toBe(1)
  expect(windows.length).toBe(1)
})

test('one of two dialogs answered keeps them closed', async ($, on) => {
  let release = () => {}
  const held = new Promise<void>(resolve => (release = resolve))
  engine(on, {
    decision: 'ask',
    tool: async e => {
      await asked($, e)
      if (e.tool_use_id === 't2') await held
      return { result: 'ok' }
    },
  })

  await start($)
  const second = $.tool.call({ tool: 'Bash', command: 'git push', tool_use_id: 't2' } as any)
  await $.tool.call({ tool: 'Bash', command: 'npm publish', tool_use_id: 't1' } as any)
  expect(open).toBe(0)

  release()
  await second
  expect(open).toBe(1)
})

test('closed while a question is open, back once it is answered', async ($, on) => {
  let during = -1
  engine(on, {
    tool: () => {
      during = open
      return { result: 'ok' }
    },
  })

  await start($)
  await $.tool.call({ tool: 'AskUserQuestion', questions: [], tool_use_id: 't1' } as any)
  expect(during).toBe(0)
  expect(open).toBe(1)
})

test('a dialog answered after the turn ended opens nothing', async ($, on) => {
  engine(on, {
    decision: 'ask',
    tool: async e => {
      await asked($, e)
      await $.turn.complete(ended('aborted'))
      return { deny: 'the person said no' }
    },
  })

  await start($)
  await $.tool.call({ tool: 'Bash', command: 'rm -rf build', tool_use_id: 't1' } as any)
  expect(open).toBe(0)
  expect(windows.length).toBe(1)
})

test('a subagent finishing is not the turn finishing', async ($, on) => {
  engine(on)

  await start($)
  await $.turn.complete(ended('answer', { agentId: 'a1' }))
  expect(open).toBe(1)
})

test('the session ending closes them', async ($, on) => {
  engine(on)

  await start($)
  await $.session.end({ reason: 'prompt_input_exit', sessionId: 's', resume: {} } as any)
  expect(open).toBe(0)
})

test('Chrome where there is no Edge', async ($, on) => {
  engine(on, { installed: [CHROME] })

  await start($)
  expect(windows[0]?.[0]).toBe(CHROME)
})

test('no browser: says so once, and opens nothing', async ($, on) => {
  engine(on, { installed: [] })

  await start($)
  await $.turn.complete(ended('answer'))
  await start($)
  expect(windows).toEqual([])
  expect(toasts).toEqual(['reels: no Edge or Chrome found, set the browser path in /config'])
})

test('browserPath and url: that browser, that page', { options: { browserPath: 'D:/brave.exe', url: 'https://www.youtube.com/shorts' } }, async ($, on) => {
  engine(on, { installed: [] })

  await start($)
  expect(windows[0]?.slice(0, 2)).toEqual(['D:/brave.exe', '--app=https://www.youtube.com/shorts'])
})

test('a url that is no web page falls back to the reels', { options: { url: '--remote-debugging-port=9222' } }, async ($, on) => {
  engine(on)

  await start($)
  expect(windows[0]?.[1]).toBe('--app=https://www.instagram.com/reels/')
})

test('the Claude browser pane where the session has one: a tab that goes blank, and is opened again', async ($, on) => {
  engine(on, { tools: PANE_TOOLS })

  await start($)
  await $.turn.complete(ended('answer'))
  await start($)
  expect(windows).toEqual([])
  expect(paneCalls).toEqual([
    'preview_start {"url":"https://www.instagram.com/reels/"}',
    'navigate {"url":"about:blank","tabId":7}',
    'navigate {"url":"https://www.instagram.com/reels/","tabId":7}',
  ])
})

test('a pane that refuses the page: the window instead', async ($, on) => {
  engine(on, { tools: PANE_TOOLS, pane: () => ({ content: [{ type: 'text', text: 'site blocked' }], isError: true }) })

  await start($)
  expect(open).toBe(1)
})

test('browser window: the window even where there is a pane', { options: { browser: 'window' } }, async ($, on) => {
  engine(on, { tools: PANE_TOOLS })

  await start($)
  expect(open).toBe(1)
  expect(paneCalls).toEqual([])
})
