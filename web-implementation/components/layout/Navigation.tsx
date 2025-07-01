// components/layout/Navigation.tsx - Main navigation header
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChartBarIcon, 
  CpuChipIcon, 
  DocumentTextIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function Navigation() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: ChartBarIcon },
    { name: 'Tools', href: '/tools', icon: CpuChipIcon },
    { name: 'Curator', href: '/curator', icon: MagnifyingGlassIcon },
    { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <CpuChipIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                AI Intelligence
              </span>
            </Link>
          </div>

          <div className="flex space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="text-sm text-gray-500">
            Curation Interface
          </div>
        </div>
      </div>
    </nav>
  );
}