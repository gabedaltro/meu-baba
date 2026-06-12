import { Card, CardContent, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

type EventMetricCardProps = {
  label: string
  value: string | number
  helper?: string
  icon: ReactNode
}

export function EventMetricCard({ label, value, helper, icon }: EventMetricCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            {icon}
          </Stack>
          <Typography variant="h2">{value}</Typography>
          {helper ? (
            <Typography variant="body2" color="text.secondary">
              {helper}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  )
}
