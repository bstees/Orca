import PropTypes from 'prop-types';
import './AlertBanner.css';

export function AlertBanner({ sessions, alerts = [], selectedOption = null, onOptionSelect = () => {}, ...rest }) {
  const blocking = sessions.filter((s) => s.status === 'needs_input' || s.status === 'blocked');
  const finished = sessions.filter((s) => s.status === 'done');
  const latestAlert = alerts[0] ?? null;

  if (!blocking.length && !latestAlert && !finished.length) return null;

  const bannerType = latestAlert ? 'alert' : blocking.length ? 'blocking' : 'finished';
  const text = latestAlert
    ? latestAlert.message
    : blocking.length === 1
      ? `${blocking[0].workspaceName} needs your input`
      : blocking.length > 1
        ? `${blocking.length} sessions need your input`
        : finished.length === 1
          ? `${finished[0].workspaceName} finished`
          : `${finished.length} sessions finished`;

  return (
    <orc-alert-banner className="alert-banner" {...rest}>
      <span className="alert-banner__icon">🔔</span>
      <span className="alert-banner__text">{text}</span>
      {latestAlert?.options?.length > 0 && (
        <span className="alert-banner__options">
          {latestAlert.options.map((opt) => (
            <button
              key={opt}
              type="button"
              className="alert-banner__option"
              onClick={() => onOptionSelect(latestAlert.sessionId, opt)}
              disabled={selectedOption != null}
            >
              {opt}
            </button>
          ))}
        </span>
      )}
      {selectedOption && (
        <span className="alert-banner__response">You selected: {selectedOption}</span>
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
  selectedOption: PropTypes.string,
  onOptionSelect: PropTypes.func,
};

