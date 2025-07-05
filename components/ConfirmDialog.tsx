import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title?: ReactNode;
  description?: ReactNode;
  highlight?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  confirmVariant?: "destructive" | "default" | "outline" | "secondary";
  children?: ReactNode; // for custom content
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = "Are you sure?",
  description,
  highlight,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  confirmVariant = "destructive",
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
          {highlight && (
            <div className="mt-2 font-semibold text-white">{highlight}</div>
          )}
        </DialogHeader>
        {children && <div className="my-2">{children}</div>}
        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onCancel || (() => onOpenChange(false))}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={loading}
            className="font-semibold"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
