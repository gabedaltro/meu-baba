export type ApiResource<T> = {
  data: T
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}
