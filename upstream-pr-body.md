## problem

tool output rendering has two issues today:

1. **built-in tools** (bash, diff) use ad-hoc tail-only truncation — you lose the start of the output. a command that prints a header, then 200 lines of data, then a summary, shows only the tail.

2. **extensions** can't participate in rendering at all. they return `{details: {text: ...}}` and the generic renderer shows a tail-truncated blob. no way to say "show head + tail" or "focus on line 42 ± 5".

## proposal

add a `show(text, excerpts, width)` primitive to `visual-truncate.ts`:

```ts
export interface Excerpt {
  focus: number | "head" | "tail";
  context: number;
}

export interface ShowResult {
  visualLines: string[];
  skippedRanges: Array<[number, number]>;
}

export function show(text: string, excerpts: Excerpt[], width: number): ShowResult
```

- `focus: "head"` — first `context` visual lines (one-sided)
- `focus: "tail"` — last `context` visual lines (one-sided)
- `focus: N` — ±`context` lines around visual line N (symmetric)

gaps between windows are replaced by `... (N lines) ...` elision markers (git-hunk style). if `excerpts` is empty, returns all lines unchanged.

extensions declare display intent by setting `details.excerpts` on their tool result. the generic renderer in `tool-execution.ts` picks it up — no custom renderer needed:

```ts
// extension tool — no custom renderer required
return {
  success: true,
  output: rawOutput,
  details: {
    text: rawOutput,
    excerpts: [{ focus: "head", context: 3 }, { focus: "tail", context: 5 }],
  },
};
```

## key changes

- `packages/coding-agent/src/modes/interactive/components/visual-truncate.ts` — `show()` implementation with merge/sort of overlapping ranges
- `packages/coding-agent/src/modes/interactive/components/tool-execution.ts` — `renderBashContent` updated to `show(text, [{focus:"head",context:2},{focus:"tail",context:3}], width)`
- `packages/coding-agent/src/index.ts` — `show`, `Excerpt`, `ShowResult` exported from package entrypoint
- 12 unit tests, all passing
- e2e validated: `seq 1 100` renders `1\n2\n... (95 lines) ...\n98\n99\n100`

there's also a fix in `loader.ts` (`tryNative:false`) that makes extensions able to `import { show } from "@mariozechner/pi-coding-agent"` and reliably get the host process's exports rather than the globally-installed package. happy to split that into a separate PR if preferred.

## tradeoffs

- adds ~80 lines to `visual-truncate.ts`; deletes the ad-hoc truncation logic in `renderBashContent`/`renderDiff`
- `details.excerpts` is a new convention on the generic result type — backward compatible (undefined = show all)
- `focus: N` uses visual line indices after wrapping, not source line numbers — consistent with how the rest of the renderer thinks about lines
