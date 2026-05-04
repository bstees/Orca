import PropTypes from 'prop-types';
import { StatusBadge } from '../StatusBadge/StatusBadge.jsx';
import { elapsedSince } from '../../utils/time.js';
import './SessionCard.css';

export function SessionCard({ session, ...rest }) {
  const { workspaceName, gitBranch, status, message, registeredAt } = session;
  return (
    <orc-session-card class="session-card" data-status={status} {...rest}>
      <div className="session-card__header">
        <span className="session-card__workspace">{workspaceName}</span>
        <StatusBadge status={status} />
      </div>
      <div className="session-card__branch">⎇ {gitBranch}</div>
      {message && <div className="session-card__message">{message}</div>}
      <div className="session-card__footer">
        <span className="session-card__elapsed">{elapsedSince(registeredAt)} ago</span>
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
    registeredAt: PropTypes.number.isRequired,
  }).isRequired,
};
