
'use client';

import { DoorOpen, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TvDisplayInfo } from '@/types';

interface TvDisplayCardProps {
  item: TvDisplayInfo;
  index: number;
}

const getCourseLeftBorderColorClass = (groupName: string): string => {
  // Unify border color to brand's primary green
  return 'border-l-primary';
};

export default function TvDisplayCard({ item, index }: TvDisplayCardProps) {
  return (
    <div
      style={{ animationDelay: `${index * 100}ms` }}
      className={cn(
        "bg-card/80 rounded-xl shadow-xl p-5 sm:p-6 md:p-8 flex flex-col justify-between border border-border/70 border-l-[10px]",
        "animate-in fade-in-50 slide-in-from-bottom-5 duration-500 ease-out fill-mode-backwards",
        getCourseLeftBorderColorClass(item.groupName)
      )}
    >
      <div className="flex-grow">
        <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-foreground mb-3 sm:mb-4 truncate font-headline" title={item.groupName}>
          {item.groupName}
        </h2>
        <p className="text-3xl sm:text-4xl md:text-5xl text-muted-foreground mb-4 sm:mb-5">
          Turno: <span className="font-semibold text-foreground">{item.shift}</span>
        </p>
      </div>
      <div className="mt-auto pt-4 sm:pt-5 border-t border-border/50">
        {item.classroomName ? (
          <div className="flex items-center">
            <DoorOpen className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-accent mr-3 sm:mr-4 shrink-0" />
            <div>
              <p className="text-2xl sm:text-3xl text-muted-foreground uppercase tracking-wider font-medium">Sala Atual</p>
              <p className="text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground truncate" title={item.classroomName}>
                {item.classroomName}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
             <AlertTriangle className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-destructive mr-3 sm:mr-4 shrink-0" />
             <div>
                <p className="text-2xl sm:text-3xl text-muted-foreground uppercase tracking-wider font-medium">Sala</p>
                <p className="text-4xl sm:text-5xl md:text-6xl font-semibold text-destructive">
                    Não Atribuída
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
