import { useState } from 'react';
import PropTypes from 'prop-types';
import { StatusBadge } from '../StatusBadge/StatusBadge.jsx';
import { elapsedSince } from '../../utils/time.js';
import { APPROVAL_MODE_LABELS } from '@orca/shared';
import './SessionCard.css';

export function SessionCard({ session, response, onRespond, onSend, onApprovalModeChange, onDismiss, ...rest }) {
  const { sessionId, workspaceName, gitBranch, status, message, options, registeredAt, approvalMode } = session;
  const isActionable = status === 'needs_input' || status === 'blocked';
  const isCompleted = status === 'done';
  const actionButtons = (options?.length > 0) ? options : ['Approve', 'Skip', 'Need more info'];

  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    onSend?.(sessionId, text);
    setInputValue('');
  };

  const handleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      window.alert('Voice input is not supported by this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.addEventListener('result', (event) => {
      const transcript = event.results[0][0]?.transcript ?? '';
      setInputValue((prev) => prev ? `${prev} ${transcript}` : transcript);
    });
    recognition.addEventListener('error', () => { /* ignore */ });
    recognition.start();
  };

  return (
    <orc-session-card className="session-card" data-status={status} {...rest}>
      <div className="session-card__header">
        <span className="session-card__workspace">{workspaceName}</span>
        <StatusBadge status={status} />
      </div>
      <div className="session-card__branch">⎇ {gitBranch}</div>
      {message && <div className="session-card__message">{message}</div>}
      {isActionable && (
        <div className="session-card__actions">
          {response ? (
            <div className="session-card__response">Response: {response}</div>
          ) : (
            actionButtons.map((option) => (
              <button
                key={option}
                type="button"
                className="session-card__action"
                onClick={() => onRespond(sessionId, option)}
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}
      {isCompleted && (
        <div className="session-card__followup-group">
          <div className="session-card__followup-label">Send a follow-up or correction</div>
          <div className="session-card__followup">
            <input
              type="text"
              className="session-card__followup-input"
              placeholder="Type your follow-up..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="button"
              className="session-card__send"
              onClick={handleSend}
              disabled={!inputValue.trim()}
            >
              Send
            </button>
            <button
              type="button"
              className="session-card__voice"
              onClick={handleVoice}
              aria-label="Dictate follow-up"
            >
              🎤
            </button>
          </div>
        </div>
      )}
      <div className="session-card__footer">
        <span className="session-card__elapsed">{elapsedSince(registeredAt)} ago</span>
        {onApprovalModeChange && (
          <select
            className="session-card__approval-mode"
            value={approvalMode ?? 'default'}
            onChange={(e) => onApprovalModeChange(sessionId, e.target.value)}
            aria-label="Approval mode"
          >
            {Object.entries(APPROVAL_MODE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        )}
        <button type="button" className="session-card__dismiss" onClick={() => onDismiss?.(sessionId)} aria-label="Dismiss session">✕</button>
      </div>
    </orc-session-card>
  );
}

SessionCard.propTypes = {
  session: PropTypes.shape({
    sessionId: PropTypes.string.isRequired,
    workspaceName: PropTypes.string.isRequired,
    gitBranch: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    message: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.string),
    approvalMode: PropTypes.string,
    registeredAt: PropTypes.number.isRequired,
  }).isRequired,
  response: PropTypes.string,
  onRespond: PropTypes.func,
  onSend: PropTypes.func,
  onApprovalModeChange: PropTypes.func,
  onDismiss: PropTypes.func,
};
