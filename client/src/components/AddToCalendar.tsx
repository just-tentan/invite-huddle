import { Calendar, ChevronDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SiGooglecalendar, SiApple } from 'react-icons/si';

interface AddToCalendarProps {
  title: string;
  description?: string | null;
  startDateTime: string;
  endDateTime?: string | null;
  location?: string | null;
  isAllDay?: boolean;
}

const formatDateForGoogle = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

const formatDateForOutlook = (dateStr: string) => {
  return new Date(dateStr).toISOString();
};

const getDefaultEndDate = (startDate: string, isAllDay?: boolean) => {
  const d = new Date(startDate);
  if (isAllDay) {
    d.setDate(d.getDate() + 1);
  } else {
    d.setHours(d.getHours() + 2);
  }
  return d.toISOString();
};

export const AddToCalendar = ({ title, description, startDateTime, endDateTime, location, isAllDay }: AddToCalendarProps) => {
  const end = endDateTime || getDefaultEndDate(startDateTime, isAllDay);
  const desc = description || '';
  const loc = location || '';

  const openGoogleCalendar = () => {
    const startFormatted = formatDateForGoogle(startDateTime);
    const endFormatted = formatDateForGoogle(end);

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${startFormatted}/${endFormatted}`,
      details: desc,
      location: loc,
    });

    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
  };

  const openOutlookCalendar = () => {
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: title,
      startdt: formatDateForOutlook(startDateTime),
      enddt: formatDateForOutlook(end),
      body: desc,
      location: loc,
    });

    window.open(`https://outlook.live.com/calendar/0/action/compose?${params.toString()}`, '_blank');
  };

  const downloadICS = () => {
    const formatICSDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const escapeICS = (str: string) => {
      return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    };

    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@eventhost`;
    const now = formatICSDate(new Date().toISOString());

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventHost//Event//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatICSDate(startDateTime)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${escapeICS(title)}`,
      desc ? `DESCRIPTION:${escapeICS(desc)}` : '',
      loc ? `LOCATION:${escapeICS(loc)}` : '',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Add to Calendar
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={openGoogleCalendar} className="gap-3 cursor-pointer">
          <SiGooglecalendar className="h-4 w-4 text-blue-500" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openOutlookCalendar} className="gap-3 cursor-pointer">
          <Calendar className="h-4 w-4 text-blue-600" />
          Outlook Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadICS} className="gap-3 cursor-pointer">
          <SiApple className="h-4 w-4" />
          Apple Calendar (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
