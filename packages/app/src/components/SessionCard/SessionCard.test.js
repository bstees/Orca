import { render, screen } from '@testing-library/react';
import { SessionCard } from './SessionCard';

const baseSession = {
  sessionId: 'sess-1',
  workspaceName: 'my-project',
  gitBranch: 'feature/test',
  status: 'working',
  message: 'Building the thing',
  registeredAt: Date.now() - 60000,
};

describe('SessionCard', () => {
  test('renders workspace name and branch', () => {
    render(<SessionCard session={baseSession} />);
    expect(screen.getByText('my-project')).toBeInTheDocument();
    expect(screen.getByText('⎇ feature/test')).toBeInTheDocument();
  });

  test('renders status badge', () => {
    render(<SessionCard session={baseSession} />);
    expect(screen.getByText('Working')).toBeInTheDocument();
  });

  test('renders message when present', () => {
    render(<SessionCard session={baseSession} />);
    expect(screen.getByText('Building the thing')).toBeInTheDocument();
  });

  test('omits message section when empty', () => {
    render(<SessionCard session={{ ...baseSession, message: '' }} />);
    expect(screen.queryByText('Building the thing')).not.toBeInTheDocument();
  });
});
