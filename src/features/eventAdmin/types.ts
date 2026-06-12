export type EventAdminStatus = 'open' | 'closed' | 'finished' | 'cancelled'

export type ParticipantType = 'monthly_player' | 'goalkeeper'

export type ParticipationStatus = 'confirmed' | 'present' | 'absent' | 'pending'

export type PaymentStatus = 'pending' | 'paid' | 'exempt'

export type AdminEventInfo = {
  id: number
  title: string
  startsAt: Date
  location: string
  status: EventAdminStatus
  maxParticipants: number
}

export type ConfirmedParticipant = {
  id: number
  name: string
  confirmedAt: Date
  type: ParticipantType
  status: ParticipationStatus
}

export type AbsentParticipant = {
  id: number
  name: string
  reason?: string
  cancelledAt: Date
  isLateCancellation: boolean
}

export type AdminGuest = {
  id: number
  name: string
  phone: string
  responsibleMonthlyPlayer: string
  paymentStatus: PaymentStatus
  participationAmount: number
}

export type GeneralParticipation = {
  id: string
  name: string
  type: 'Mensalista' | 'Goleiro' | 'Convidado'
  participationOrder: number
  status: string
}
