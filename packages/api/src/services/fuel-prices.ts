import api from '../client';

export type FuelDirection = 'up' | 'down' | 'same';

export interface FuelSourceFile {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
}

export interface UpcomingFuelPrice {
  pricePerLiter: string;
  currency: string;
  effectiveDate: string;
  recordedDate: string;
  change: number;
  direction: FuelDirection;
  sourceFile: FuelSourceFile | null;
  note?: string;
}

export interface CurrentFuelPrice {
  fuelType: string;
  pricePerLiter: string | null;
  currency?: string;
  effectiveDate?: string;
  recordedDate?: string;
  change?: number;
  direction?: FuelDirection;
  sourceFile?: FuelSourceFile | null;
  note?: string;
  upcoming?: UpcomingFuelPrice | null;
}

export interface FuelPriceRecord {
  id: string;
  fuelType: string;
  pricePerLiter: string;
  currency: string;
  effectiveDate: string;
  recordedDate: string;
  change?: number;
  direction?: FuelDirection;
  sourceFileId: string | null;
  note?: string;
  createdAt: string;
  updatedAt: string;
  sourceFile: FuelSourceFile | null;
}

export interface FuelPricePoint {
  pricePerLiter: string;
  effectiveDate: string;
}

export interface FuelPriceExtreme {
  amount: number;
  previousPrice: string;
  newPrice: string;
  effectiveDate: string;
}

export interface FuelPriceStats {
  fuelType: string;
  recordCount: number;
  firstRecordedDate: string | null;
  current: FuelPricePoint | null;
  allTimeHigh: FuelPricePoint | null;
  allTimeLow: FuelPricePoint | null;
  yearOverYear: unknown | null;
  biggestIncrease: FuelPriceExtreme | null;
  biggestDrop: FuelPriceExtreme | null;
  average: { year: number; pricePerLiter: number } | null;
}

export interface BulkFuelPricePayload {
  effectiveDate: string;
  recordedDate: string;
  sourceFileId?: string;
  note?: string;
  prices: { fuelType: string; pricePerLiter: number }[];
}

export async function createFuelPricesBulk(payload: BulkFuelPricePayload): Promise<any> {
  const { data } = await api.post('/api/tugezo/fuel-prices/bulk', payload);
  return data;
}

export async function deleteFuelPrice(id: string): Promise<any> {
  const { data } = await api.delete(`/api/tugezo/fuel-prices/${id}`);
  return data;
}

export async function getCurrentFuelPrices(): Promise<CurrentFuelPrice[]> {
  const { data } = await api.get('/api/tugezo/fuel-prices/current');
  return data.data;
}

export async function getUpcomingFuelPrices(): Promise<FuelPriceRecord[]> {
  const { data } = await api.get('/api/tugezo/fuel-prices/upcoming');
  return data.data;
}

export async function getFuelPriceHistory(params?: {
  from?: string;
  to?: string;
  fuelType?: string;
  year?: number;
  direction?: FuelDirection;
  order?: 'asc' | 'desc';
}): Promise<FuelPriceRecord[]> {
  const hasParams =
    params &&
    (params.from ||
      params.to ||
      params.fuelType ||
      params.year ||
      params.direction ||
      params.order);
  const { data } = await api.get('/api/tugezo/fuel-prices/history', {
    params: hasParams ? params : undefined,
  });
  return data.data;
}

export async function getFuelPriceStats(params?: {
  year?: number;
  fuelType?: string;
}): Promise<FuelPriceStats> {
  const { data } = await api.get('/api/tugezo/fuel-prices/stats', {
    params: params && (params.year || params.fuelType) ? params : undefined,
  });
  return data.data;
}
