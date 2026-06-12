import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import ShuffleOutlinedIcon from '@mui/icons-material/ShuffleOutlined'
import SportsSoccerOutlinedIcon from '@mui/icons-material/SportsSoccerOutlined'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const cards = [
  { label: 'Evento aberto', value: '18/24', detail: '6 vagas restantes', icon: <CalendarMonthOutlinedIcon /> },
  { label: 'Mensalistas ativos', value: '32', detail: '4 goleiros cadastrados', icon: <GroupsOutlinedIcon /> },
  { label: 'Presenças confirmadas', value: '18', detail: 'Sem bloqueio por inadimplência', icon: <SportsSoccerOutlinedIcon /> },
  { label: 'Financeiro pendente', value: 'R$ 420', detail: '7 faturas em aberto', icon: <PaidOutlinedIcon /> },
]

const nextActions = [
  'Criar próximo evento',
  'Confirmar participações',
  'Gerar sorteio do evento',
  'Registrar pagamentos',
]

export function DashboardPage() {
  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
        }}
      >
        <Box>
          <Typography variant="h1">Painel do Meu Baba</Typography>
          <Typography color="text.secondary">
            Acompanhe eventos, presenças, sorteios e financeiro do MVP.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button component={Link} to="/events/new" variant="contained" startIcon={<AddOutlinedIcon />}>
            Novo evento
          </Button>
          <Button component={Link} to="/events/draw" variant="outlined" startIcon={<ShuffleOutlinedIcon />}>
            Sortear
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        {cards.map((card, index) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack
                      direction="row"
                      sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <Typography color="text.secondary">{card.label}</Typography>
                      <Chip icon={card.icon} label="MVP" size="small" color="primary" variant="outlined" />
                    </Stack>
                    <Box>
                      <Typography variant="h2">{card.value}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {card.detail}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h2">Próximo evento</Typography>
                  <Typography color="text.secondary">
                    Sábado, 16:00 - Arena principal
                  </Typography>
                </Box>
                <Box>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Ocupação</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      18 de 24
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={75} sx={{ height: 10, borderRadius: 5 }} />
                </Box>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  <Chip label="Inscrições abertas" color="primary" />
                  <Chip label="6 vagas restantes" />
                  <Chip label="Último sorteio pendente" color="warning" variant="outlined" />
                </Stack>
                <Button component={Link} to="/events/next" variant="contained">
                  Confirmar presença
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h2">Fila de trabalho</Typography>
                {nextActions.map((action) => (
                  <Stack key={action} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <SportsSoccerOutlinedIcon color="primary" fontSize="small" />
                    <Typography>{action}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}
