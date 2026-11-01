import PropTypes from 'prop-types';
import { SessionCard } from '../SessionCard/SessionCard.jsx';
import './SessionsList.css';

export function SessionsList({
  sessions,
  sessionResponses = {},
  onSessionAction,
  onSessionSend,
  onApprovalModeChange,
  onDismiss,
  ...rest
}) {
  if (!sessions.length) {
    return (
      <orc-sessions-list className="sessions-list sessions-list--empty" {...rest}>
        <p className="sessions-list__empty-text">No active sessions</p>
      </orc-sessions-list>
    );
  }

  return (
    <orc-sessions-list className="sessions-list" {...rest}>
      {sessions.map((session) => (
        <SessionCard
          key={session.sessionId}
          session={session}
          response={sessionResponses[session.sessionId]}
          onRespond={onSessionAction}
          onSend={onSessionSend}
          onApprovalModeChange={onApprovalModeChange}
          onDismiss={onDismiss}
        />
      ))}
    </orc-sessions-list>
  );
}

SessionsList.propTypes = {
  sessions: PropTypes.arrayOf(
    PropTypes.shape({ sessionId: PropTypes.string.isRequired })
  ).isRequired,
  sessionResponses: PropTypes.object,
  onSessionAction: PropTypes.func,
  onSessionSend: PropTypes.func,
  onApprovalModeChange: PropTypes.func,
  onDismiss: PropTypes.func,
};
