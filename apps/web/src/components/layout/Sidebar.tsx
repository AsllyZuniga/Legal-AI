import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  LayoutDashboard, MessageSquare, FolderOpen,
  Newspaper, LogOut, Scale, Folder
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'Chat Juridico' },
  { to: '/cases', icon: FolderOpen, label: 'Mis Casos' },
  { to: '/templates', icon: Folder, label: 'Biblioteca Juridica' },
  { to: '/news', icon: Newspaper, label: 'Noticias Juridicas' },
];

export default function Sidebar() {
  const { logout, user } = useAuthStore();

  return (
    <aside className="w-64 bg-primary text-primary-foreground flex flex-col">
      <div className="p-4 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6" />
          <span className="font-bold text-lg">Legal AI</span>
        </div>
        <p className="text-xs text-primary-foreground/60 mt-1">Asistente Jurídico</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-primary-foreground/10 text-primary-foreground font-medium'
                  : 'text-primary-foreground/70 hover:bg-primary-foreground/5 hover:text-primary-foreground'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}

      </nav>

      <div className="p-3 border-t border-primary/20">
        <div className="text-xs text-primary-foreground/60 mb-2">
          {user?.fullName || 'Usuario'}
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground w-full px-3 py-2 rounded-md hover:bg-primary-foreground/5"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
