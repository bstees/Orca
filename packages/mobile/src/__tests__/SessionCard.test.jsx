import { render, fireEvent } from '@testing-library/react-native';
import { SessionCard } from '../components/SessionCard.jsx';

const base = {
  sessionId: 'sess-001',
  workspaceName: 'Orca',
  gitBranch: 'main',
  description: 'Test',
  status: 'working',
  message: 'Doing work',
  options: [],
};

describe('SessionCard', () => {
  it('renders workspace and branch', () => {
    const { getByText } = render(<SessionCard session={base} />);
    expect(getByText('Orca')).toBeTruthy();
    expect(getByText(' main')).toBeTruthy();
  });

  it('shows the message when present', () => {
    const { getByText } = render(<SessionCard session={base} />);
    expect(getByText('Doing work')).toBeTruthy();
  });

  it('does not render option buttons when status is not needs_input', () => {
    const session = { ...base, status: 'working', options: ['Yes', 'No'] };
    const { queryByText } = render(<SessionCard session={session} />);
    expect(queryByText('Yes')).toBeNull();
    expect(queryByText('No')).toBeNull();
  });

  it('renders option buttons when status is needs_input', () => {
    const session = { ...base, status: 'needs_input', options: ['Yes', 'No'] };
    const { getByText } = render(<SessionCard session={session} />);
    expect(getByText('Yes')).toBeTruthy();
    expect(getByText('No')).toBeTruthy();
  });

  it('calls onRespond with sessionId and option when a button is pressed', () => {
    const onRespond = jest.fn();
    const session = { ...base, status: 'needs_input', options: ['Yes', 'No'] };
    const { getByText } = render(<SessionCard session={session} onRespond={onRespond} />);
    fireEvent.press(getByText('Yes'));
    expect(onRespond).toHaveBeenCalledWith('sess-001', 'Yes');
  });

  it('calls onRespond with each distinct option', () => {
    const onRespond = jest.fn();
    const session = { ...base, status: 'needs_input', options: ['Approve', 'Reject', 'Skip'] };
    const { getByText } = render(<SessionCard session={session} onRespond={onRespond} />);
    fireEvent.press(getByText('Reject'));
    expect(onRespond).toHaveBeenCalledWith('sess-001', 'Reject');
  });

  it('renders a free text input when status is needs_input and options is empty', () => {
    const session = { ...base, status: 'needs_input', options: [] };
    const { getByPlaceholderText } = render(<SessionCard session={session} />);
    expect(getByPlaceholderText('Type a response…')).toBeTruthy();
  });

  it('calls onRespond with free text on send button press', () => {
    const onRespond = jest.fn();
    const session = { ...base, status: 'needs_input', options: [] };
    const { getByPlaceholderText, getByLabelText } = render(
      <SessionCard session={session} onRespond={onRespond} />
    );
    const input = getByPlaceholderText('Type a response…');
    fireEvent.changeText(input, 'My answer');
    fireEvent.press(getByLabelText('Send response'));
    expect(onRespond).toHaveBeenCalledWith('sess-001', 'My answer');
  });

  it('does not call onRespond when free text is empty', () => {
    const onRespond = jest.fn();
    const session = { ...base, status: 'needs_input', options: [] };
    const { getByLabelText } = render(<SessionCard session={session} onRespond={onRespond} />);
    fireEvent.press(getByLabelText('Send response'));
    expect(onRespond).not.toHaveBeenCalled();
  });

  it('clears input after successful free text submit', () => {
    const onRespond = jest.fn();
    const session = { ...base, status: 'needs_input', options: [] };
    const { getByPlaceholderText, getByLabelText } = render(
      <SessionCard session={session} onRespond={onRespond} />
    );
    const input = getByPlaceholderText('Type a response…');
    fireEvent.changeText(input, 'hello');
    fireEvent.press(getByLabelText('Send response'));
    expect(input.props.value).toBe('');
  });

  it('does not render dismiss button for working sessions', () => {
    const { queryByLabelText } = render(<SessionCard session={base} />);
    expect(queryByLabelText('Dismiss session')).toBeNull();
  });

  it('renders dismiss button for done sessions', () => {
    const session = { ...base, status: 'done' };
    const { getByLabelText } = render(<SessionCard session={session} />);
    expect(getByLabelText('Dismiss session')).toBeTruthy();
  });

  it('renders dismiss button for responded sessions', () => {
    const session = { ...base, status: 'responded' };
    const { getByLabelText } = render(<SessionCard session={session} />);
    expect(getByLabelText('Dismiss session')).toBeTruthy();
  });

  it('calls onDismiss with sessionId when dismiss is pressed', () => {
    const onDismiss = jest.fn();
    const session = { ...base, status: 'done' };
    const { getByLabelText } = render(<SessionCard session={session} onDismiss={onDismiss} />);
    fireEvent.press(getByLabelText('Dismiss session'));
    expect(onDismiss).toHaveBeenCalledWith('sess-001');
  });

  describe('idle prompt input', () => {
    it('renders prompt input when status is idle', () => {
      const session = { ...base, status: 'idle' };
      const { getByPlaceholderText } = render(<SessionCard session={session} />);
      expect(getByPlaceholderText('Ask a task…')).toBeTruthy();
    });

    it('renders prompt input for working sessions', () => {
      const { getByPlaceholderText } = render(<SessionCard session={base} />);
      expect(getByPlaceholderText('Ask a task…')).toBeTruthy();
    });

    it('does not render prompt input for done sessions', () => {
      const session = { ...base, status: 'done' };
      const { queryByPlaceholderText } = render(<SessionCard session={session} />);
      expect(queryByPlaceholderText('Ask a task…')).toBeNull();
    });

    it('calls onPrompt with sessionId and text when Send is pressed', () => {
      const onPrompt = jest.fn();
      const session = { ...base, status: 'idle' };
      const { getByPlaceholderText, getByLabelText } = render(
        <SessionCard session={session} onPrompt={onPrompt} />
      );
      fireEvent.changeText(getByPlaceholderText('Ask a task…'), 'Add login tests');
      fireEvent.press(getByLabelText('Send prompt'));
      expect(onPrompt).toHaveBeenCalledWith('sess-001', 'Add login tests');
    });

    it('does not call onPrompt when prompt text is empty', () => {
      const onPrompt = jest.fn();
      const session = { ...base, status: 'idle' };
      const { getByLabelText } = render(<SessionCard session={session} onPrompt={onPrompt} />);
      fireEvent.press(getByLabelText('Send prompt'));
      expect(onPrompt).not.toHaveBeenCalled();
    });

    it('clears prompt input after successful send', () => {
      const onPrompt = jest.fn();
      const session = { ...base, status: 'idle' };
      const { getByPlaceholderText, getByLabelText } = render(
        <SessionCard session={session} onPrompt={onPrompt} />
      );
      const input = getByPlaceholderText('Ask a task…');
      fireEvent.changeText(input, 'Refactor auth');
      fireEvent.press(getByLabelText('Send prompt'));
      expect(input.props.value).toBe('');
    });
  });
});
