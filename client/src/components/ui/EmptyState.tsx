import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-warm-muted" />
        </div>
      )}
      <h3 className="text-base font-medium text-warm-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-warm-muted max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
