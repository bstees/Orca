import { render, screen, fireEvent } from '@testing-library/react';
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

  test('shows approval mode select when onApprovalModeChange is provided', () => {
    render(
      <SessionCard
        session={{ ...baseSession, approvalMode: 'bypass' }}
        onApprovalModeChange={() => {}}
      />
    );
    const select = screen.getByRole('combobox', { name: /approval mode/i });
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('bypass');
  });

  test('calls onApprovalModeChange with sessionId and new mode', () => {
    const handler = jest.fn();
    render(
      <SessionCard
        session={{ ...baseSession, approvalMode: 'default' }}
        onApprovalModeChange={handler}
      />
    );
    const select = screen.getByRole('combobox', { name: /approval mode/i });
    fireEvent.change(select, { target: { value: 'autopilot' } });
    expect(handler).toHaveBeenCalledWith('sess-1', 'autopilot');
  });

  test('hides approval mode select when onApprovalModeChange is not provided', () => {
    render(<SessionCard session={baseSession} />);
    expect(screen.queryByRole('combobox', { name: /approval mode/i })).not.toBeInTheDocument();
  });

  test('follow-up input is local — two cards do not share state', () => {
    const doneSession1 = { ...baseSession, sessionId: 'sess-a', status: 'done' };
    const doneSession2 = { ...baseSession, sessionId: 'sess-b', status: 'done' };
    const { container } = render(
      <>
        <SessionCard session={doneSession1} onSend={() => {}} />
        <SessionCard session={doneSession2} onSend={() => {}} />
      </>
    );
    const [input1, input2] = container.querySelectorAll('.session-card__followup-input');
    fireEvent.change(input1, { target: { value: 'hello from card 1' } });
    expect(input1.value).toBe('hello from card 1');
    expect(input2.value).toBe('');
  });

  test('onSend is called with sessionId and text, then input clears', () => {
    const onSend = jest.fn();
    render(
      <SessionCard session={{ ...baseSession, status: 'done' }} onSend={onSend} />
    );
    const input = screen.getByPlaceholderText('Type your follow-up...');
    fireEvent.change(input, { target: { value: 'do the thing' } });
    fireEvent.click(screen.getByText('Send'));
    expect(onSend).toHaveBeenCalledWith('sess-1', 'do the thing');
    expect(input.value).toBe('');
  });
});
