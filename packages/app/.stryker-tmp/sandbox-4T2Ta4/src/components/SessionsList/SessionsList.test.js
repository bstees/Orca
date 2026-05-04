// @ts-nocheck
import { render, screen } from '@testing-library/react';
import { SessionsList } from './SessionsList';

const makeSession = (id, status = 'working') => ({
  sessionId: id,
  workspaceName: `workspace-${id}`,
  gitBranch: 'main',
  status,
  message: '',
  registeredAt: Date.now() - 5000,
});

describe('SessionsList', () => {
  test('renders empty state when no sessions', () => {
    render(<SessionsList sessions={[]} />);
    expect(screen.getByText('No active sessions')).toBeInTheDocument();
  });

  test('renders a card for each session', () => {
    render(<SessionsList sessions={[makeSession('a'), makeSession('b')]} />);
    expect(screen.getByText('workspace-a')).toBeInTheDocument();
    expect(screen.getByText('workspace-b')).toBeInTheDocument();
  });
});
