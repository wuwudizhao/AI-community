import type { ReactNode } from 'react';

export function Dropdown({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <details className="ui-dropdown">
      <summary>{label}</summary>
      <div className="ui-dropdown__content">{children}</div>
    </details>
  );
}
