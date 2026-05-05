import type { ChannelData, KPIData, KPITarget, QuarterData } from '@/types'

export { mockKPIData as mockKPI }

export const mockKPIData: KPIData = {
  ttv: 180_000_000_000,
  revenue: 75_000_000_000,
  roomNights: 1_720_000,
  bookings: 85_000,
  ttvYoY: 8.3,
  ttvMoM: 3.1,
  ttvWoW: 1.8,
  revenueYoY: 7.5,
  revenueMoM: 2.8,
  revenueWoW: 1.2,
  roomNightsYoY: 6.2,
  roomNightsMoM: 4.5,
  roomNightsWoW: 2.1,
  bookingsYoY: 5.8,
  bookingsMoM: 3.9,
  bookingsWoW: -1.4,
}

export const mockKPITargets: KPITarget = {
  annualTTV: 240_000_000_000,
  annualRevenue: 100_000_000_000,
  annualRoomNights: 2_300_000,
  quarters: {
    q1: { target: 52_000_000_000, current: 54_200_000_000 },
    q2: { target: 58_000_000_000, current: 61_800_000_000 },
    q3: { target: 68_000_000_000, current: 64_000_000_000 },
    q4: { target: 62_000_000_000, current: 0 },
  },
}

export const mockChannelData: ChannelData[] = [
  {
    channel: 'OTA',
    ttv: 108_000_000_000,
    revenue: 43_200_000_000,
    roomNights: 1_032_000,
    mixPercent: 60,
  },
  {
    channel: 'API',
    ttv: 50_400_000_000,
    revenue: 21_000_000_000,
    roomNights: 482_000,
    mixPercent: 28,
  },
  {
    channel: 'Wholesale',
    ttv: 21_600_000_000,
    revenue: 10_800_000_000,
    roomNights: 206_000,
    mixPercent: 12,
  },
]

export const mockQuarterData: QuarterData[] = [
  {
    quarter: 'Q1',
    totalTTV: 54_200_000_000,
    totalRevenue: 22_600_000_000,
    totalRoomNights: 520_000,
    months: [
      { month: 1, ttv: 16_800_000_000, revenue: 7_000_000_000, roomNights: 162_000 },
      { month: 2, ttv: 17_200_000_000, revenue: 7_200_000_000, roomNights: 168_000 },
      { month: 3, ttv: 20_200_000_000, revenue: 8_400_000_000, roomNights: 190_000 },
    ],
  },
  {
    quarter: 'Q2',
    totalTTV: 61_800_000_000,
    totalRevenue: 25_800_000_000,
    totalRoomNights: 590_000,
    months: [
      { month: 4, ttv: 19_500_000_000, revenue: 8_100_000_000, roomNights: 185_000 },
      { month: 5, ttv: 20_800_000_000, revenue: 8_700_000_000, roomNights: 198_000 },
      { month: 6, ttv: 21_500_000_000, revenue: 9_000_000_000, roomNights: 207_000 },
    ],
  },
  {
    quarter: 'Q3',
    totalTTV: 64_000_000_000,
    totalRevenue: 26_600_000_000,
    totalRoomNights: 610_000,
    months: [
      { month: 7, ttv: 22_500_000_000, revenue: 9_400_000_000, roomNights: 215_000 },
      { month: 8, ttv: 23_000_000_000, revenue: 9_600_000_000, roomNights: 220_000 },
      { month: 9, ttv: 18_500_000_000, revenue: 7_600_000_000, roomNights: 175_000 },
    ],
  },
  {
    quarter: 'Q4',
    totalTTV: 0,
    totalRevenue: 0,
    totalRoomNights: 0,
    months: [
      { month: 10, ttv: 0, revenue: 0, roomNights: 0 },
      { month: 11, ttv: 0, revenue: 0, roomNights: 0 },
      { month: 12, ttv: 0, revenue: 0, roomNights: 0 },
    ],
  },
]

export const mockTopDestinations: {
  country: string
  flag: string
  ttv: number
  roomNights: number
  growth: number
}[] = [
  { country: 'Japan', flag: '\u{1F1EF}\u{1F1F5}', ttv: 48_600_000_000, roomNights: 464_000, growth: 12.3 },
  { country: 'Thailand', flag: '\u{1F1F9}\u{1F1ED}', ttv: 27_000_000_000, roomNights: 258_000, growth: 9.1 },
  { country: 'South Korea', flag: '\u{1F1F0}\u{1F1F7}', ttv: 21_600_000_000, roomNights: 206_000, growth: 15.2 },
  { country: 'Indonesia', flag: '\u{1F1EE}\u{1F1E9}', ttv: 18_000_000_000, roomNights: 172_000, growth: 7.8 },
  { country: 'Vietnam', flag: '\u{1F1FB}\u{1F1F3}', ttv: 12_600_000_000, roomNights: 120_000, growth: 22.5 },
]

export const mockYearlyData: Record<number, { ttv: number; revenue: number; roomNights: number }> = {
  2021: { ttv: 95_000_000_000, revenue: 38_000_000_000, roomNights: 920_000 },
  2022: { ttv: 120_000_000_000, revenue: 48_000_000_000, roomNights: 1_150_000 },
  2023: { ttv: 142_000_000_000, revenue: 57_000_000_000, roomNights: 1_380_000 },
  2024: { ttv: 162_000_000_000, revenue: 65_000_000_000, roomNights: 1_560_000 },
  2025: { ttv: 180_000_000_000, revenue: 75_000_000_000, roomNights: 1_720_000 },
  2026: { ttv: 180_000_000_000, revenue: 75_000_000_000, roomNights: 1_720_000 },
}

export const mockClientTTVShare = [
  { name: 'TravelPlanet', ttv: 18_000_000_000, percent: 10.0 },
  { name: 'AsiaTours', ttv: 14_400_000_000, percent: 8.0 },
  { name: 'OceanTravel', ttv: 12_600_000_000, percent: 7.0 },
  { name: 'SkyTravel', ttv: 10_800_000_000, percent: 6.0 },
  { name: 'PacificJourneys', ttv: 9_000_000_000, percent: 5.0 },
]

export const mockTopHotels: {
  name: string
  location: string
  grade: string
  ttv: number
  roomNights: number
  rankChange: number
}[] = [
  { name: 'The Ritz-Carlton Tokyo', location: 'Tokyo, Japan', grade: '5-Star', ttv: 3_200_000_000, roomNights: 18_500, rankChange: 0 },
  { name: 'Mandarin Oriental Bangkok', location: 'Bangkok, Thailand', grade: '5-Star', ttv: 2_800_000_000, roomNights: 16_200, rankChange: 2 },
  { name: 'Park Hyatt Seoul', location: 'Seoul, South Korea', grade: '5-Star', ttv: 2_500_000_000, roomNights: 14_800, rankChange: -1 },
  { name: 'Aman Tokyo', location: 'Tokyo, Japan', grade: 'Luxury', ttv: 2_200_000_000, roomNights: 8_400, rankChange: 1 },
  { name: 'Four Seasons Bali', location: 'Bali, Indonesia', grade: '5-Star', ttv: 1_900_000_000, roomNights: 12_600, rankChange: -2 },
]
