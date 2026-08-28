export function formatMatchDayDate(date: string) {
  const isoDate = date.slice(0, 10)

  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatMatchDayDateShort(date: string) {
  const isoDate = date.slice(0, 10)

  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10)
}
