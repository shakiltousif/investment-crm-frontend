'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Trash2,
  Edit,
  Save,
  Download,
  Upload
} from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'info' | 'success';
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
  icon,
  className,
}: ConfirmDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: <XCircle className="h-6 w-6 text-destructive" />,
          confirmVariant: 'destructive' as const,
          alertVariant: 'destructive' as const,
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-warning" />,
          confirmVariant: 'default' as const,
          alertVariant: 'default' as const,
        };
      case 'info':
        return {
          icon: <Info className="h-6 w-6 text-info" />,
          confirmVariant: 'default' as const,
          alertVariant: 'default' as const,
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-6 w-6 text-success" />,
          confirmVariant: 'default' as const,
          alertVariant: 'default' as const,
        };
      default:
        return {
          icon: <Info className="h-6 w-6 text-muted-foreground" />,
          confirmVariant: 'default' as const,
          alertVariant: 'default' as const,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const displayIcon = icon || variantStyles.icon;

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {displayIcon}
            </div>
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-2">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variantStyles.confirmVariant}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Specialized confirmation dialogs for common use cases
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Item"
      description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmText="Delete"
      variant="destructive"
      loading={loading}
      onConfirm={onConfirm}
      icon={<Trash2 className="h-6 w-6 text-destructive" />}
    />
  );
}

export function SaveConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Save Changes"
      description="Are you sure you want to save these changes?"
      confirmText="Save"
      variant="success"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
      icon={<Save className="h-6 w-6 text-success" />}
    />
  );
}

export function DiscardChangesDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Discard Changes"
      description="You have unsaved changes. Are you sure you want to discard them?"
      confirmText="Discard"
      variant="warning"
      onConfirm={onConfirm}
      onCancel={onCancel}
      icon={<AlertTriangle className="h-6 w-6 text-warning" />}
    />
  );
}

export function ExportDataDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Export Data"
      description="This will download your data as a CSV file. Do you want to continue?"
      confirmText="Export"
      variant="info"
      loading={loading}
      onConfirm={onConfirm}
      icon={<Download className="h-6 w-6 text-info" />}
    />
  );
}

export function ImportDataDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Import Data"
      description="This will import data from your selected file. Existing data may be overwritten. Do you want to continue?"
      confirmText="Import"
      variant="warning"
      loading={loading}
      onConfirm={onConfirm}
      icon={<Upload className="h-6 w-6 text-warning" />}
    />
  );
}

// Hook for managing confirmation dialogs
export function useConfirmDialog() {
  const [dialog, setDialog] = React.useState<{
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive' | 'warning' | 'info' | 'success';
    loading?: boolean;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const confirm = (
    title: string,
    description: string,
    onConfirm: () => void,
    variant: 'default' | 'destructive' | 'warning' | 'info' | 'success' = 'default',
    loading = false
  ) => {
    setDialog({
      open: true,
      title,
      description,
      onConfirm,
      variant,
      loading,
    });
  };

  const close = () => {
    setDialog(prev => ({ ...prev, open: false }));
  };

  const handleConfirm = () => {
    dialog.onConfirm();
    close();
  };

  return {
    confirm,
    close,
    dialog: (
      <ConfirmDialog
        open={dialog.open}
        onOpenChange={close}
        title={dialog.title}
        description={dialog.description}
        variant={dialog.variant}
        loading={dialog.loading}
        onConfirm={handleConfirm}
      />
    ),
  };
}

