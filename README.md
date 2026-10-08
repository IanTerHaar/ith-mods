# ith-mods

Personal Claude Code plugin marketplace.

## Plugins

| Plugin | What it does |
|---|---|
| `context-bar` | Progress bar above the prompt showing context used, e.g. `111.2k / 1M (11%)  +11.2k last turn` |
| `usage-limits` | How much of the 5-hour and weekly limits is left, e.g. `5h ██████░░░░ 62% left · resets 2h 14m`. Sits to the right of `context-bar`, or at the left edge without it |
| `file-tree` | File tree of the cwd in the sidebar (`/tui fullscreen`, 110+ columns), with git status, lines changed and a shimmer on files Claude reads or writes. `/file-tree [path]` shows it or pins a folder. A trimmed fork of [claude-code-filetree](https://github.com/data-goblin/claude-code-filetree) by Kurt Buhler (MIT, see `plugins/file-tree/LICENSE`): no search box, and refresh is the only header button |
| `heads-up` | Notices for what needs your eye: Claude waiting on a permission prompt or a question, tool calls that failed, and a turn that finished after a minute or more (or stopped on an error). Each one pops up over the top right corner for a few seconds, and is kept in a box above the prompt until you press Dismiss or send the next prompt. Options: `show` (`both`, `popup` or `box`), `side` (which edge the box sits against, `left` or `right`, default `right`) and `turnAfter` (`always`, `30s`, `1m`, `2m`, `5m`, `never`) |

## Install

```
claude plugin marketplace add <github-user>/ith-mods
claude plugin install context-bar@ith-mods --scope user
claude plugin install usage-limits@ith-mods --scope user
claude plugin install file-tree@ith-mods --scope user
claude plugin install heads-up@ith-mods --scope user
```

## Update

```
claude plugin marketplace update ith-mods
claude plugin update context-bar@ith-mods
claude plugin update usage-limits@ith-mods
claude plugin update file-tree@ith-mods
claude plugin update heads-up@ith-mods
```

Bump `version` in the plugin's `plugin.json` whenever its code changes, then `/reload-plugins`.

## Add a plugin

Create `plugins/<name>/` (with `.claude-plugin/plugin.json`) and add an entry to `.claude-plugin/marketplace.json`.
