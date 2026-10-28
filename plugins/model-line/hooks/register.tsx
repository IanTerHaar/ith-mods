import type { Register } from 'claude-code'

export const register: Register = on => {
  // /model, the picker, a fallback or a resume: draw the hint line again
  on('classic.PostModelSwitch', ($, e, next) => {
    $.ui.invalidate('ui.render')
    return next(e)
  })

  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    const model = await $.session.model()
    if (!model) return next(e)

    return next({ ...e, props: { ...e.props, tail: `${e.props.tail ?? ''} · ${model}` } })
  })
}
