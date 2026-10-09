import type { Register } from 'claude-code'

const PANE = 'ruin'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'ruin',
      description: 'Play RUIN, a retro shooter in a pane (arrows/WASD move, space fires)',
    })

    return next(e)
  })

  on('command.run', { command: 'ruin' }, async $ => {
    await $.ui.open({ id: PANE, title: 'RUIN', focus: true })

    return {
      text: 'RUIN opened. Click the pane to focus it. Arrows/WASD move, Q/E strafe, space fires, R restarts, Esc releases the keys.',
    }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Text } = els
    if (!('Client' in els)) return <Text>RUIN needs a terminal or desktop surface.</Text>
    const { Client } = els

    return (
      <Box flexDirection="column" flexGrow={1}>
        <Client key="ruin" module="./ruin.tsx" height="100%" />
      </Box>
    )
  })
}
