import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import type { UserRole } from "../features/auth/authApi";
import {
  createUser,
  fetchUsers,
  type CreateUserPayload,
  type User,
  updateUser,
} from "../features/users/usersApi";

type UserFormState = {
  name: string;
  username: string;
  password: string;
  role: UserRole;
};

const emptyForm: UserFormState = {
  name: "",
  username: "",
  password: "",
  role: "USER",
};

function getRoleLabel(role: UserRole) {
  return role === "ADMIN" ? "Administrador" : "Usuario";
}

function getFormFromUser(user: User): UserFormState {
  return {
    name: user.name,
    username: user.username,
    password: "",
    role: user.role,
  };
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [editingUserId, setEditingUserId] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const adminCount = useMemo(
    () => users.filter((user) => user.role === "ADMIN").length,
    [users],
  );

  const loadUsers = async () => {
    try {
      setUsers(await fetchUsers());
    } catch {
      setErrorMessage("Nao foi possivel carregar os usuarios.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    fetchUsers()
      .then((loadedUsers) => {
        if (isMounted) {
          setUsers(loadedUsers);
        }
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage("Nao foi possivel carregar os usuarios.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingUserId(null);
  };

  const saveUser = async () => {
    const name = form.name.trim();
    const username = form.username.trim();
    const password = form.password.trim();

    if (!name || !username) {
      setErrorMessage("Informe nome e usuario.");
      return;
    }

    if (!editingUserId && !password) {
      setErrorMessage("Informe uma senha para criar o usuario.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (editingUserId) {
        await updateUser(editingUserId, {
          name,
          username,
          role: form.role,
          ...(password ? { password } : {}),
        });
        setMessage("Usuario atualizado com sucesso.");
      } else {
        const payload: CreateUserPayload = {
          name,
          username,
          password,
          role: form.role,
        };

        await createUser(payload);
        setMessage("Usuario cadastrado com sucesso.");
      }

      resetForm();
      await loadUsers();
    } catch {
      setErrorMessage("Nao foi possivel salvar o usuario.");
    } finally {
      setIsSaving(false);
    }
  };

  const editUser = (user: User) => {
    setEditingUserId(user.id);
    setForm(getFormFromUser(user));
    setMessage("");
    setErrorMessage("");
  };

  return (
    <Stack spacing={{ xs: 2.5, md: 4 }} sx={{ pb: 4 }}>
      <Paper
        variant="outlined"
        sx={{
          bgcolor: "#155b39",
          color: "#fff",
          borderColor: "rgba(255,255,255,0.18)",
          p: { xs: 2, sm: 3 },
          boxShadow: "0 20px 60px rgba(16, 70, 43, 0.22)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "stretch", sm: "center" } }}
        >
          <Avatar sx={{ width: 54, height: 54, bgcolor: "#fff", color: "primary.main" }}>
            <SecurityOutlinedIcon fontSize="large" />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h1" sx={{ color: "inherit", fontSize: { xs: "1.65rem", sm: "2rem" } }}>
              Usuarios do sistema
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>
              {users.length} cadastrado{users.length === 1 ? "" : "s"}, {adminCount} admin
            </Typography>
          </Box>
          <Button
            component={RouterLink}
            to="/sorteio"
            variant="outlined"
            startIcon={<ArrowBackOutlinedIcon />}
            sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.55)" }}
          >
            Ir para sorteio
          </Button>
        </Stack>
      </Paper>

      {message ? <Alert severity="success">{message}</Alert> : null}
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "390px minmax(0, 1fr)" }, gap: 3 }}>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, height: "fit-content" }}>
          <Stack spacing={2}>
            <Typography variant="h2">{editingUserId ? "Editar usuario" : "Novo usuario"}</Typography>
            <TextField
              label="Nome"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Usuario"
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              autoComplete="username"
              fullWidth
            />
            <TextField
              label={editingUserId ? "Nova senha" : "Senha"}
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              helperText={editingUserId ? "Deixe em branco para manter a senha atual." : undefined}
              autoComplete={editingUserId ? "new-password" : "new-password"}
              fullWidth
            />
            <Select
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserRole }))}
              fullWidth
            >
              <MenuItem value="ADMIN">Administrador</MenuItem>
              <MenuItem value="USER">Usuario</MenuItem>
            </Select>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="contained"
                startIcon={isSaving ? <CircularProgress color="inherit" size={18} /> : editingUserId ? <SaveOutlinedIcon /> : <AddOutlinedIcon />}
                onClick={saveUser}
                disabled={isSaving}
                fullWidth
              >
                {editingUserId ? "Salvar" : "Cadastrar"}
              </Button>
              {editingUserId ? <Button variant="outlined" onClick={resetForm} fullWidth>Cancelar</Button> : null}
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="h2">Usuarios cadastrados</Typography>
            {isLoading ? (
              <Stack sx={{ alignItems: "center", py: 5 }}><CircularProgress /></Stack>
            ) : users.length === 0 ? (
              <Typography color="text.secondary">Nenhum usuario cadastrado.</Typography>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1 }}>
                {users.map((user) => (
                  <Stack
                    key={user.id}
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "#f7faf8", p: 1 }}
                  >
                    <Avatar sx={{ width: 40, height: 40 }}>
                      {user.name.charAt(0).toLocaleUpperCase("pt-BR")}
                    </Avatar>
                    <Stack sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>{user.name}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>@{user.username}</Typography>
                      <Chip
                        label={getRoleLabel(user.role)}
                        size="small"
                        color={user.role === "ADMIN" ? "primary" : "default"}
                        sx={{ alignSelf: "flex-start", mt: 0.5 }}
                      />
                    </Stack>
                    <Tooltip title="Editar usuario">
                      <IconButton onClick={() => editUser(user)} aria-label={`Editar ${user.name}`}>
                        <EditOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Box>
            )}
          </Stack>
        </Paper>
      </Box>
    </Stack>
  );
}
