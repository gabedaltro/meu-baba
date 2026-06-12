import { useState } from 'react'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import ShuffleOutlinedIcon from '@mui/icons-material/ShuffleOutlined'
import SportsSoccerOutlinedIcon from '@mui/icons-material/SportsSoccerOutlined'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Collapse,
  Container,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const drawerWidth = 248

const eventNavItems = [
  { label: 'Novo evento', path: '/events/new', icon: <AddCircleOutlineOutlinedIcon /> },
  { label: 'Próximo evento', path: '/events/next', icon: <EventAvailableOutlinedIcon /> },
  { label: 'Todos os eventos', path: '/events', icon: <CalendarMonthOutlinedIcon />, end: true },
  { label: 'Sorteio dos times', path: '/events/draw', icon: <ShuffleOutlinedIcon /> },
  { label: 'Administração', path: '/events/admin', icon: <AdminPanelSettingsOutlinedIcon /> },
]

const peopleNavItems = [
  { label: 'Mensalistas', path: '/monthly-players', icon: <GroupsOutlinedIcon /> },
  { label: 'Goleiros', path: '/goalkeepers', icon: <PersonOutlineOutlinedIcon /> },
]

export function DashboardLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isEventsMenuOpen, setIsEventsMenuOpen] = useState(true)
  const location = useLocation()
  const isEventsRouteActive = location.pathname.startsWith('/events')

  const openMobileSidebar = () => {
    setIsMobileSidebarOpen(true)
  }

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false)
  }

  const toggleEventsMenu = () => {
    setIsEventsMenuOpen((currentValue) => !currentValue)
  }

  const navButtonStyles = {
    justifyContent: 'flex-start',
    color: 'text.secondary',
    px: 1.5,
    '&.active': {
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
    },
  }

  const sectionTitleStyles = {
    px: 1.5,
    pt: 1,
    color: 'text.secondary',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
  }

  const sidebarContent = (
    <Stack spacing={3} sx={{ height: '100%', p: 2 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 800 }}>MB</Avatar>
        <Box>
          <Typography variant="h3">Meu Baba</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestão do baba
          </Typography>
        </Box>
      </Stack>

      <Divider />

      <Stack spacing={1.5}>
        <Stack spacing={0.5}>
          <Typography sx={sectionTitleStyles}>Operação</Typography>
          <Button
            component={NavLink}
            to="/"
            end
            startIcon={<SportsSoccerOutlinedIcon />}
            onClick={closeMobileSidebar}
            sx={navButtonStyles}
          >
            Painel
          </Button>
          <Button
            component={NavLink}
            to="/my-guests"
            startIcon={<PersonAddAltOutlinedIcon />}
            onClick={closeMobileSidebar}
            sx={navButtonStyles}
          >
            Meus convidados
          </Button>
        </Stack>

        <Stack spacing={0.5}>
          <Typography sx={sectionTitleStyles}>Eventos</Typography>
          <Button
            type="button"
            startIcon={<CalendarMonthOutlinedIcon />}
            endIcon={isEventsMenuOpen ? <ExpandLessOutlinedIcon /> : <ExpandMoreOutlinedIcon />}
            onClick={toggleEventsMenu}
            sx={{
              justifyContent: 'flex-start',
              color: isEventsRouteActive ? 'primary.contrastText' : 'text.secondary',
              bgcolor: isEventsRouteActive ? 'primary.main' : 'transparent',
              px: 1.5,
              '& .MuiButton-endIcon': {
                ml: 'auto',
              },
              '&:hover': {
                bgcolor: isEventsRouteActive ? 'primary.dark' : 'action.hover',
              },
            }}
          >
            Eventos
          </Button>

          <Collapse in={isEventsMenuOpen} timeout="auto" unmountOnExit>
            <Stack spacing={0.5} sx={{ pl: 1.5, pt: 0.5 }}>
              {eventNavItems.map((item) => (
                <Button
                  key={item.path}
                  component={NavLink}
                  to={item.path}
                  end={item.end}
                  startIcon={item.icon}
                  onClick={closeMobileSidebar}
                  sx={{
                    ...navButtonStyles,
                    fontSize: 13,
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Collapse>
        </Stack>

        <Stack spacing={0.5}>
          <Typography sx={sectionTitleStyles}>Pessoas</Typography>
          {peopleNavItems.map((item) => (
            <Button
              key={item.path}
              component={NavLink}
              to={item.path}
              startIcon={item.icon}
              onClick={closeMobileSidebar}
              sx={navButtonStyles}
            >
              {item.label}
            </Button>
          ))}
        </Stack>

        <Stack spacing={0.5}>
          <Typography sx={sectionTitleStyles}>Gestão</Typography>
          <Button
            component={NavLink}
            to="/financial"
            startIcon={<PaidOutlinedIcon />}
            onClick={closeMobileSidebar}
            sx={navButtonStyles}
          >
            Financeiro
          </Button>
        </Stack>
      </Stack>
    </Stack>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      <Drawer
        variant="temporary"
        open={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <Tooltip title="Abrir menu">
              <IconButton
                color="primary"
                edge="start"
                aria-label="Abrir menu lateral"
                onClick={openMobileSidebar}
                sx={{ display: { xs: 'inline-flex', lg: 'none' } }}
              >
                <MenuOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="h2" sx={{ flex: 1 }}>
              Operação
            </Typography>
            <Tooltip title="Perfil">
              <IconButton color="primary" aria-label="Perfil do usuário">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  GA
                </Avatar>
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
