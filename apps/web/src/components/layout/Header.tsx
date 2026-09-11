import { useAuthStore } from '../../stores/authStore';

export default function Header() {
  const { user } = useAuthStore();

  return (
    <header className="h-14 border-b bg-card flex items-center justify-end px-6">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
          {user?.fullName?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  );
}
