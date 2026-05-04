import { StatusBadge } from './StatusBadge';

export default {
  title: 'Orca/StatusBadge',
  component: StatusBadge,
};

const statuses = ['registered', 'working', 'idle', 'blocked', 'needs_input', 'done'];

export const AllStatuses = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {statuses.map((s) => <StatusBadge key={s} status={s} />)}
    </div>
  ),
};
