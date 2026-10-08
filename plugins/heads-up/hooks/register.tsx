import type { Register } from 'claude-code'

type Notice = { color: string; text: string }

const AFTER_MS: Record<string, number> = { always: 0, '30s': 30_000, '1m': 60_000, '2m': 120_000, '5m': 300_000 }
const QUESTION = 'AskUserQuestion'

const took = (ms: number): string => {
  const seconds = Math.round(ms / 1000)
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`
}

const clip = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

// what a call was about: its command, or the name of the file it touched
const subject = (tool: string, input: unknown): string => {
  const args = (input ?? {}) as Record<string, unknown>
  const path = args.file_path ?? args.notebook_path
  if (typeof args.command === 'string') return `${tool}: ${clip(args.command.replace(/\s+/g, ' ').trim(), 40)}`
  if (typeof path === 'string') return `${tool}: ${path.split(/[\\/]/).pop()}`
  return tool
}

export const register: Register = (on, options) => {
  const side = options?.side === 'left' ? 'flex-start' : 'flex-end'
  const after = AFTER_MS[typeof options?.turnAfter === 'string' ? options.turnAfter : '1m']

  let startedAt = 0
  // calls the rules left to be asked about, by id: a dialog that opens is matched to one of these
  const unsettled = new Map<string, { tool: string; input: string }>()
  // what Claude is waiting on the person for, by the call that waits (or its tool, when no call matched)
  const asking = new Map<string, string>()
  let failed = 0
  let lastFailed = ''
  let ended: Notice | null = null

  const notices = (): Notice[] => {
    const waiting = [...asking.values()]
    const more = waiting.length > 1 ? ` (+${waiting.length - 1} more)` : ''
    return [
      ...(waiting.length > 0 ? [{ color: 'yellow', text: `${waiting[waiting.length - 1]}${more}` }] : []),
      ...(failed === 1 ? [{ color: 'red', text: `Tool call failed · ${lastFailed}` }] : []),
      ...(failed > 1 ? [{ color: 'red', text: `${failed} tool calls failed · last ${lastFailed}` }] : []),
      ...(ended ? [ended] : []),
    ]
  }

  const clear = () => {
    asking.clear()
    failed = 0
    lastFailed = ''
    ended = null
  }

  on('prompt.submit', async ($, e, next) => {
    startedAt = await $.clock.now()
    // a background task reporting back starts a turn too, and is no sign the notices were read
    if (!/^\s*<task-notification>/.test(e.text)) clear()
    $.ui.invalidate('ui.render')
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

  on('classic.PermissionRequest', ($, e, next) => {
    // the question's own notice is up since its call began
    if (e.tool_name === QUESTION) return next(e)

    const input = JSON.stringify(e.tool_input)
    const open = [...unsettled].filter(([id, call]) => call.tool === e.tool_name && !asking.has(id))
    const id = (open.find(([, call]) => call.input === input) ?? open[open.length - 1])?.[0]
    asking.set(id ?? e.tool_name, `Claude needs permission · ${subject(e.tool_name, e.tool_input)}`)
    $.ui.invalidate('ui.render')
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.tool === QUESTION) {
      asking.set(e.tool_use_id, 'Claude asked you a question')
      $.ui.invalidate('ui.render')
    }

    // the permission check and its dialog happen in here: back from it, the person has answered
    const ran = await next(e)
    unsettled.delete(e.tool_use_id)
    asking.delete(e.tool_use_id)
    asking.delete(e.tool)
    if (e.tool !== QUESTION && ran.deny === undefined && ran.isError === true) {
      failed += 1
      lastFailed = subject(e.tool, e)
    }
    $.ui.invalidate('ui.render')
    return ran
  })

  on('turn.complete', async ($, e, next) => {
    // a subagent's loop ending is not the turn
    if (e.agentId !== undefined) return next(e)

    unsettled.clear()
    asking.clear()
    const ms = startedAt > 0 ? (await $.clock.now()) - startedAt : 0
    const length = startedAt > 0 ? ` after ${took(ms)}` : ''
    if (e.reason === 'error') ended = { color: 'red', text: `Turn stopped on an error${length}` }
    else if (e.reason === 'refusal') ended = { color: 'red', text: `Turn stopped on a refusal${length}` }
    // an interrupted turn was ended by the person, who needs no telling
    else if (e.reason === 'answer' && startedAt > 0 && after !== undefined && ms >= after) {
      ended = { color: 'green', text: `Turn finished${length}` }
    }
    startedAt = 0
    $.ui.invalidate('ui.render')
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = notices()
    if (e.props.hasSurvey || list.length === 0) return next(e)

    // whatever another plugin (context-bar, usage-limits) drew keeps its row beneath the box
    const below = await next(e)
    const { Box, Text, Button } = $.ui.resolve(e)
    // the border costs two rows, which a short band cannot spare
    const hasBorder = e.props.maxRows >= list.length + 3

    return (
      <Box flexDirection="column" width={e.props.bodyColumns}>
        <Box justifyContent={side}>
          <Box flexDirection="column" paddingX={1} {...(hasBorder && { borderStyle: 'round', borderColor: list[0]?.color })}>
            {list.map((notice, i) => (
              <Box columnGap={1}>
                <Text color={notice.color}>●</Text>
                <Text>{notice.text}</Text>
                {i === list.length - 1 && (
                  <Button
                    key="dismiss"
                    label="Dismiss"
                    onPress={() => {
                      clear()
                      $.ui.invalidate('ui.render')
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>
        {below.type !== 'engine' && below}
      </Box>
    )
  })
}
