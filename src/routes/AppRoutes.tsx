import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import ShuffleOutlinedIcon from "@mui/icons-material/ShuffleOutlined";
import { Box, Button, Container, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { PlayersPage } from "../pages/PlayersPage";
import { SettingsPage } from "../pages/SettingsPage";
import { TeamDrawPage } from "../pages/TeamDrawPage";
import { UsersPage } from "../pages/UsersPage";
import { ProtectedRoute } from "./ProtectedRoute";

const navItems = [
  { label: "Sorteio", path: "/sorteio", icon: <ShuffleOutlinedIcon /> },
  { label: "Jogadores", path: "/jogadores", icon: <GroupsOutlinedIcon /> },
  {
    label: "Usuários",
    path: "/usuarios",
    icon: <ManageAccountsOutlinedIcon />,
  },
  {
    label: "Configurações",
    path: "/configuracoes",
    icon: <SettingsOutlinedIcon />,
  },
];
function AppLayout({ children }: { children: ReactNode }) {
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
            {navItems.map((item) => (
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
          </Stack>
          {children}
        </Stack>
      </Container>
    </Box>
  );
}

function ProtectedPage({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
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
        path="/sorteio"
        element={
          <ProtectedPage>
            <TeamDrawPage />
          </ProtectedPage>
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
          <ProtectedPage>
            <UsersPage />
          </ProtectedPage>
        }
      />
      <Route path="/users" element={<Navigate to="/usuarios" replace />} />
      <Route
        path="/configuracoes"
        element={
          <ProtectedPage>
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
