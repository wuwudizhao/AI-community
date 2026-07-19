export function AdminPageState({ children, error = false }: { children: string; error?: boolean }) {
  return <div className={error ? 'admin-page-state is-error' : 'admin-page-state'}>{children}</div>;
}
