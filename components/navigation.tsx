'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Menu, FileText, Info } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const isChat = pathname.startsWith('/chat');

  const navItems = [
    { id: 'docs', href: '/docs', label: 'Documents', icon: FileText },
    { id: 'about', href: '/about', label: 'About', icon: Info }
  ];

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          className="font-semibold text-lg hover:opacity-80 transition-opacity"
        >
          Epstein Files Explorer
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => router.push(item.href)}
              className={isActive ? 'bg-accent' : ''}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </Button>
            );
          })}
          
          {!isChat && (
            <Button onClick={() => router.push('/chat')}>
              Start Chat
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          {!isChat && (
            <Button onClick={() => router.push('/chat')} size="sm">
              Start Chat
            </Button>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <button className="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>Select a page to navigate to</SheetDescription>
              <div className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'secondary' : 'ghost'}
                    onClick={() => router.push(item.href)}
                    className="justify-start"
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}