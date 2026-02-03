import { BookingStatus } from '@/types/enums';

export const BOOKING_STATUS_STYLES: Record<BookingStatus, { label: string; className: string }> = {
  [BookingStatus.PENDING_APPROVAL]: { label: 'Pending Approval', className: 'text-yellow-400' },
  [BookingStatus.PENDING]: { label: 'Pending', className: 'text-yellow-500' },
  [BookingStatus.CONFIRMED]: { label: 'Confirmed', className: 'text-blue-400' },
  [BookingStatus.ASSIGNED]: { label: 'Assigned', className: 'text-indigo-400' },
  [BookingStatus.IN_PROGRESS]: { label: 'In Progress', className: 'text-cyan-400' },
  [BookingStatus.COMPLETED]: { label: 'Completed', className: 'text-green-400' },
  [BookingStatus.CANCELLED]: { label: 'Cancelled', className: 'text-red-400' },
  [BookingStatus.REDIRECTED_EXTERNAL]: { label: 'External', className: 'text-orange-400' },
};
