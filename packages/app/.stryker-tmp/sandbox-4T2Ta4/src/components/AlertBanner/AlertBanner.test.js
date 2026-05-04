// @ts-nocheck
import { render, screen } from '@testing-library/react';
import { AlertBanner } from './AlertBanner';
import { MOCK_WS_STREAM } from '@orca/shared';

const make = (status) => ({ sessionId: 'x', workspaceName: 'ws', status });
const mockAlert = MOCK_WS_STREAM.find((m) => m.payload.type === 'alert_notification').payload;

describe('AlertBanner', () => {
  test('renders nothing when no sessions need input and no alerts', () => {
    const { container } = render(<AlertBanner sessions={[make('working'), make('done')]} alerts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders singular message for one blocking session', () => {
    render(<AlertBanner sessions={[make('needs_input')]} />);
    expect(screen.getByText(/ws needs your input/)).toBeInTheDocument();
  });

  test('renders plural message for multiple blocking sessions', () => {
    render(<AlertBanner sessions={[make('needs_input'), make('blocked')]} />);
    expect(screen.getByText(/2 sessions need your input/)).toBeInTheDocument();
  });

  test('treats "blocked" as action required', () => {
    render(<AlertBanner sessions={[make('blocked')]} />);
    expect(screen.getByText(/needs your input/)).toBeInTheDocument();
  });

  test('shows alert message when alert is present', () => {
    render(<AlertBanner sessions={[]} alerts={[mockAlert]} />);
    expect(screen.getByText(mockAlert.message)).toBeInTheDocument();
  });

  test('shows alert option buttons', () => {
    render(<AlertBanner sessions={[]} alerts={[mockAlert]} />);
    for (const opt of mockAlert.options) {
      expect(screen.getByRole('button', { name: opt })).toBeInTheDocument();
    }
  });

  test('alert message takes priority over sessions text', () => {
    render(<AlertBanner sessions={[make('blocked')]} alerts={[mockAlert]} />);
    expect(screen.getByText(mockAlert.message)).toBeInTheDocument();
    expect(screen.queryByText(/needs your input/)).not.toBeInTheDocument();
  });
});

