import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../features/auth/authApi";
import { setAuthSession } from "../features/auth/authStorage";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTo =
    typeof location.state === "object" &&
    location.state &&
    "from" in location.state &&
    typeof location.state.from === "string"
      ? location.state.from
      : "/players";

  const submitLogin = async () => {
    if (!username.trim() || !password) {
      setErrorMessage("Informe usuário e senha.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await login({
        username: username.trim(),
        password,
      });

      setAuthSession(response.accessToken, response.user);
      navigate(redirectTo, { replace: true });
    } catch {
      setErrorMessage("Não foi possível autenticar com estes dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        bgcolor: "background.default",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h1">Meu Baba</Typography>
              <Typography color="text.secondary">
                Acesse sua conta para gerenciar o baba.
              </Typography>
            </Box>
            {errorMessage ? (
              <Alert severity="error">{errorMessage}</Alert>
            ) : null}
            <Stack spacing={2}>
              <TextField
                label="Usuário"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                fullWidth
              />
              <TextField
                label="Senha"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void submitLogin();
                  }
                }}
                autoComplete="current-password"
                fullWidth
              />
              <Button
                variant="contained"
                size="large"
                startIcon={
                  isSubmitting ? (
                    <CircularProgress color="inherit" size={18} />
                  ) : (
                    <LockOutlinedIcon />
                  )
                }
                onClick={submitLogin}
                disabled={isSubmitting}
              >
                Entrar
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
