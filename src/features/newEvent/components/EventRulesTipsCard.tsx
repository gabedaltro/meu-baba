import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import EditCalendarOutlinedIcon from '@mui/icons-material/EditCalendarOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import { Card, CardContent, Stack, Typography } from '@mui/material'

const tips = [
  {
    icon: <EditCalendarOutlinedIcon color="primary" />,
    text: 'Na maioria das semanas, altere apenas a data.',
  },
  {
    icon: <GroupsOutlinedIcon color="primary" />,
    text: 'Convidados só entram quando a regra mínima de mensalistas permitir.',
  },
  {
    icon: <BoltOutlinedIcon color="primary" />,
    text: 'Os valores padrão foram pensados para criar o baba em poucos segundos.',
  },
]

export function EventRulesTipsCard() {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h2">Dicas rápidas</Typography>
            <Typography color="text.secondary">Pequenas regras para reduzir retrabalho.</Typography>
          </Stack>

          <Stack spacing={1.5}>
            {tips.map((tip) => (
              <Stack key={tip.text} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                {tip.icon}
                <Typography>{tip.text}</Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
