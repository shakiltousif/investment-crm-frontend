import { z } from 'zod';

// User schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

// Portfolio schemas
export const portfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  totalValue: z.union([z.string(), z.number()]).transform((val) => val === '' ? undefined : Number(val)).pipe(z.number().min(0, 'Total value must be non-negative')).optional(),
  totalInvested: z.union([z.string(), z.number()]).transform((val) => val === '' ? undefined : Number(val)).pipe(z.number().min(0, 'Total invested must be non-negative')).optional(),
  totalGain: z.union([z.string(), z.number()]).transform((val) => val === '' ? undefined : Number(val)).pipe(z.number()).optional(),
  gainPercentage: z.union([z.string(), z.number()]).transform((val) => val === '' ? undefined : Number(val)).pipe(z.number().min(-100, 'Gain percentage cannot be less than -100%')).optional(),
}).refine((data) => {
  // If both totalValue and totalInvested are provided, validate totalGain calculation
  if (data.totalValue !== undefined && data.totalInvested !== undefined) {
    const calculatedGain = data.totalValue - data.totalInvested;
    if (data.totalGain !== undefined && Math.abs(data.totalGain - calculatedGain) > 0.01) {
      return false;
    }
  }
  return true;
}, {
  message: 'Total gain must match the difference between total value and total invested',
  path: ['totalGain'],
}).refine((data) => {
  // If both totalInvested and gainPercentage are provided, validate calculation
  if (data.totalInvested !== undefined && data.gainPercentage !== undefined && data.totalInvested > 0) {
    const calculatedGainPercentage = ((data.totalValue || 0) - data.totalInvested) / data.totalInvested * 100;
    if (Math.abs(data.gainPercentage - calculatedGainPercentage) > 0.01) {
      return false;
    }
  }
  return true;
}, {
  message: 'Gain percentage must match the calculated percentage based on total value and invested amount',
  path: ['gainPercentage'],
});

// Bank Account schemas
export const bankAccountSchema = z.object({
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  bankCode: z.string().optional(),
  accountType: z.string().min(1, 'Account type is required'),
  currency: z.string().min(1, 'Currency is required'),
});

// Investment schemas
export const buyInvestmentSchema = z.object({
  investmentId: z.string().min(1, 'Investment ID is required'),
  portfolioId: z.string().min(1, 'Portfolio is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  purchasePrice: z.number().min(0.01, 'Purchase price must be greater than 0'),
  bankAccountId: z.string().min(1, 'Bank account is required'),
});

export const sellInvestmentSchema = z.object({
  investmentId: z.string().min(1, 'Investment ID is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  sellPrice: z.number().min(0.01, 'Sell price must be greater than 0'),
  bankAccountId: z.string().min(1, 'Bank account is required'),
});

// Transaction schemas
export const depositSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().min(1, 'Currency is required'),
  bankAccountId: z.string().min(1, 'Bank account is required'),
  transferMethod: z.string().min(1, 'Transfer method is required'),
  description: z.string().optional(),
});

export const withdrawalSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().min(1, 'Currency is required'),
  bankAccountId: z.string().min(1, 'Bank account is required'),
  description: z.string().optional(),
});

// Two-Factor Authentication schemas
export const twoFactorSetupSchema = z.object({
  secret: z.string().min(1, 'Secret is required'),
  token: z.string().min(6, 'Token must be 6 digits').max(6, 'Token must be 6 digits'),
});

export const twoFactorVerifySchema = z.object({
  token: z.string().min(6, 'Token must be 6 digits').max(6, 'Token must be 6 digits'),
});

// Filter schemas
export const transactionFilterSchema = z.object({
  type: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export const investmentFilterSchema = z.object({
  portfolioId: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export const marketplaceFilterSchema = z.object({
  type: z.string().optional(),
  riskLevel: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PortfolioInput = z.infer<typeof portfolioSchema>;
export type BankAccountInput = z.infer<typeof bankAccountSchema>;
export type BuyInvestmentInput = z.infer<typeof buyInvestmentSchema>;
export type SellInvestmentInput = z.infer<typeof sellInvestmentSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
export type TwoFactorSetupInput = z.infer<typeof twoFactorSetupSchema>;
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;
export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;
export type InvestmentFilterInput = z.infer<typeof investmentFilterSchema>;
export type MarketplaceFilterInput = z.infer<typeof marketplaceFilterSchema>;
