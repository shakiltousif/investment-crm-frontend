import axios from 'axios';
import { api } from '@/lib/api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  describe('Authentication API', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            user: { id: '1', email: 'test@example.com' },
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await api.auth.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should register successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            user: { id: '1', email: 'test@example.com' },
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await api.auth.register({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/register', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle login error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(
        api.auth.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Portfolio API', () => {
    it('should get portfolios successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: '1', name: 'Portfolio 1', totalValue: 10000 },
            { id: '2', name: 'Portfolio 2', totalValue: 5000 },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await api.portfolio.getPortfolios();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/portfolios');
      expect(result).toEqual(mockResponse);
    });

    it('should create portfolio successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '1',
            name: 'New Portfolio',
            totalValue: 5000,
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await api.portfolio.createPortfolio({
        name: 'New Portfolio',
        description: 'A new portfolio',
        totalValue: 5000,
        totalInvested: 4500,
        totalGain: 500,
        gainPercentage: 11.11,
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/portfolios', {
        name: 'New Portfolio',
        description: 'A new portfolio',
        totalValue: 5000,
        totalInvested: 4500,
        totalGain: 500,
        gainPercentage: 11.11,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should update portfolio successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '1',
            name: 'Updated Portfolio',
            totalValue: 6000,
          },
        },
      };

      mockedAxios.put.mockResolvedValueOnce(mockResponse);

      const result = await api.portfolio.updatePortfolio('1', {
        name: 'Updated Portfolio',
        totalValue: 6000,
      });

      expect(mockedAxios.put).toHaveBeenCalledWith('/api/portfolios/1', {
        name: 'Updated Portfolio',
        totalValue: 6000,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should delete portfolio successfully', async () => {
      mockedAxios.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await api.portfolio.deletePortfolio('1');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/portfolios/1');
      expect(result.data.success).toBe(true);
    });
  });

  describe('Investment API', () => {
    it('should get investments successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: '1', name: 'Netflix', symbol: 'NFLX', quantity: 5 },
            { id: '2', name: 'Apple', symbol: 'AAPL', quantity: 10 },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await api.investment.getInvestments();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/investments');
      expect(result).toEqual(mockResponse);
    });

    it('should buy investment successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            transaction: { id: 'tx-1', amount: 2250, status: 'COMPLETED' },
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await api.investment.buy({
        investmentId: '1',
        quantity: 5,
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/investments/buy', {
        investmentId: '1',
        quantity: 5,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should sell investment successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            transaction: { id: 'tx-2', amount: 445.5, status: 'COMPLETED' },
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await api.investment.sell({
        investmentId: '1',
        quantity: 1,
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/investments/sell', {
        investmentId: '1',
        quantity: 1,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get buy preview successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            totalCost: 2250,
            fee: 22.5,
            totalAmount: 2272.5,
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await api.investment.buyPreview({
        investmentId: '1',
        quantity: 5,
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/investments/buy-preview', {
        investmentId: '1',
        quantity: 5,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get sell preview successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            proceeds: 450,
            fee: 4.5,
            netProceeds: 445.5,
            gainLoss: 50,
            returnPercent: 12.5,
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await api.investment.sellPreview({
        investmentId: '1',
        quantity: 1,
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/investments/sell-preview', {
        investmentId: '1',
        quantity: 1,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Transaction API', () => {
    it('should get transactions successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: '1', type: 'BUY', amount: 2250, status: 'COMPLETED' },
            { id: '2', type: 'SELL', amount: -445.5, status: 'COMPLETED' },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await api.transaction.getTransactions();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/transactions');
      expect(result).toEqual(mockResponse);
    });

    it('should get transactions with filters', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: '1', type: 'BUY', amount: 2250, status: 'COMPLETED' },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await api.transaction.getTransactions({
        type: 'BUY',
        status: 'COMPLETED',
        startDate: '2025-10-01',
        endDate: '2025-10-31',
      });

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/transactions', {
        params: {
          type: 'BUY',
          status: 'COMPLETED',
          startDate: '2025-10-01',
          endDate: '2025-10-31',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should export transactions successfully', async () => {
      const mockResponse = {
        data: 'csv,data,here',
        headers: {
          'content-type': 'text/csv',
          'content-disposition': 'attachment; filename="transactions.csv"',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await api.transaction.exportTransactions();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/transactions/export', {
        responseType: 'blob',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Bank Account API', () => {
    it('should get bank accounts successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: '1', bankName: 'Test Bank', accountNumber: '****7890' },
            { id: '2', bankName: 'Chase Bank', accountNumber: '****3210' },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await api.bankAccount.getBankAccounts();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/bank-accounts');
      expect(result).toEqual(mockResponse);
    });

    it('should create bank account successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '1',
            bankName: 'New Bank',
            accountNumber: '9876543210',
            isVerified: false,
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await api.bankAccount.createBankAccount({
        accountHolderName: 'John Doe',
        accountNumber: '9876543210',
        bankName: 'New Bank',
        bankCode: 'NB',
        accountType: 'CHECKING',
        currency: 'USD',
        balance: 1000,
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/bank-accounts', {
        accountHolderName: 'John Doe',
        accountNumber: '9876543210',
        bankName: 'New Bank',
        bankCode: 'NB',
        accountType: 'CHECKING',
        currency: 'USD',
        balance: 1000,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should update bank account successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '1',
            bankName: 'Updated Bank',
            accountNumber: '9876543210',
          },
        },
      };

      mockedAxios.put.mockResolvedValueOnce(mockResponse);

      const result = await api.bankAccount.updateBankAccount('1', {
        bankName: 'Updated Bank',
      });

      expect(mockedAxios.put).toHaveBeenCalledWith('/api/bank-accounts/1', {
        bankName: 'Updated Bank',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should delete bank account successfully', async () => {
      mockedAxios.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await api.bankAccount.deleteBankAccount('1');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/bank-accounts/1');
      expect(result.data.success).toBe(true);
    });

    it('should verify bank account successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '1',
            isVerified: true,
            verifiedAt: '2025-10-22T00:00:00Z',
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await api.bankAccount.verifyBankAccount('1');

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/bank-accounts/1/verify');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('User API', () => {
    it('should get user profile successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await api.user.getProfile();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/users/profile');
      expect(result).toEqual(mockResponse);
    });

    it('should update user profile successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '1',
            firstName: 'Jane',
            lastName: 'Smith',
          },
        },
      };

      mockedAxios.put.mockResolvedValueOnce(mockResponse);

      const result = await api.user.updateProfile({
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(mockedAxios.put).toHaveBeenCalledWith('/api/users/profile', {
        firstName: 'Jane',
        lastName: 'Smith',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Marketplace API', () => {
    it('should get marketplace investments successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: '1', name: 'Netflix', symbol: 'NFLX', currentPrice: 450 },
            { id: '2', name: 'Apple', symbol: 'AAPL', currentPrice: 175.5 },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await api.marketplace.getInvestments();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/marketplace/investments');
      expect(result).toEqual(mockResponse);
    });

    it('should create marketplace item successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '1',
            name: 'New Investment',
            symbol: 'NEW',
            currentPrice: 100,
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await api.marketplace.createItem({
        name: 'New Investment',
        symbol: 'NEW',
        type: 'STOCK',
        currentPrice: 100,
        minimumInvestment: 50,
        currency: 'USD',
        riskLevel: 'MEDIUM',
        category: 'Technology',
        issuer: 'New Corp',
        isAvailable: true,
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/marketplace/items', {
        name: 'New Investment',
        symbol: 'NEW',
        type: 'STOCK',
        currentPrice: 100,
        minimumInvestment: 50,
        currency: 'USD',
        riskLevel: 'MEDIUM',
        category: 'Technology',
        issuer: 'New Corp',
        isAvailable: true,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should update marketplace item successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '1',
            name: 'Updated Investment',
            currentPrice: 110,
          },
        },
      };

      mockedAxios.put.mockResolvedValueOnce(mockResponse);

      const result = await api.marketplace.updateItem('1', {
        name: 'Updated Investment',
        currentPrice: 110,
      });

      expect(mockedAxios.put).toHaveBeenCalledWith('/api/marketplace/items/1', {
        name: 'Updated Investment',
        currentPrice: 110,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should delete marketplace item successfully', async () => {
      mockedAxios.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await api.marketplace.deleteItem('1');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/marketplace/items/1');
      expect(result.data.success).toBe(true);
    });

    it('should get marketplace item by ID successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '1',
            name: 'Netflix',
            symbol: 'NFLX',
            currentPrice: 450,
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await api.marketplace.getItem('1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/marketplace/items/1');
      expect(result).toEqual(mockResponse);
    });

    it('should update live prices successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            updated: 5,
            failed: 0,
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await api.marketplace.updatePrices();

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/marketplace/update-prices');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Quotes API', () => {
    it('should get single quote successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            symbol: 'NFLX',
            price: 450,
            change: 5,
            changePercent: 1.11,
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await api.quotes.getQuote('NFLX');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/quotes/NFLX');
      expect(result).toEqual(mockResponse);
    });

    it('should get batch quotes successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            NFLX: { price: 450, change: 5 },
            AAPL: { price: 175.5, change: 2.5 },
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await api.quotes.getBatchQuotes(['NFLX', 'AAPL']);

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/quotes/batch', {
        symbols: ['NFLX', 'AAPL'],
      });
      expect(result).toEqual(mockResponse);
    });

    it('should search symbols successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            { symbol: 'NFLX', name: 'Netflix Inc.' },
            { symbol: 'NFLX2', name: 'Netflix Inc. Class 2' },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await api.quotes.searchSymbols('NFLX');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/quotes/search', {
        params: { q: 'NFLX' },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 unauthorized error', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(api.portfolio.getPortfolios()).rejects.toEqual(error);
    });

    it('should handle 403 forbidden error', async () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(
        api.portfolio.createPortfolio({
          name: 'Test',
          totalValue: 1000,
          totalInvested: 900,
          totalGain: 100,
          gainPercentage: 11.11,
        })
      ).rejects.toEqual(error);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(api.investment.getInvestments()).rejects.toEqual(error);
    });

    it('should handle network error', async () => {
      const error = new Error('Network Error');

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(api.transaction.getTransactions()).rejects.toThrow('Network Error');
    });
  });
});
