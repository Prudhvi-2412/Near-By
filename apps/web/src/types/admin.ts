export interface PlatformAnalytics {
  totalUsers: number;
  totalProviders: number;
  activeBookings: number;
  completedBookings: number;
  totalRevenue: number;
  pendingVerifications: number;
  openDisputes: number;
  openReports: number;
  bookingTrends: { date: string; bookings: number; revenue: number }[];
  topProviders: { id: string; displayName: string; city: string; completedBookingsCount: number; ratingAverage: string | number }[];
  today: {
    date: string;
    bookingsCreated: number;
    bookingsCompleted: number;
    paymentsVerified: number;
    ratingsSubmitted: number;
    revenueToday: number;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  createdAt: string;
  roles: { role: { name: string } }[];
  providerProfile: { displayName: string; city: string } | null;
}
