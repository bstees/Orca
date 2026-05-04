# Orca — Frontend Instructions (`packages/app/`)

Read `instructions://global` first.

---

## Component Conventions (mirror alchemy exactly)

### File layout

```
src/components/ComponentName/
  ComponentName.jsx     ← component
  ComponentName.css     ← co-located plain CSS
  ComponentName.test.js ← Jest + RTL tests
  ComponentName.stories.jsx ← Storybook stories
```

### Component rules

- Top-level JSX element is a **custom element** with prefix `orc-`:
  ```jsx
  return (
    <orc-session-card class="session-card" {...rest}>
      ...
    </orc-session-card>
  );
  ```
- Named exports only — no default exports.
- PropTypes required for every prop. Destructure with defaults in function signature.
- Pass `...rest` to the base element.
- Use `@mui/base` headless components as foundations where appropriate.

### CSS rules

- Plain CSS, co-located in `ComponentName.css`.
- Custom properties prefixed `--orc-*`.
- CSS nesting is allowed (native, no preprocessor).
- Container queries allowed.
- No BEM, no CSS modules, no Sass.
- Selector type must be `orc-*` custom elements or class names.

### Barrel exports

- `src/index.js` — re-exports everything
- `src/hooks/index.js`
- `src/utils/index.js`

---

## Hooks & Utils

- Hooks in `src/hooks/`, one file per hook.
- Utils in `src/utils/`, one file per concern.
- Both **must** have unit tests and Stryker mutation coverage.
- Stryker thresholds: high=80, low=60.

---

## Testing Pattern

```js
// ComponentName.test.js
import { composeStories } from '@storybook/react';
import * as stories from './ComponentName.stories';

const { Default, WithData } = composeStories(stories);

test('renders default story', () => {
  render(<Default />);
  expect(screen.getByRole(...)).toBeInTheDocument();
});
```

Use `test.each()` for parameterised cases.

---

## WebSocket (useOrcaSocket hook)

```js
// src/hooks/useOrcaSocket.js
// Connects to /ws/dashboard, reconnects on close, exposes send()
// All session state is derived in useSessions.js from socket events
```

Never call `new WebSocket()` directly in a component — always through the hook.

---

## Notifications

Wrap `@capacitor/local-notifications` in `src/services/notifications.js`.
The wrapper must be swappable (dependency-injected) so Jest tests use a no-op.
