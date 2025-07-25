
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import {
  LayoutDashboard,
  School,
  UsersRound,
  CalendarDays,
  GraduationCap,
  ListChecks,
  MonitorPlay,
  ChevronLeft,
  Megaphone,
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/classrooms', label: 'Salas de Aula', icon: School },
  { href: '/classgroups', label: 'Turmas', icon: UsersRound },
  { href: '/room-availability', label: 'Disponibilidade', icon: CalendarDays },
  { href: '/reservations', label: 'Reservas', icon: ListChecks },
  { href: '/announcements', label: 'Anúncios', icon: Megaphone },
  { href: '/tv-display', label: 'Painel TV', icon: MonitorPlay },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const { state, toggleSidebar } = useSidebar();

  return (
    <>
      <SidebarHeader className="p-4 flex items-center justify-between border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-sidebar-primary group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:h-6 transition-all" />
          <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Academica
          </h1>
        </Link>
        <div className="md:hidden">
            <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                className={cn(
                  'justify-start rounded-md text-sm font-medium', // Consistent styling
                  (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground' // Active state uses sidebar-primary
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground' // Default and hover states
                )}
                tooltip={{ children: item.label, side: 'right' }}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4 mr-2 group-data-[collapsible=icon]:mr-0" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-sidebar-border mt-auto">
         <div className="group-data-[collapsible=icon]:hidden text-xs text-sidebar-foreground/70 text-center pb-2">
            © {currentYear} Academica
         </div>
         <SidebarMenu>
           <SidebarMenuItem>
             <SidebarMenuButton 
                onClick={toggleSidebar}
                className="hidden md:flex"
                tooltip={{children: state === 'expanded' ? 'Recolher' : 'Expandir', side: 'right'}}
             >
                <ChevronLeft className={cn("transition-transform duration-300", state === 'collapsed' && 'rotate-180')} />
                <span className="group-data-[collapsible=icon]:hidden">Recolher</span>
             </SidebarMenuButton>
           </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
