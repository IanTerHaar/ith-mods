import type { EngineInterface, McpToolResult, Register } from 'claude-code'

const REELS = 'https://www.instagram.com/reels/'
const QUESTION = 'AskUserQuestion'
// the browser pane of the Claude desktop app: its MCP server, and the tools of it a session with the pane lists
const PANE = 'Claude Browser'
const PANE_TOOLS = ['mcp__Claude_Browser__preview_start', 'mcp__Claude_Browser__navigate']
// Edge first: every Windows has it
const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
]
// a phone's shape, which is a reel's
const WINDOW_SIZE = '430,900'

type Close = () => Promise<void>

type Reels = {
  url: string
  hasPane: boolean
  browserPath: string
  isTurnRunning: boolean
  // the calls Claude is waiting on the person for (or their tool, when no call matched)
  waiting: Set<string>
  // closes the reels that are open; null while none are
  close: Close | null
  // the pane's tab the reels were last in, opened again in place of a new one
  tab: unknown
  settled: Promise<void>
  hasWarned: boolean
}

// the tab a pane call answered about, as the server spelled it
const tabOf = (result: McpToolResult): unknown => {
  const structured = (result.structuredContent ?? {}) as Record<string, unknown>
  if (structured.tabId !== undefined) return structured.tabId
  const id = result.content.map(block => block.text ?? '').join('\n').match(/"?tabId"?\s*[:=]\s*"?([\w-]+)/)?.[1]
  if (id === undefined) return undefined
  return /^\d+$/.test(id) ? Number(id) : id
}

const warn = ($: EngineInterface, reels: Reels, text: string) => {
  if (!reels.hasWarned) $.ui.toast(`reels: ${text}`)
  reels.hasWarned = true
}

const openPane = async ($: EngineInterface, reels: Reels): Promise<Close | null> => {
  try {
    const tools = new Set((await $.tool.list()).map(tool => tool.name))
    if (!PANE_TOOLS.every(name => tools.has(name))) return null

    let opened = reels.tab === undefined ? undefined : await $.mcp.call(PANE, 'navigate', { url: reels.url, tabId: reels.tab })
    // no tab yet, or the person closed it
    if (opened === undefined || opened.isError) {
      opened = await $.mcp.call(PANE, 'preview_start', { url: reels.url })
      if (opened.isError) return null
      reels.tab = tabOf(opened)
    }
    // the tab stays, blank: nothing plays in it, and the next reels open in it
    return async () => {
      await $.mcp.call(PANE, 'navigate', { url: 'about:blank', ...(reels.tab !== undefined && { tabId: reels.tab }) })
    }
  } catch {
    return null
  }
}

const openWindow = async ($: EngineInterface, reels: Reels): Promise<Close | null> => {
  let exe = reels.browserPath
  for (const path of exe === '' ? BROWSERS : []) {
    if (await $.fs.exists(path)) {
      exe = path
      break
    }
  }
  const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME'))
  if (exe === '' || home === undefined) {
    warn($, reels, 'no Edge or Chrome found, set the browser path in /config')
    return null
  }

  // a profile of its own makes the window a process of its own, one that can be ended without the
  // person's browser; the Instagram sign-in is kept in it
  const child = $.process.spawn({
    argv: [
      exe,
      `--app=${reels.url}`,
      `--user-data-dir=${home}/.claude/reels/profile`,
      `--window-size=${WINDOW_SIZE}`,
      '--no-first-run',
      '--no-default-browser-check',
      // ending the process is no crash worth offering to restore
      '--hide-crash-restore-bubble',
    ],
  })
  // the browser starts at the first pull and lives as long as the loop, which return() ends
  void (async () => {
    try {
      for await (const _ of child);
    } catch {
      warn($, reels, `could not start ${exe}`)
    }
  })()
  return async () => {
    await child.return({ code: null, signal: null })
  }
}

// open while a turn runs and nothing waits on the person, closed otherwise; one change at a time, so an
// opening still under way is never left behind by the closing that follows it
const sync = ($: EngineInterface, reels: Reels) => {
  reels.settled = reels.settled
    .then(async () => {
      const isWanted = reels.isTurnRunning && reels.waiting.size === 0
      if (isWanted === (reels.close !== null)) return
      if (reels.close) {
        const close = reels.close
        reels.close = null
        await close()
      } else {
        reels.close = (reels.hasPane ? await openPane($, reels) : null) ?? (await openWindow($, reels))
      }
    })
    .catch(error => $.ui.log(`reels: ${error}`, { to: 'debug' }))
  return reels.settled
}

export const register: Register = (on, options) => {
  const reels: Reels = {
    url: typeof options?.url === 'string' && /^https?:\/\//.test(options.url) ? options.url : REELS,
    hasPane: options?.browser !== 'window',
    browserPath: typeof options?.browserPath === 'string' ? options.browserPath.trim() : '',
    isTurnRunning: false,
    waiting: new Set(),
    close: null,
    tab: undefined,
    settled: Promise.resolve(),
    hasWarned: false,
  }
  // calls the rules left to be asked about, by id: a dialog that opens is matched to one of these
  const unsettled = new Map<string, { tool: string; input: string }>()

  on('turn.start', async ($, e, next) => {
    reels.isTurnRunning = true
    await sync($, reels)
    return next(e)
  })

  // an ask is not yet a dialog: auto mode's classifier may settle it without the person
  on('tool.check', async ($, e, next) => {
    const answer = await next(e)
    if (answer.decision === 'ask' && e.tool_use_id !== undefined) {
      unsettled.set(e.tool_use_id, { tool: e.tool, input: JSON.stringify(e.input) })
    }
    return answer
  })

  on('classic.PermissionRequest', async ($, e, next) => {
    // the question closed the reels when its call began
    if (e.tool_name === QUESTION) return next(e)

    const input = JSON.stringify(e.tool_input)
    const open = [...unsettled].filter(([id, call]) => call.tool === e.tool_name && !reels.waiting.has(id))
    reels.waiting.add((open.find(([, call]) => call.input === input) ?? open[open.length - 1])?.[0] ?? e.tool_name)
    await sync($, reels)
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.tool === QUESTION) {
      reels.waiting.add(e.tool_use_id)
      await sync($, reels)
    }

    // the permission check and its dialog happen in here: back from it, the person has answered
    const ran = await next(e)
    unsettled.delete(e.tool_use_id)
    reels.waiting.delete(e.tool_use_id)
    reels.waiting.delete(e.tool)
    await sync($, reels)
    return ran
  })

  on('turn.complete', async ($, e, next) => {
    // a subagent's loop ending is not the turn
    if (e.agentId !== undefined) return next(e)

    reels.isTurnRunning = false
    unsettled.clear()
    reels.waiting.clear()
    await sync($, reels)
    return next(e)
  })

  on('session.end', async ($, e, next) => {
    reels.isTurnRunning = false
    await sync($, reels)
    return next(e)
  })
}
