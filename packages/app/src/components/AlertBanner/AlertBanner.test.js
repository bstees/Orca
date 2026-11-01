import { render, screen, fireEvent } from '@testing-library/react';
import { AlertBanner } from './AlertBanner';
import { MOCK_WS_STREAM } from '@orca/shared';

const make = (status) => ({ sessionId: 'x', workspaceName: 'ws', status });
const mockAlert = MOCK_WS_STREAM.find((m) => m.payload.type === 'alert_notification').payload;

describe('AlertBanner', () => {
  test('renders nothing when no sessions need attention and no alerts', () => {
    const { container } = render(<AlertBanner sessions={[make('working')]} alerts={[]} />);
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

  test('calls onOptionSelect when an alert button is clicked', () => {
    const onOptionSelect = jest.fn();
    render(<AlertBanner sessions={[]} alerts={[mockAlert]} onOptionSelect={onOptionSelect} />);
    const button = screen.getByRole('button', { name: mockAlert.options[0] });
    fireEvent.click(button);
    expect(onOptionSelect).toHaveBeenCalledWith(mockAlert.sessionId, mockAlert.options[0]);
  });

  test('shows selected response when selectedOption is provided', () => {
    render(<AlertBanner sessions={[]} alerts={[mockAlert]} selectedOption="Approve" />);
    expect(screen.getByText(/You selected: Approve/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: mockAlert.options[0] })).toBeDisabled();
  });

  test('alert message takes priority over sessions text', () => {
    render(<AlertBanner sessions={[make('blocked')]} alerts={[mockAlert]} />);
    expect(screen.getByText(mockAlert.message)).toBeInTheDocument();
    expect(screen.queryByText(/needs your input/)).not.toBeInTheDocument();
  });

  test('renders finished message when a session is done and no alerts need attention', () => {
    render(<AlertBanner sessions={[make('done')]} alerts={[]} />);
    expect(screen.getByText(/ws finished/)).toBeInTheDocument();
  });

  test('renders plural finished message for multiple done sessions', () => {
    render(<AlertBanner sessions={[make('done'), make('done')]} alerts={[]} />);
    expect(screen.getByText(/2 sessions finished/)).toBeInTheDocument();
  });
});

