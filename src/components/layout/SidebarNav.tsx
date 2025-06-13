
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react'; // Added for useState, useEffect
import {
  LayoutDashboard,
  School,
  UsersRound,
  CalendarDays,
  Landmark,
  ListChecks,
  MonitorPlay,
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/classrooms', label: 'Salas de Aula', icon: School },
  { href: '/classgroups', label: 'Turmas', icon: UsersRound },
  { href: '/room-availability', label: 'Disponibilidade', icon: CalendarDays },
  { href: '/reservations', label: 'Reservas', icon: ListChecks },
  { href: '/tv-display', label: 'Painel TV', icon: MonitorPlay },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const [currentYear, setCurrentYear] = React.useState<number | null>(null);

  React.useEffect(() => {
    // This effect runs only on the client, after hydration
    setCurrentYear(new Date().getFullYear());
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <>
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Landmark className="w-8 h-8 text-sidebar-primary" />
          <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Academica
          </h1>
        </Link>
        <div className="md:hidden"> {/* Show trigger only on mobile */}
            <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                className={cn(
                  'justify-start',
                  (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
                tooltip={{ children: item.label, side: 'right' }}
              >
                <Link href={item.href}>
                  <item.icon className="w-5 h-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
         <div className="group-data-[collapsible=icon]:hidden text-xs text-sidebar-foreground/70">
            {currentYear !== null ? `© ${currentYear} Academica` : `© Academica`}
         </div>
      </SidebarFooter>
    </>
  );
}
