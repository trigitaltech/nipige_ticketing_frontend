import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar as ShadSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  {
    name: 'Dashboard',
    path: '/',
    match: (pathname) => pathname === '/',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="none" stroke="currentColor" strokeWidth="2" d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5ZM4 16a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3Zm10-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-6Z" />
      </svg>
    ),
  },
  {
    name: 'Tasks',
    path: '/tasks',
    match: (pathname, state) => (pathname.startsWith('/tasks') || pathname.startsWith('/tickets')) && state?.from !== '/weekly-tasks',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 13 2 2 4-4" />
      </svg>
    ),
  },
  {
    name: 'Projects',
    path: '/projects',
    match: (pathname) => pathname.startsWith('/projects'),
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 642">
        <path fill="currentColor" d="M680 221v120c-95 35-213 55-340 55S95 376 0 341V221c0-22 18-40 40-40h165v-30c0-46 38-85 85-85h100c47 0 85 39 85 85v30h165c22 0 40 18 40 40zm-425-70v30h170v-30c0-19-16-35-35-35H290c-19 0-35 16-35 35zm35 183v20c0 6 4 10 10 10h80c6 0 10-4 10-10v-20c0-6-4-10-10-10h-80c-6 0-10 4-10 10zM0 602V384c96 33 213 52 340 52s244-19 340-52v218c0 22-18 40-40 40H40c-22 0-40-18-40-40zm390-103v-20c0-6-4-10-10-10h-80c-6 0-10 4-10 10v20c0 6 4 10 10 10h80c6 0 10-4 10-10z" />
      </svg>
    ),
  },
  {
    name: 'Weekly Tasks',
    path: '/weekly-tasks',
    match: (pathname, state) => pathname.startsWith('/weekly-tasks') || (pathname.startsWith('/tickets') && state?.from === '/weekly-tasks'),
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: 'Team',
    disabled: true,
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    name: 'Settings',
    disabled: true,
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const SIDEBAR_BG = '#3B2FB1';

const itemBaseCls = 'h-11 rounded-lg text-[13px] font-medium transition-colors';
const itemIdleCls = 'text-white/75 cursor-pointer';
const itemActiveCls = '!bg-white/15 !text-white font-semibold ring-1 ring-inset ring-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]';
const itemDisabledCls = 'opacity-40 cursor-not-allowed text-white/60';

const Sidebar = ({ onLogout }) => {
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <ShadSidebar
      collapsible="icon"
      className="border-r-0 text-white [&_[data-slot=sidebar-inner]]:bg-[var(--sidebar-bg)] [&_[data-slot=sidebar-container]]:border-r-0"
      style={{
        '--sidebar-bg': SIDEBAR_BG,
        '--sidebar-accent': 'rgba(255, 255, 255, 0.1)',
        '--sidebar-accent-foreground': '#ffffff',
        '--sidebar-ring': 'rgba(255, 255, 255, 0.2)',
      }}
    >
      <SidebarHeader className="border-b border-white/10 pb-3" style={{ backgroundColor: SIDEBAR_BG }}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-default h-12 text-white hover:bg-transparent hover:text-white active:bg-transparent data-[state=open]:bg-transparent"
            >
              <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center text-white font-bold ring-1 ring-inset ring-white/20 shrink-0">
                T
              </div>
              <span className="text-[15px] font-bold text-white tracking-tight">TRIGITAL</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="pt-2" style={{ backgroundColor: SIDEBAR_BG }}>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold text-white/50 uppercase tracking-[0.08em] px-3 mb-1">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navItems.map((item) => {
                const isActive = !item.disabled && typeof item.match === 'function' && item.match(location.pathname, location.state);
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      tooltip={item.name}
                      isActive={isActive}
                      disabled={item.disabled}
                      onClick={() => !item.disabled && item.path && navigate(item.path)}
                      className={`${itemBaseCls} ${
                        isActive ? itemActiveCls : item.disabled ? itemDisabledCls : itemIdleCls
                      }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pt-2 pb-3 border-t border-white/10" style={{ backgroundColor: SIDEBAR_BG }}>
        <SidebarMenu className="gap-1.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={toggleSidebar}
              className={`${itemBaseCls} ${itemIdleCls}`}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
              <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={onLogout}
              className={`${itemBaseCls} text-white/75 hover:bg-red-500/20 hover:text-red-200 cursor-pointer`}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </ShadSidebar>
  );
};

export default Sidebar;
