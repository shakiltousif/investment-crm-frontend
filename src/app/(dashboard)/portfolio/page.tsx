'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import PortfolioForm from '@/components/PortfolioForm';

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  gainPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PortfolioPage() {
  const { isAuthenticated } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPortfolios();
    }
  }, [isAuthenticated]);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      setError('');
      try {
        const response = await api.portfolios.getAll();
        setPortfolios(response.data);
      } catch (apiErr) {
        console.warn('Portfolios API not available:', apiErr);
        // Use mock data for demo purposes
        const mockPortfolios: Portfolio[] = [
          {
            id: '1',
            name: 'Growth Portfolio',
            description: 'High-growth stocks and technology investments',
            totalValue: 125000,
            totalInvested: 100000,
            totalGain: 25000,
            gainPercentage: 25.0,
            isActive: true,
            createdAt: '2023-01-15T00:00:00Z',
            updatedAt: '2023-12-01T00:00:00Z'
          },
          {
            id: '2',
            name: 'Tech Portfolio',
            description: 'Technology sector focused investments',
            totalValue: 75000,
            totalInvested: 80000,
            totalGain: -5000,
            gainPercentage: -6.25,
            isActive: true,
            createdAt: '2023-03-20T00:00:00Z',
            updatedAt: '2023-12-01T00:00:00Z'
          },
          {
            id: '3',
            name: 'Conservative Portfolio',
            description: 'Low-risk bonds and stable investments',
            totalValue: 50000,
            totalInvested: 48000,
            totalGain: 2000,
            gainPercentage: 4.17,
            isActive: true,
            createdAt: '2023-06-10T00:00:00Z',
            updatedAt: '2023-12-01T00:00:00Z'
          }
        ];
        setPortfolios(mockPortfolios);
      }
    } catch (err: any) {
      console.error('Portfolio fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = () => {
    setEditingPortfolio(null);
    setShowForm(true);
  };

  const handleEditPortfolio = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setShowForm(true);
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm('Are you sure you want to delete this portfolio?')) {
      return;
    }

    try {
      await api.portfolios.delete(id);
      await fetchPortfolios();
    } catch (err: any) {
      console.error('Portfolio delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete portfolio');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingPortfolio(null);
    fetchPortfolios();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPortfolio(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portfolios...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Portfolios</h1>
        <button
          onClick={handleCreatePortfolio}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Create Portfolio
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchPortfolios}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingPortfolio ? 'Edit Portfolio' : 'Create New Portfolio'}
          </h2>
          <PortfolioForm
            initialData={editingPortfolio}
            isEditing={!!editingPortfolio}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      {portfolios.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolios found</h3>
          <p className="text-gray-600 mb-4">Create your first portfolio to start tracking your investments.</p>
          <button
            onClick={handleCreatePortfolio}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Create Portfolio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <div key={portfolio.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{portfolio.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditPortfolio(portfolio)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePortfolio(portfolio.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {portfolio.description && (
                <p className="text-gray-600 text-sm mb-4">{portfolio.description}</p>
              )}

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Total Value:</span>
                  <span className="font-medium">${portfolio.totalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Total Invested:</span>
                  <span className="font-medium">${portfolio.totalInvested.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Total Gain:</span>
                  <span className={`font-medium ${portfolio.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${portfolio.totalGain.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Gain %:</span>
                  <span className={`font-medium ${portfolio.gainPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {portfolio.gainPercentage.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Created: {new Date(portfolio.createdAt).toLocaleDateString()}</span>
                  <span className={portfolio.isActive ? 'text-green-600' : 'text-red-600'}>
                    {portfolio.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

