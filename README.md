# storytree.dev

The website: its source (`src/`), tests (`src/**/*.test.*`), capture scripts (`testing/`, `shorts/`) and build. Its plan is
the library project `storytree-website` (`.storytree.json`).

It builds against storytree's own source, the git submodule in `storytree/`, pinned to a commit (ADR-1171). The pnpm
workspace includes the storytree packages the site reaches (`pnpm-workspace.yaml`), and the site imports only what their
`exports` declare. Picking up storytree changes is a deliberate commit that moves the pin:

```sh
git -C storytree fetch origin main && git -C storytree checkout <commit>
pnpm install && pnpm typecheck && pnpm test && pnpm build
git add storytree pnpm-lock.yaml && git commit -m "storytree moves to <commit>"
```

```sh
git clone --recurse-submodules <this repository>   # or: git submodule update --init
pnpm install
pnpm typecheck
pnpm test          # node:test through tsx, against a throwaway Postgres (test.mjs)
pnpm build         # into dist/
```

The saved map is storytree's own plan and code (ADR-1171 D4): `pnpm refresh:forest --from <ISO> --to <ISO>` reads
storytree's library project and surveys the submodule's checkout (see FOREST.md). The first time on a machine, approve
the submodule as storytree's checkout there: `storytree doctor --join storytree`, run in `storytree/`.

Publishing: each push to main that CI passes runs **Publish website** (`.github/workflows/website.yml`), which builds
the site and uploads it to the here.now site behind storytree.dev and storytree.dev/staging, when anything but this
repository's Markdown notes changed since the commit the live site names (`src/publish-source.ts`, contract 4.3). Its
Google publishing identity is storytree's `infra/website-publish`; until the repository variables
`WEBSITE_WIF_PROVIDER` and `WEBSITE_SERVICE_ACCOUNT` are set, the publish step says it skipped.
