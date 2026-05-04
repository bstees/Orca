// @ts-nocheck
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  test.each([
    ['working', 'Working'],
    ['needs_input', 'Needs Input'],
    ['done', 'Done'],
  ])('renders label for status="%s"', (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
