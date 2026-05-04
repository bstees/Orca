import PropTypes from 'prop-types';
import { SessionCard } from '../SessionCard/SessionCard.jsx';
import './SessionsList.css';

export function SessionsList({ sessions, ...rest }) {
  if (!sessions.length) {
    return (
      <orc-sessions-list class="sessions-list sessions-list--empty" {...rest}>
        <p className="sessions-list__empty-text">No active sessions</p>
      </orc-sessions-list>
    );
  }

  return (
    <orc-sessions-list class="sessions-list" {...rest}>
      {sessions.map((session) => (
        <SessionCard key={session.sessionId} session={session} />
      ))}
    </orc-sessions-list>
  );
}

SessionsList.propTypes = {
  sessions: PropTypes.arrayOf(
    PropTypes.shape({ sessionId: PropTypes.string.isRequired })
  ).isRequired,
};
