import { UrgencyLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

const config = {
  emergency: { label: '🔴 Emergency', className: 'bg-emergency/10 text-emergency border-emergency/20' },
  urgent: { label: '🟡 Urgent', className: 'bg-urgent/10 text-urgent border-urgent/20' },
  'non-urgent': { label: '🟢 Non-Urgent', className: 'bg-safe/10 text-safe border-safe/20' },
};

export function UrgencyBadge({ level, size = 'md' }: { level: UrgencyLevel; size?: 'sm' | 'md' | 'lg' }) {
  const c = config[level];
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-semibold',
      size === 'sm' && 'px-2 py-0.5 text-xs',
      size === 'md' && 'px-3 py-1 text-sm',
      size === 'lg' && 'px-4 py-1.5 text-base',
      c.className
    )}>
      {c.label}
    </span>
  );
}
