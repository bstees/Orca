# Validation scope

The [Verify workflow](../.github/workflows/verify.yml) runs on pull requests and pushes to `main`, using the Node version in `.nvmrc` and the Yarn version in `package.json`. It needs no repository secrets and does not deploy or package a release.

## Automated checks

- Immutable dependency installation from `yarn.lock`.
- Root Jest projects: shared protocol, server, React dashboard and VS Code extension.
- Mobile Jest suite, separately, using the installed Expo/React Native presets and mocks.
- Vite dashboard build and esbuild extension build.

The server suites include local and remote authorization boundaries. Passing these tests is evidence for the tested behaviors, not a penetration test or a guarantee of safe deployment.

## Remaining release gates

- **Lint:** not part of this workflow yet. A November 18, 2026 baseline run found 395 existing lint errors after removing an incompatible blanket `brace-expansion` major-version override. Most were formatting errors; they are not suppressed or presented as passing. Run `yarn lint` to inspect current results and clean up this baseline in a dedicated change before adding a lint gate.
- **Native devices and desktop packaging:** validate pairing, TLS trust, notification behavior, reconnects and packaged Electron behavior on real target platforms. Mocked mobile tests and web/extension builds do not cover these.
- **Mutation testing:** run `yarn mutate` separately; this workflow does not attest to the README's historical mutation scores.
- **Runtime-data history:** the previously tracked database is absent from the current tree but remains in history. Review it separately before deciding whether cleanup or credential rotation is needed. This workflow does not rewrite history.

## Local reproduction

```sh
nvm use
corepack enable
yarn install --immutable
yarn test --ci --runInBand
yarn workspace @orca/mobile test --ci --runInBand
yarn workspace @orca/app build
yarn workspace orca-session-manager build
```
