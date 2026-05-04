import PropTypes from 'prop-types';
import { getStatusDisplay } from '../../utils/status.js';
import './StatusBadge.css';

export function StatusBadge({ status, ...rest }) {
  const { label, color } = getStatusDisplay(status);
  return (
    <orc-status-badge
      class="status-badge"
      style={{ '--orc-badge-color': color }}
      {...rest}
    >
      {label}
    </orc-status-badge>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};
