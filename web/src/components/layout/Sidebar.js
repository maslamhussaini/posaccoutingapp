'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
  AiOutlineHome as HomeIcon,
  AiOutlineShopping as ShoppingBagIcon,
  AiOutlineTag as TagIcon,
  AiOutlineCar as TruckIcon,
  AiOutlineUser as UsersIcon,
  AiOutlineFileText as ClipboardDocumentListIcon,
  AiOutlineDollar as BanknotesIcon,
  AiOutlineBarChart as ChartBarIcon,
  AiOutlineSetting as Cog6ToothIcon,
  AiOutlineClose as XMarkIcon
} from 'react-icons/ai';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'POS', href: '/pos', icon: BanknotesIcon },
  { name: 'Products', href: '/products', icon: ShoppingBagIcon },
  { name: 'Categories', href: '/categories', icon: TagIcon },
  { name: 'Suppliers', href: '/suppliers', icon: TruckIcon },
  { name: 'Customers', href: '/customers', icon: UsersIcon },
  { name: 'Purchases', href: '/purchases', icon: ClipboardDocumentListIcon },
  { name: 'Sales', href: '/sales', icon: BanknotesIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">POS System</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  pathname === item.href
                    ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-4 py-3 text-sm font-medium'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:bg-white lg:shadow-lg">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 border-b bg-blue-600">
            <h1 className="text-xl font-bold text-white">POS System</h1>
          </div>
          <nav className="flex-1 mt-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  pathname === item.href
                    ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-4 py-3 text-sm font-medium'
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="border-t p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}