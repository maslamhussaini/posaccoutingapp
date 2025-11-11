'use client';

import { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
  AiOutlineDollarCircle as CurrencyDollarIcon,
  AiOutlineShoppingCart as ShoppingBagIcon,
  AiOutlineUser as UsersIcon,
  AiOutlineBarChart as ChartBarIcon
} from 'react-icons/ai';

const getStats = (dashboardData) => [
  {
    name: 'Total Sales',
    value: dashboardData?.summary?.sales?.totalSales || 0,
    icon: CurrencyDollarIcon,
    color: 'text-green-600'
  },
  {
    name: 'Total Products',
    value: dashboardData?.summary?.inventory?.totalProducts || 0,
    icon: ShoppingBagIcon,
    color: 'text-blue-600'
  },
  {
    name: 'Net Revenue',
    value: `$${dashboardData?.summary?.sales?.netRevenue || 0}`,
    icon: UsersIcon,
    color: 'text-purple-600'
  },
  {
    name: 'Low Stock Items',
    value: dashboardData?.summary?.inventory?.lowStockItems || 0,
    icon: ChartBarIcon,
    color: 'text-orange-600'
  },
];

export default function DashboardContent() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set default data since reports API is disabled
    setDashboardData({
      summary: {
        sales: { totalRevenue: 0, totalSales: 0, netRevenue: 0 },
        inventory: { totalProducts: 0, totalValue: 0, lowStockItems: 0 },
        profitLoss: { totalRevenue: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0 }
      }
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {getStats(null).map((stat, index) => (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                  <div className="ml-5 flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Welcome to your POS system dashboard
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {getStats(dashboardData).map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="ml-5 flex-1 min-w-0">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900 mt-1">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div>
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Activity
            </h3>
            <div className="mt-5">
              <div className="text-center py-12">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No activity yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by making your first sale or adding products.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}