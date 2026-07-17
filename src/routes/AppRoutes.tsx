import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ShuffleOutlinedIcon from "@mui/icons-material/ShuffleOutlined";
import { Box, Button, Container, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/authContext";
import { LoginPage } from "../pages/LoginPage";
import { PlayersPage } from "../pages/PlayersPage";
import { RankingsPage } from "../pages/RankingsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { TeamDrawPage } from "../pages/TeamDrawPage";
import { UsersPage } from "../pages/UsersPage";
import { ProtectedRoute } from "./ProtectedRoute";

const navItems = [
  { label: "Rankings", path: "/rankings", icon: <EmojiEventsOutlinedIcon /> },
  { label: "Sorteio", path: "/sorteio", icon: <ShuffleOutlinedIcon /> },
  {
    label: "Jogadores",
    path: "/jogadores",
    icon: <GroupsOutlinedIcon />,
    authOnly: true,
  },
  {
    label: "Usuarios",
    path: "/usuarios",
    icon: <ManageAccountsOutlinedIcon />,
    adminOnly: true,
  },
  {
    label: "Configuracoes",
    path: "/configuracoes",
    icon: <SettingsOutlinedIcon />,
    adminOnly: true,
  },
];

function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { clearSession, isAdmin, isAuthenticated, isSessionLoading } = useAuth();
  const visibleNavItems = navItems.filter((item) => {
    if (item.authOnly && (!isAuthenticated || isSessionLoading)) {
      return false;
    }

    return !item.adminOnly || (!isSessionLoading && isAdmin);
  });

  const disconnect = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#eef5f0" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: "wrap" }}
          >
            {visibleNavItems.map((item) => (
              <Button
                key={item.path}
                component={NavLink}
                to={item.path}
                startIcon={item.icon}
                sx={{
                  bgcolor: "rgba(255,255,255,0.88)",
                  color: "text.secondary",
                  border: "1px solid",
                  borderColor: "divider",
                  flex: { xs: "1 1 140px", sm: "0 0 auto" },
                  "&.active": {
                    bgcolor: "primary.main",
                    borderColor: "primary.main",
                    color: "primary.contrastText",
                    "& .MuiButton-startIcon": { color: "inherit" },
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
            {isAuthenticated && !isSessionLoading ? (
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutOutlinedIcon />}
                onClick={disconnect}
                sx={{
                  bgcolor: "rgba(255,255,255,0.88)",
                  flex: { xs: "1 1 140px", sm: "0 0 auto" },
                  ml: { sm: "auto" },
                }}
              >
                Desconectar
              </Button>
            ) : null}
          </Stack>
          {children}
        </Stack>
      </Container>
    </Box>
  );
}

function PublicPage({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

function ProtectedPage({
  children,
  requireAdmin = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  return (
    <ProtectedRoute requireAdmin={requireAdmin}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/sorteio" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/rankings"
        element={
          <PublicPage>
            <RankingsPage />
          </PublicPage>
        }
      />
      <Route path="/ranking" element={<Navigate to="/rankings" replace />} />
      <Route
        path="/sorteio"
        element={
          <PublicPage>
            <TeamDrawPage />
          </PublicPage>
        }
      />
      <Route path="/events/draw" element={<Navigate to="/sorteio" replace />} />
      <Route
        path="/jogadores"
        element={
          <ProtectedPage>
            <PlayersPage />
          </ProtectedPage>
        }
      />
      <Route path="/players" element={<Navigate to="/jogadores" replace />} />
      <Route
        path="/usuarios"
        element={
          <ProtectedPage requireAdmin>
            <UsersPage />
          </ProtectedPage>
        }
      />
      <Route path="/users" element={<Navigate to="/usuarios" replace />} />
      <Route
        path="/configuracoes"
        element={
          <ProtectedPage requireAdmin>
            <SettingsPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/settings"
        element={<Navigate to="/configuracoes" replace />}
      />
      <Route path="*" element={<Navigate to="/sorteio" replace />} />
    </Routes>
  );
}