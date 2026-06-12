export type EventStatus = 'open' | 'closed' | 'finished' | 'cancelled'

export type UserParticipationStatus = 'confirmed' | 'absent' | 'pending'

export type NextEvent = {
  id: number
  startsAt: Date
  location: string
  status: EventStatus
  maxParticipants: number
  confirmedCount: number
  guestCount: number
}

export type UserParticipation = {
  status: UserParticipationStatus
  respondedAt?: Date
  absenceReason?: string
}
