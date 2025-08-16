import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';

export function useVehicles() {
  return trpc.vehicles.list.useQuery();
}

export function useVehicleAvailability(date: string, startTime: string, endTime: string) {
  return trpc.vehicles.availability.useQuery(
    { date, startTime, endTime },
    { enabled: !!date && !!startTime && !!endTime }
  );
}

export function useCreateBooking() {
  const utils = trpc.useUtils();
  
  return trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      toast.success('Booking created successfully!');
      utils.bookings.myBookings.invalidate();
      utils.vehicles.availability.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create booking');
    },
  });
}

export function useMyBookings() {
  return trpc.bookings.myBookings.useQuery();
}

export function usePendingApprovals() {
  return trpc.approvals.pending.useQuery();
}

export function useApproveBooking() {
  const utils = trpc.useUtils();
  
  return trpc.approvals.approve.useMutation({
    onSuccess: () => {
      toast.success('Booking approved successfully!');
      utils.approvals.pending.invalidate();
      utils.bookings.myBookings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve booking');
    },
  });
}

export function useRejectBooking() {
  const utils = trpc.useUtils();
  
  return trpc.approvals.reject.useMutation({
    onSuccess: () => {
      toast.success('Booking rejected');
      utils.approvals.pending.invalidate();
      utils.bookings.myBookings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reject booking');
    },
  });
}

export function useCancelBooking() {
  const utils = trpc.useUtils();
  
  return trpc.bookings.cancel.useMutation({
    onSuccess: () => {
      toast.success('Booking cancelled successfully');
      utils.bookings.myBookings.invalidate();
      utils.vehicles.availability.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel booking');
    },
  });
}