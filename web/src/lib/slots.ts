export const DEFAULT_SLOTS = [
  '08:00 - 10:00',
  '09:00 - 11:00',
  '09:00 - 12:00',
  '09:00 - 13:00',
  '10:00 - 12:00',
  '10:00 - 14:00',
  '11:00 - 13:00',
  '11:00 - 15:00',
  '12:00 - 14:00',
  '13:00 - 15:00',
  '13:00 - 17:00',
  '14:00 - 16:00',
  '15:00 - 17:00',
  '16:00 - 18:00',
  '17:00 - 19:00',
  '18:00 - 20:00',
]

const slotStart = (slot: string) => {
  const match = /^(\d{2}):(\d{2})/.exec(slot)
  return match ? Number(match[1]) * 60 + Number(match[2]) : 24 * 60
}

export const slotsIncluding = (current: string) => {
  const unique = new Set(DEFAULT_SLOTS)
  if (current) unique.add(current)
  return [...unique].sort((a, b) => slotStart(a) - slotStart(b) || a.localeCompare(b))
}
