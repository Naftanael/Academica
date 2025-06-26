
'use client';

import { DoorOpen, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TvDisplayInfo } from '@/types';

interface TvDisplayCardProps {
  item: TvDisplayInfo;
  index: number;
}

// Using a standard function declaration for wider browser compatibility.
function getCourseLeftBorderColorClass(groupName: string) {
  // Unify border color to brand's primary green for consistency
  return 'border-l-primary';
};

export default function TvDisplayCard({ item, index }: TvDisplayCardProps) {
  // Refactored for better adaptability on various screen sizes.
  // Using 'rem' based font sizes and truncating long text to prevent overflow.
  return (
    <div
      style={{ animationDelay: (index * 100) + 'ms' }}
      className={cn(
        "bg-card/80 rounded-lg shadow-lg p-4 flex flex-col justify-between border border-border/70 border-l-8",
        "animate-in fade-in-50 slide-in-from-bottom-5 duration-500 ease-out fill-mode-backwards",
        getCourseLeftBorderColorClass(item.groupName)
      )}
    >
      <div className="flex-grow mb-2">
        <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-2 truncate font-headline" title={item.groupName}>
          {item.groupName}
        </h2>
        <p className="text-2xl lg:text-3xl text-muted-foreground">
          Turno: <span className="font-semibold text-foreground">{item.shift}</span>
        </p>
      </div>
      <div className="mt-auto pt-3 border-t border-border/50">
        {item.classroomName ? (
          <div className="flex items-center">
            <DoorOpen className="w-12 h-12 lg:w-16 lg:h-16 text-accent mr-3 shrink-0" />
            <div>
              <p className="text-xl lg:text-2xl text-muted-foreground uppercase tracking-wider font-medium">Sala</p>
              <p className="text-3xl lg:text-4xl font-semibold text-foreground truncate" title={item.classroomName}>
                {item.classroomName}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
             <AlertTriangle className="w-12 h-12 lg:w-16 lg:h-16 text-destructive mr-3 shrink-0" />
             <div>
                <p className="text-xl lg:text-2xl text-muted-foreground uppercase tracking-wider font-medium">Sala</p>
                <p className="text-3xl lg:text-4xl font-semibold text-destructive">
                    Não Atribuída
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
