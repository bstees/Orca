import { MOCK_SESSIONS } from '@orca/shared';
import { AlertBanner } from './AlertBanner';

export default {
  title: 'Orca/AlertBanner',
  component: AlertBanner,
};

const needsInput = MOCK_SESSIONS.filter((s) => s.status === 'needs_input');
const blocked = MOCK_SESSIONS.filter((s) => s.status === 'blocked');
const working = MOCK_SESSIONS.filter((s) => s.status === 'working');

export const OneNeedsInput = { args: { sessions: needsInput } };
export const MultipleBlocking = { args: { sessions: [...needsInput, ...blocked] } };
export const NoneBlocking = { args: { sessions: working } };
export const WithAlerts = {
  args: {
    sessions: MOCK_SESSIONS,
    alerts: [
      {
        sessionId: needsInput[0]?.sessionId,
        workspaceName: needsInput[0]?.workspaceName,
        message: 'Which approach should I use for auth?',
        options: ['JWT', 'Sessions', 'OAuth'],
      },
    ],
  },
};

