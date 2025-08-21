import { useState } from 'react';
import { Button } from '@car-booking/ui';
import { Card } from '@car-booking/ui';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GoogleFlightsDatePickerProps {
  departureDate: Date | undefined;
  onDepartureDateChange: (date: Date | undefined) => void;
  onClose: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function GoogleFlightsDatePicker({
  departureDate,
  onDepartureDateChange,
  onClose
}: GoogleFlightsDatePickerProps) {
  const [currentMonthDate, setCurrentMonthDate] = useState(departureDate || new Date());

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (date: Date) => {
    return departureDate && date.toDateString() === departureDate.toDateString();
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    onDepartureDateChange(date);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonthDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
    setCurrentMonthDate(newDate);
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonthDate);
    
    return (
      <div className="w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-medium">
            {MONTHS[currentMonthDate.getMonth()]} {currentMonthDate.getFullYear()}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="h-10" />;
              }
              
              const disabled = isDateDisabled(date);
              const selected = isDateSelected(date);
              
              return (
                <Button
                  key={date.toISOString()}
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className={`h-10 w-10 p-0 text-sm relative ${
                    selected
                      ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => handleDateClick(date)}
                >
                  {date.getDate()}
                  {selected && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary-foreground" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <Card className="w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-medium">Choose date</h2>
            <p className="text-sm text-muted-foreground">
              {departureDate
                ? formatDate(departureDate)
                : 'Select your travel date'
              }
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {renderCalendar()}

        <div className="p-6 border-t bg-muted/50 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Select your travel date
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={onClose}
              disabled={!departureDate}
            >
              Done
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}