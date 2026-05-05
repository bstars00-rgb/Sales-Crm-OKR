export interface CityData {
  name: string
  nameKo: string
  region: 'East Asia' | 'SE Asia' | 'South Asia' | 'Middle East' | 'Oceania'
  country: string
  lat: number
  lng: number
  ttv: number
  roomNights: number
  recentBookings: number
}

export interface RegionSummary {
  region: 'East Asia' | 'SE Asia' | 'South Asia' | 'Middle East' | 'Oceania'
  totalTTV: number
  totalRoomNights: number
  cityCount: number
  color: string
}

export const mockCityData: CityData[] = [
  // East Asia (8)
  { name: 'Seoul', nameKo: '서울', region: 'East Asia', country: '한국', lat: 37.5665, lng: 126.978, ttv: 8500000000, roomNights: 245000, recentBookings: 312 },
  { name: 'Busan', nameKo: '부산', region: 'East Asia', country: '한국', lat: 35.1796, lng: 129.0756, ttv: 3200000000, roomNights: 98000, recentBookings: 145 },
  { name: 'Tokyo', nameKo: '도쿄', region: 'East Asia', country: '일본', lat: 35.6762, lng: 139.6503, ttv: 12400000000, roomNights: 380000, recentBookings: 478 },
  { name: 'Osaka', nameKo: '오사카', region: 'East Asia', country: '일본', lat: 34.6937, lng: 135.5023, ttv: 6800000000, roomNights: 210000, recentBookings: 267 },
  { name: 'Beijing', nameKo: '베이징', region: 'East Asia', country: '중국', lat: 39.9042, lng: 116.4074, ttv: 5600000000, roomNights: 175000, recentBookings: 198 },
  { name: 'Shanghai', nameKo: '상하이', region: 'East Asia', country: '중국', lat: 31.2304, lng: 121.4737, ttv: 7200000000, roomNights: 225000, recentBookings: 289 },
  { name: 'Hong Kong', nameKo: '홍콩', region: 'East Asia', country: '홍콩', lat: 22.3193, lng: 114.1694, ttv: 4800000000, roomNights: 152000, recentBookings: 203 },
  { name: 'Taipei', nameKo: '타이베이', region: 'East Asia', country: '대만', lat: 25.033, lng: 121.5654, ttv: 3600000000, roomNights: 112000, recentBookings: 156 },

  // SE Asia (8)
  { name: 'Bangkok', nameKo: '방콕', region: 'SE Asia', country: '태국', lat: 13.7563, lng: 100.5018, ttv: 5400000000, roomNights: 185000, recentBookings: 234 },
  { name: 'Ho Chi Minh', nameKo: '호치민', region: 'SE Asia', country: '베트남', lat: 10.8231, lng: 106.6297, ttv: 2800000000, roomNights: 92000, recentBookings: 167 },
  { name: 'Hanoi', nameKo: '하노이', region: 'SE Asia', country: '베트남', lat: 21.0285, lng: 105.8542, ttv: 2100000000, roomNights: 68000, recentBookings: 98 },
  { name: 'Singapore', nameKo: '싱가포르', region: 'SE Asia', country: '싱가포르', lat: 1.3521, lng: 103.8198, ttv: 4500000000, roomNights: 145000, recentBookings: 189 },
  { name: 'Kuala Lumpur', nameKo: '쿠알라룸푸르', region: 'SE Asia', country: '말레이시아', lat: 3.139, lng: 101.6869, ttv: 3100000000, roomNights: 105000, recentBookings: 142 },
  { name: 'Jakarta', nameKo: '자카르타', region: 'SE Asia', country: '인도네시아', lat: -6.2088, lng: 106.8456, ttv: 2600000000, roomNights: 88000, recentBookings: 121 },
  { name: 'Manila', nameKo: '마닐라', region: 'SE Asia', country: '필리핀', lat: 14.5995, lng: 120.9842, ttv: 1900000000, roomNights: 62000, recentBookings: 87 },
  { name: 'Bali', nameKo: '발리', region: 'SE Asia', country: '인도네시아', lat: -8.3405, lng: 115.092, ttv: 3800000000, roomNights: 132000, recentBookings: 198 },

  // South Asia (5)
  { name: 'New Delhi', nameKo: '뉴델리', region: 'South Asia', country: '인도', lat: 28.6139, lng: 77.209, ttv: 3400000000, roomNights: 115000, recentBookings: 156 },
  { name: 'Mumbai', nameKo: '뭄바이', region: 'South Asia', country: '인도', lat: 19.076, lng: 72.8777, ttv: 2900000000, roomNights: 98000, recentBookings: 132 },
  { name: 'Colombo', nameKo: '콜롬보', region: 'South Asia', country: '스리랑카', lat: 6.9271, lng: 79.8612, ttv: 1200000000, roomNights: 42000, recentBookings: 58 },
  { name: 'Kathmandu', nameKo: '카트만두', region: 'South Asia', country: '네팔', lat: 27.7172, lng: 85.324, ttv: 680000000, roomNights: 24000, recentBookings: 32 },
  { name: 'Dhaka', nameKo: '다카', region: 'South Asia', country: '방글라데시', lat: 23.8103, lng: 90.4125, ttv: 520000000, roomNights: 18000, recentBookings: 24 },

  // Middle East (4)
  { name: 'Dubai', nameKo: '두바이', region: 'Middle East', country: 'UAE', lat: 25.2048, lng: 55.2708, ttv: 4200000000, roomNights: 138000, recentBookings: 187 },
  { name: 'Istanbul', nameKo: '이스탄불', region: 'Middle East', country: '튀르키예', lat: 41.0082, lng: 28.9784, ttv: 2800000000, roomNights: 95000, recentBookings: 134 },
  { name: 'Tashkent', nameKo: '타슈켄트', region: 'Middle East', country: '우즈베키스탄', lat: 41.2995, lng: 69.2401, ttv: 480000000, roomNights: 16000, recentBookings: 22 },
  { name: 'Almaty', nameKo: '알마티', region: 'Middle East', country: '카자흐스탄', lat: 43.2551, lng: 76.9126, ttv: 620000000, roomNights: 21000, recentBookings: 28 },

  // Oceania (5)
  { name: 'Sydney', nameKo: '시드니', region: 'Oceania', country: '호주', lat: -33.8688, lng: 151.2093, ttv: 3800000000, roomNights: 125000, recentBookings: 167 },
  { name: 'Melbourne', nameKo: '멜버른', region: 'Oceania', country: '호주', lat: -37.8136, lng: 144.9631, ttv: 2900000000, roomNights: 98000, recentBookings: 134 },
  { name: 'Auckland', nameKo: '오클랜드', region: 'Oceania', country: '뉴질랜드', lat: -36.8485, lng: 174.7633, ttv: 1600000000, roomNights: 52000, recentBookings: 72 },
  { name: 'Guam', nameKo: '괌', region: 'Oceania', country: '미국령', lat: 13.4443, lng: 144.7937, ttv: 1200000000, roomNights: 45000, recentBookings: 89 },
  { name: 'Saipan', nameKo: '사이판', region: 'Oceania', country: '미국령', lat: 15.1772, lng: 145.7505, ttv: 680000000, roomNights: 28000, recentBookings: 56 },
]

export const mockRegionSummary: RegionSummary[] = [
  { region: 'East Asia', totalTTV: 52100000000, totalRoomNights: 1597000, cityCount: 8, color: '#3b82f6' },
  { region: 'SE Asia', totalTTV: 26200000000, totalRoomNights: 877000, cityCount: 8, color: '#22c55e' },
  { region: 'South Asia', totalTTV: 8700000000, totalRoomNights: 297000, cityCount: 5, color: '#f97316' },
  { region: 'Middle East', totalTTV: 8100000000, totalRoomNights: 270000, cityCount: 4, color: '#a855f7' },
  { region: 'Oceania', totalTTV: 10180000000, totalRoomNights: 348000, cityCount: 5, color: '#06b6d4' },
]
