import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import SidebarNav from './SidebarNav';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <div className="min-h-screen p-4 md:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
