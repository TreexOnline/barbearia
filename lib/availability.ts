import { addMinutes, isBefore, isEqual, setHours, setMinutes, setSeconds, setMilliseconds, startOfDay } from "date-fns";

export interface WorkingBlock {
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export interface TimeOffBlock {
  startTime: string | null; // null = dia inteiro
  endTime: string | null;
}

export interface BusyBlock {
  start: Date;
  end: Date;
}

const SLOT_STEP_MINUTES = 15;

function timeToDate(day: Date, hhmm: string): Date {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return setMilliseconds(setSeconds(setMinutes(setHours(startOfDay(day), hours), minutes), 0), 0);
}

/**
 * Calcula os horários de início disponíveis em um dia para um barbeiro,
 * considerando o expediente, folgas e agendamentos já existentes.
 */
export function getAvailableSlots({
  day,
  serviceDurationMinutes,
  workingBlocks,
  timeOffBlocks,
  busyBlocks,
  now = new Date(),
}: {
  day: Date;
  serviceDurationMinutes: number;
  workingBlocks: WorkingBlock[];
  timeOffBlocks: TimeOffBlock[];
  busyBlocks: BusyBlock[];
  now?: Date;
}): Date[] {
  const isDayOff = timeOffBlocks.some((t) => t.startTime === null && t.endTime === null);
  if (isDayOff) return [];

  const slots: Date[] = [];

  for (const block of workingBlocks) {
    const blockStart = timeToDate(day, block.startTime);
    const blockEnd = timeToDate(day, block.endTime);

    let cursor = blockStart;
    while (isBefore(addMinutes(cursor, serviceDurationMinutes), blockEnd) || isEqual(addMinutes(cursor, serviceDurationMinutes), blockEnd)) {
      const slotStart = cursor;
      const slotEnd = addMinutes(cursor, serviceDurationMinutes);

      const isPast = isBefore(slotStart, now);
      const overlapsTimeOff = timeOffBlocks.some((t) => {
        if (t.startTime === null || t.endTime === null) return false;
        const offStart = timeToDate(day, t.startTime);
        const offEnd = timeToDate(day, t.endTime);
        return isBefore(slotStart, offEnd) && isBefore(offStart, slotEnd);
      });
      const overlapsBusy = busyBlocks.some(
        (b) => isBefore(slotStart, b.end) && isBefore(b.start, slotEnd)
      );

      if (!isPast && !overlapsTimeOff && !overlapsBusy) {
        slots.push(slotStart);
      }

      cursor = addMinutes(cursor, SLOT_STEP_MINUTES);
    }
  }

  return slots;
}
