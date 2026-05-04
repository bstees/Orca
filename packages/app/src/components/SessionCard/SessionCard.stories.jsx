import { MOCK_SESSIONS } from '@orca/shared';
import { SessionCard } from './SessionCard';

export default {
  title: 'Orca/SessionCard',
  component: SessionCard,
};

export const Working = { args: { session: MOCK_SESSIONS.find((s) => s.status === 'working') } };
export const NeedsInput = { args: { session: MOCK_SESSIONS.find((s) => s.status === 'needs_input') } };
export const Blocked = { args: { session: MOCK_SESSIONS.find((s) => s.status === 'blocked') } };
export const Done = { args: { session: MOCK_SESSIONS.find((s) => s.status === 'done') } };
export const Idle = { args: { session: MOCK_SESSIONS.find((s) => s.status === 'idle') } };

