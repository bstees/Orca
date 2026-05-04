import PropTypes from 'prop-types';
import './AlertBanner.css';

export function AlertBanner({ sessions, alerts = [], ...rest }) {
  const blocking = sessions.filter((s) => s.status === 'needs_input' || s.status === 'blocked');
  const latestAlert = alerts[0] ?? null;

  if (!blocking.length && !latestAlert) return null;

  const text = latestAlert
    ? latestAlert.message
    : blocking.length === 1
      ? `${blocking[0].workspaceName} needs your input`
      : `${blocking.length} sessions need your input`;

  return (
    <orc-alert-banner class="alert-banner" {...rest}>
      <span class="alert-banner__icon">🔔</span>
      <span class="alert-banner__text">{text}</span>
      {latestAlert?.options?.length > 0 && (
        <span class="alert-banner__options">
          {latestAlert.options.map((opt) => (
            <button key={opt} class="alert-banner__option">{opt}</button>
          ))}
        </span>
      )}
    </orc-alert-banner>
  );
}

AlertBanner.propTypes = {
  sessions: PropTypes.arrayOf(
    PropTypes.shape({
      sessionId: PropTypes.string.isRequired,
      workspaceName: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      sessionId: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      options: PropTypes.arrayOf(PropTypes.string),
    })
  ),
};

