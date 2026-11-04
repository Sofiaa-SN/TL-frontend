"use client";

import { TriangleAlert } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
};

/**
 * Styled replacement for window.confirm(): names the action and its
 * consequences, and uses a specific verb instead of "OK".
 *
 *   const [confirm, confirmDialog] = useConfirm();
 *   if (await confirm({ title: "Delete chapter?", confirmLabel: "Delete chapter", destructive: true })) ...
 *   return <>{...}{confirmDialog}</>;
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    resolver.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  const dialog = (
    <Dialog open={Boolean(options)} onOpenChange={(open) => { if (!open) settle(false); }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="flex-row items-start gap-4 text-left">
          {options?.destructive && (
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
              <TriangleAlert className="size-5" aria-hidden="true" />
            </span>
          )}
          <div className="flex flex-col gap-1.5">
            <DialogTitle>{options?.title}</DialogTitle>
            {options?.description && <DialogDescription>{options.description}</DialogDescription>}
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => settle(false)}>{options?.cancelLabel ?? "Cancel"}</Button>
          <Button type="button" variant={options?.destructive ? "destructive-solid" : "default"} onClick={() => settle(true)} autoFocus>
            {options?.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return [confirm, dialog] as const;
}
