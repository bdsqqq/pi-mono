# pi-mono fork — feat/excerpt-show-api

local dev setup for the `show()` / `Excerpt` API proposal to pi-mono.

**branch pushed**: `bdsqqq/pi-mono` → `feat/excerpt-show-api` (f99a33de)

key commits:
- `4535086d` feat(visual-truncate): add Excerpt-based show() API for windowed line display
- `9618979d` fix(loader): set tryNative:false unconditionally in loadExtensionModule
- `f99a33de` feat(index): export show, Excerpt, ShowResult from package entrypoint

## upstream proposal

badlogic/pi-mono has issues disabled. to propose this upstream, open a PR directly from `bdsqqq/pi-mono:feat/excerpt-show-api` → `badlogic/pi-mono:main`.

the pitch: replace ad-hoc tail-only truncation in `renderBashContent` / `renderDiff` with a generic `show(text, excerpts, width)` primitive that extensions can also call. extensions declare display intent via `details.excerpts`; the renderer handles layout.

to open the PR:

```bash
gh pr create \
  --repo badlogic/pi-mono \
  --head bdsqqq:feat/excerpt-show-api \
  --base main \
  --title "proposal: generic show(text, excerpts) API for windowed text display in tools + extensions" \
  --body "..."
```

draft PR body is in `upstream-pr-body.md` in this directory.

## structure

```
~/www/pi-mono/
  bare-repo.git/          — bare clone of bdsqqq/pi-mono
  main/                   — worktree tracking main
  feat-excerpt-show-api/  — worktree for the feature branch
  README.md               — this file
```

## running the fork binary

the fork is installed globally as `pi-feat-excerpt-show-api` via a `file:` dep in the bun global package.json. the binary points at `feat-excerpt-show-api/packages/coding-agent/dist/cli.js`.

to launch with live extensions (bypasses nix-managed symlinks, which point to the immutable nix store):

```bash
PI_CODING_AGENT_DIR=/tmp/pi-feat-dev pi-feat-excerpt-show-api --no-session
```

`/tmp/pi-feat-dev/` contains:
- `settings.json` — mirrors `~/.pi/agent/settings.json` but with extension paths pointing at nix config sources under `~/commonplace/01_files/nix/user/pi/` directly
- `auth.json` — symlink to `~/.pi/agent/auth.json` (shared credentials)

this means edits to extension `.ts` files under `~/commonplace/01_files/nix/user/pi/extensions/` take effect immediately — jiti re-transpiles on the next tool call, no nix rebuild needed.

## rebuilding after source changes

after editing anything in `feat-excerpt-show-api/packages/`:

```bash
cd ~/www/pi-mono/feat-excerpt-show-api

# full chain (only needed if tui/ai/agent changed)
cd packages/tui && npx @typescript/native-preview -p tsconfig.build.json
cd ../ai && npx @typescript/native-preview -p tsconfig.build.json
cd ../agent && npx @typescript/native-preview -p tsconfig.build.json

# coding-agent (most common)
cd packages/coding-agent
npx @typescript/native-preview -p tsconfig.build.json && npm run copy-assets
```

the installed binary at `.bun/install/global/node_modules/pi-feat-excerpt-show-api/packages/coding-agent/dist` is symlinked to the worktree dist, so rebuilding here is enough.

## gotchas

- **nix symlinks** — `~/.pi/agent/extensions/` symlinks point to the nix store (immutable). `PI_CODING_AGENT_DIR` sidesteps this by loading extensions from source paths directly.
- **bun install --force** copies `packages/` instead of symlinking — the dist symlink at `.bun/install/global/.../dist` was set up manually and must be recreated if bun reinstalls.
- **jiti cache** — lives in `/var/folders/.../T/jiti/`. cache key includes source hash, so editing a file from source (not nix store) produces a new cache entry automatically.
- **`@mariozechner/pi-coding-agent` in extensions** — the fork patches `loader.ts` to set `tryNative:false` unconditionally, so jiti's alias always wins and extensions get the fork's exports. extensions can freely `import { show } from "@mariozechner/pi-coding-agent"`.
