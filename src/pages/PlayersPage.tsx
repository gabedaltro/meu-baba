import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PauseCircleOutlineOutlinedIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import PlayCircleOutlineOutlinedIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SportsSoccerOutlinedIcon from "@mui/icons-material/SportsSoccerOutlined";
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
import {
  activatePlayer,
  createPlayer,
  deactivatePlayer,
  fetchPlayers,
  type JerseySize,
  type Player,
  type PlayerPayload,
  type PlayerPosition,
  type PlayerType,
  updatePlayer,
  updatePlayerStats,
} from "../features/players/playersApi";

const jerseySizes: JerseySize[] = ["XS", "S", "M", "L", "XL", "XXL"];

type PlayerFormState = {
  name: string;
  nickname: string;
  jerseyNumber: string;
  jerseySize: "" | JerseySize;
  photoUrl: string;
  position: PlayerPosition;
  type: PlayerType;
  goals: string;
  assists: string;
};

const emptyForm: PlayerFormState = {
  name: "",
  nickname: "",
  jerseyNumber: "",
  jerseySize: "",
  photoUrl: "",
  position: "OUTFIELD",
  type: "MEMBER",
  goals: "0",
  assists: "0",
};

function getPlayerPayload(form: PlayerFormState): PlayerPayload {
  return {
    name: form.name.trim(),
    nickname: form.nickname.trim() || null,
    jerseyNumber: form.jerseyNumber ? Number(form.jerseyNumber) : null,
    jerseySize: form.jerseySize || null,
    photoUrl: form.photoUrl.trim() || null,
    position: form.position,
    type: form.position === "GOALKEEPER" ? null : form.type,
  };
}

function getFormFromPlayer(player: Player): PlayerFormState {
  return {
    name: player.name,
    nickname: player.nickname ?? "",
    jerseyNumber: player.jerseyNumber ? String(player.jerseyNumber) : "",
    jerseySize: player.jerseySize ?? "",
    photoUrl: player.photoUrl ?? "",
    position: player.position,
    type: player.type ?? "MEMBER",
    goals: String(player.goals),
    assists: String(player.assists),
  };
}

function getPlayerTypeLabel(player: Player) {
  if (player.position === "GOALKEEPER") {
    return "Goleiro";
  }

  return player.type === "GUEST" ? "Convidado" : "Mensalista";
}

function getPlayerTypeColor(player: Player) {
  if (player.position === "GOALKEEPER") {
    return "primary";
  }

  return player.type === "GUEST" ? "secondary" : "default";
}

function getPlayerSubtitle(player: Player) {
  const details = [];

  if (player.nickname) {
    details.push(player.nickname);
  }

  if (player.jerseyNumber) {
    details.push(`Camisa #${player.jerseyNumber}`);
  }

  return details.join(" - ");
}

export function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [form, setForm] = useState<PlayerFormState>(emptyForm);
  const [editingPlayerId, setEditingPlayerId] = useState<
    string | number | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const activePlayersCount = useMemo(
    () => players.filter((player) => player.isActive).length,
    [players],
  );

  const loadPlayers = async () => {
    try {
      setPlayers(await fetchPlayers());
    } catch {
      setErrorMessage("Nao foi possivel carregar os jogadores.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    fetchPlayers()
      .then((loadedPlayers) => {
        if (isMounted) {
          setPlayers(loadedPlayers);
        }
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage("Nao foi possivel carregar os jogadores.");
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
    setEditingPlayerId(null);
  };

  const savePlayer = async () => {
    const payload = getPlayerPayload(form);

    if (!payload.name) {
      setErrorMessage("Informe o nome do jogador.");
      return;
    }

    const goals = Number(form.goals || 0);
    const assists = Number(form.assists || 0);

    if (
      editingPlayerId &&
      (!Number.isInteger(goals) ||
        !Number.isInteger(assists) ||
        goals < 0 ||
        assists < 0)
    ) {
      setErrorMessage(
        "Gols e assistencias devem ser inteiros maiores ou iguais a zero.",
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setMessage("");

    try {
      if (editingPlayerId) {
        await updatePlayer(editingPlayerId, payload);
        await updatePlayerStats(editingPlayerId, {
          goals,
          assists,
        });
        setMessage("Jogador atualizado com sucesso.");
      } else {
        await createPlayer(payload);
        setMessage("Jogador cadastrado com sucesso.");
      }

      resetForm();
      await loadPlayers();
    } catch {
      setErrorMessage("Nao foi possivel salvar o jogador.");
    } finally {
      setIsSaving(false);
    }
  };
  const editPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setForm(getFormFromPlayer(player));
    setMessage("");
    setErrorMessage("");
  };

  const togglePlayerStatus = async (player: Player) => {
    setErrorMessage("");
    setMessage("");

    try {
      if (player.isActive) {
        await deactivatePlayer(player.id);
        setMessage("Jogador inativado.");
      } else {
        await activatePlayer(player.id);
        setMessage("Jogador reativado.");
      }

      await loadPlayers();
    } catch {
      setErrorMessage("Nao foi possivel alterar o status do jogador.");
    }
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
          <Avatar
            sx={{
              width: 54,
              height: 54,
              bgcolor: "#fff",
              color: "primary.main",
            }}
          >
            <SportsSoccerOutlinedIcon fontSize="large" />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h1"
              sx={{ color: "inherit", fontSize: { xs: "1.65rem", sm: "2rem" } }}
            >
              Cadastro de jogadores
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>
              {activePlayersCount} ativo{activePlayersCount === 1 ? "" : "s"}{" "}
              para o sorteio
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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "390px minmax(0, 1fr)" },
          gap: 3,
        }}
      >
        <Paper
          variant="outlined"
          sx={{ p: { xs: 2, sm: 3 }, height: "fit-content" }}
        >
          <Stack spacing={2}>
            <Typography variant="h2">
              {editingPlayerId ? "Editar jogador" : "Novo jogador"}
            </Typography>
            <TextField
              label="Nome"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Apelido"
              value={form.nickname}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  nickname: event.target.value,
                }))
              }
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                label="Numero"
                type="number"
                value={form.jerseyNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    jerseyNumber: event.target.value,
                  }))
                }
                slotProps={{ htmlInput: { min: 1, max: 999 } }}
                fullWidth
              />
              <Select
                value={form.jerseySize}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    jerseySize: event.target
                      .value as PlayerFormState["jerseySize"],
                  }))
                }
                displayEmpty
                fullWidth
              >
                <MenuItem value="">Tamanho</MenuItem>
                {jerseySizes.map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
            <Select
              value={form.position}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  position: event.target.value as PlayerPosition,
                }))
              }
              fullWidth
            >
              <MenuItem value="OUTFIELD">Linha</MenuItem>
              <MenuItem value="GOALKEEPER">Goleiro</MenuItem>
            </Select>
            <Select
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as PlayerType,
                }))
              }
              disabled={form.position === "GOALKEEPER"}
              fullWidth
            >
              <MenuItem value="MEMBER">Mensalista</MenuItem>
              <MenuItem value="GUEST">Convidado</MenuItem>
            </Select>
            <TextField
              label="URL da foto"
              value={form.photoUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  photoUrl: event.target.value,
                }))
              }
              fullWidth
            />
            {editingPlayerId ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  label="Gols"
                  type="number"
                  value={form.goals}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      goals: event.target.value,
                    }))
                  }
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                  fullWidth
                />
                <TextField
                  label="Assistencias"
                  type="number"
                  value={form.assists}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      assists: event.target.value,
                    }))
                  }
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                  fullWidth
                />
              </Stack>
            ) : null}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="contained"
                startIcon={
                  isSaving ? (
                    <CircularProgress color="inherit" size={18} />
                  ) : editingPlayerId ? (
                    <SaveOutlinedIcon />
                  ) : (
                    <AddOutlinedIcon />
                  )
                }
                onClick={savePlayer}
                disabled={isSaving}
                fullWidth
              >
                {editingPlayerId ? "Salvar" : "Cadastrar"}
              </Button>
              {editingPlayerId ? (
                <Button variant="outlined" onClick={resetForm} fullWidth>
                  Cancelar
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="h2">Jogadores cadastrados</Typography>
            {isLoading ? (
              <Stack sx={{ alignItems: "center", py: 5 }}>
                <CircularProgress />
              </Stack>
            ) : players.length === 0 ? (
              <Typography color="text.secondary">
                Nenhum jogador cadastrado.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 1,
                }}
              >
                {players.map((player) => (
                  <Stack
                    key={player.id}
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                      border: "1px solid",
                      borderColor: player.isActive
                        ? "divider"
                        : "rgba(211, 47, 47, 0.28)",
                      borderRadius: 2,
                      bgcolor: player.isActive
                        ? "#f7faf8"
                        : "rgba(211, 47, 47, 0.04)",
                      p: 1,
                    }}
                  >
                    <Avatar
                      src={player.photoUrl ?? undefined}
                      alt={player.name}
                      sx={{ width: 40, height: 40 }}
                    >
                      {player.name.charAt(0).toLocaleUpperCase("pt-BR")}
                    </Avatar>
                    <Stack sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 800 }}
                        noWrap
                      >
                        {player.name}
                      </Typography>
                      {getPlayerSubtitle(player) ? (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {getPlayerSubtitle(player)}
                        </Typography>
                      ) : null}
                      <Stack
                        direction="row"
                        spacing={0.75}
                        useFlexGap
                        sx={{ flexWrap: "wrap", mt: 0.5 }}
                      >
                        <Chip
                          label={getPlayerTypeLabel(player)}
                          size="small"
                          color={getPlayerTypeColor(player)}
                        />
                        <Chip
                          label={`${player.goals} gol${player.goals === 1 ? "" : "s"}`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${player.assists} assist${
                            player.assists === 1 ? "" : "s"
                          }`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={player.isActive ? "Ativo" : "Inativo"}
                          size="small"
                          color={player.isActive ? "success" : "error"}
                          variant="outlined"
                        />
                      </Stack>
                    </Stack>
                    <Tooltip title="Editar jogador">
                      <IconButton
                        onClick={() => editPlayer(player)}
                        aria-label={`Editar ${player.name}`}
                      >
                        <EditOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        player.isActive
                          ? "Inativar jogador"
                          : "Reativar jogador"
                      }
                    >
                      <IconButton
                        color={player.isActive ? "warning" : "success"}
                        onClick={() => void togglePlayerStatus(player)}
                      >
                        {player.isActive ? (
                          <PauseCircleOutlineOutlinedIcon />
                        ) : (
                          <PlayCircleOutlineOutlinedIcon />
                        )}
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