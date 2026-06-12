export type GuestPaymentStatus = 'pending' | 'paid' | 'exempt'

export type EventGuest = {
  id: number
  name: string
  phone: string
  paymentStatus: GuestPaymentStatus
  participationAmount: number
}

export type GuestFormValues = {
  name: string
  phone: string
}
