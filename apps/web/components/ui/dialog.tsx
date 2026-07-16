'use client';

import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Button } from './button';

export function Dialog({
  trigger,
  title,
  children,
}: {
  trigger: string;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button variant="outline" onClick={() => ref.current?.showModal()}>
        {trigger}
      </Button>
      <dialog className="ui-dialog" ref={ref}>
        <form method="dialog">
          <header>
            <strong>{title}</strong>
            <button aria-label="关闭">×</button>
          </header>
          {children}
        </form>
      </dialog>
    </>
  );
}
