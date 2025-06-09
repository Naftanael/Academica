import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-8 h-8 text-primary hidden md:block" />}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-headline">{title}</h1>
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
