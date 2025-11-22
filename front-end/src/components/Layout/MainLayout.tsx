import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Package,
  LayoutDashboard,
  FileText,
  TruckIcon,
  ArrowLeftRight,
  FileEdit,
  Box,
  Warehouse,
  History,
  Settings,
  User,
  LogOut,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    name: 'Operations',
    icon: FileText,
    children: [
      { name: 'Receipts', href: '/operations/receipts', icon: FileText },
      { name: 'Deliveries', href: '/operations/deliveries', icon: TruckIcon },
      { name: 'Transfers', href: '/operations/transfers', icon: ArrowLeftRight },
      { name: 'Adjustments', href: '/operations/adjustments', icon: FileEdit },
    ],
  },
  { name: 'Products', href: '/products', icon: Box },
  { name: 'Stock', href: '/stock', icon: Warehouse },
  { name: 'Move History', href: '/move-history', icon: History },
  {
    name: 'Settings',
    icon: Settings,
    children: [
      { name: 'Warehouses', href: '/settings/warehouses' },
      { name: 'Locations', href: '/settings/locations' },
    ],
  },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="flex h-16 items-center px-4 gap-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg">StockMaster</span>
          </Link>

          <nav className="flex-1 flex items-center gap-1 ml-6">
            {navigation.map((item) => {
              if (item.children) {
                return (
                  <DropdownMenu key={item.name}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'gap-2',
                          item.children.some((child) => isActive(child.href)) &&
                            'bg-accent text-accent-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {item.children.map((child) => (
                        <DropdownMenuItem key={child.href} asChild>
                          <Link
                            to={child.href}
                            className={cn(
                              'gap-2',
                              isActive(child.href) && 'bg-accent'
                            )}
                          >
                            {child.icon && <child.icon className="h-4 w-4" />}
                            {child.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  size="sm"
                  asChild
                  className={cn('gap-2', isActive(item.href) && 'bg-accent text-accent-foreground')}
                >
                  <Link to={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              );
            })}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
