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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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

type PlayerStatsFormState = {
  goals: string;
  assists: string;
};

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

const emptyStatsForm: PlayerStatsFormState = {
  goals: "0",
  assists: "0",
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

function getStatsFormFromPlayer(player: Player): PlayerStatsFormState {
  return {
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
  const [statsPlayer, setStatsPlayer] = useState<Player | null>(null);
  const [statsForm, setStatsForm] =
    useState<PlayerStatsFormState>(emptyStatsForm);
  const [isSavingStats, setIsSavingStats] = useState(false);
  const [statsErrorMessage, setStatsErrorMessage] = useState("");
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
        "Gols e assistências devem ser inteiros maiores ou iguais a zero.",
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

  const openStatsDialog = (player: Player) => {
    setStatsPlayer(player);
    setStatsForm(getStatsFormFromPlayer(player));
    setStatsErrorMessage("");
    setMessage("");
  };

  const closeStatsDialog = () => {
    if (isSavingStats) {
      return;
    }

    setStatsPlayer(null);
    setStatsForm(emptyStatsForm);
    setStatsErrorMessage("");
  };

  const getStatsNumber = (value: string) => {
    if (!value) {
      return 0;
    }

    return Number(value);
  };

  const updateStatsField = (
    field: keyof PlayerStatsFormState,
    value: string,
  ) => {
    if (value === "") {
      setStatsForm((current) => ({ ...current, [field]: value }));
      return;
    }

    const nextValue = Math.min(1000000, Math.max(0, Number(value)));

    if (!Number.isFinite(nextValue)) {
      return;
    }

    setStatsForm((current) => ({
      ...current,
      [field]: String(Math.trunc(nextValue)),
    }));
  };

  const stepStatsField = (field: keyof PlayerStatsFormState, delta: number) => {
    setStatsForm((current) => {
      const currentValue = getStatsNumber(current[field]);
      const nextValue = Math.min(1000000, Math.max(0, currentValue + delta));

      return { ...current, [field]: String(nextValue) };
    });
  };

  const shouldConfirmStatsReduction = (
    currentPlayer: Player,
    nextGoals: number,
    nextAssists: number,
  ) => {
    const clearedGoals = currentPlayer.goals > 0 && nextGoals === 0;
    const clearedAssists = currentPlayer.assists > 0 && nextAssists === 0;
    const reducedGoalsALot = currentPlayer.goals - nextGoals >= 10;
    const reducedAssistsALot = currentPlayer.assists - nextAssists >= 10;

    return (
      clearedGoals || clearedAssists || reducedGoalsALot || reducedAssistsALot
    );
  };

  const saveStats = async () => {
    if (!statsPlayer) {
      return;
    }

    const goals = getStatsNumber(statsForm.goals);
    const assists = getStatsNumber(statsForm.assists);

    if (
      !Number.isInteger(goals) ||
      !Number.isInteger(assists) ||
      goals < 0 ||
      assists < 0 ||
      goals > 1000000 ||
      assists > 1000000
    ) {
      setStatsErrorMessage(
        "Gols e assistências devem ser inteiros entre 0 e 1.000.000.",
      );
      return;
    }

    if (
      shouldConfirmStatsReduction(statsPlayer, goals, assists) &&
      !window.confirm("Confirmar reducao grande ou zerar estatisticas?")
    ) {
      return;
    }

    setIsSavingStats(true);
    setStatsErrorMessage("");
    setMessage("");

    try {
      const updatedPlayer = await updatePlayerStats(statsPlayer.id, {
        goals,
        assists,
      });

      setPlayers((currentPlayers) =>
        currentPlayers.map((player) =>
          String(player.id) === String(updatedPlayer.id)
            ? updatedPlayer
            : player,
        ),
      );

      if (String(editingPlayerId) === String(updatedPlayer.id)) {
        setForm((current) => ({
          ...current,
          goals: String(updatedPlayer.goals),
          assists: String(updatedPlayer.assists),
        }));
      }

      setMessage("Estatisticas atualizadas com sucesso.");
      setStatsPlayer(null);
      setStatsForm(emptyStatsForm);
    } catch {
      setStatsErrorMessage("Nao foi possivel salvar as estatisticas.");
    } finally {
      setIsSavingStats(false);
    }
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
                  label="Assistências"
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
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
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
                    <Tooltip title="Atualizar estatisticas">
                      <IconButton
                        color="primary"
                        onClick={() => openStatsDialog(player)}
                        aria-label={`Atualizar gols e assistências de ${player.name}`}
                      >
                        <SportsSoccerOutlinedIcon />
                      </IconButton>
                    </Tooltip>
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
      <Dialog
        open={Boolean(statsPlayer)}
        onClose={closeStatsDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Atualizar estatisticas</DialogTitle>
        <DialogContent>
          {statsPlayer ? (
            <Stack spacing={2.25} sx={{ pt: 1 }}>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center" }}
              >
                <Avatar
                  src={statsPlayer.photoUrl ?? undefined}
                  alt={statsPlayer.name}
                  sx={{ width: 58, height: 58, bgcolor: "primary.main" }}
                >
                  {statsPlayer.name.charAt(0).toLocaleUpperCase("pt-BR")}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h3" noWrap>
                    {statsPlayer.name}
                  </Typography>
                  <Typography color="text.secondary">
                    Atual: {statsPlayer.goals} gol
                    {statsPlayer.goals === 1 ? "" : "s"} e {statsPlayer.assists}{" "}
                    assist{statsPlayer.assists === 1 ? "" : "s"}
                  </Typography>
                </Box>
              </Stack>

              {statsErrorMessage ? (
                <Alert severity="error">{statsErrorMessage}</Alert>
              ) : null}

              <Divider />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f7faf8" }}>
                  <Stack spacing={1.5}>
                    <Typography sx={{ fontWeight: 900 }}>Gols</Typography>
                    <TextField
                      type="number"
                      value={statsForm.goals}
                      onChange={(event) =>
                        updateStatsField("goals", event.target.value)
                      }
                      slotProps={{
                        htmlInput: { min: 0, max: 1000000, step: 1 },
                      }}
                      fullWidth
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => stepStatsField("goals", -1)}
                        disabled={
                          isSavingStats || getStatsNumber(statsForm.goals) <= 0
                        }
                        fullWidth
                        aria-label="Diminuir um gol"
                      >
                        -1
                      </Button>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => stepStatsField("goals", 1)}
                        disabled={
                          isSavingStats ||
                          getStatsNumber(statsForm.goals) >= 1000000
                        }
                        fullWidth
                        aria-label="Adicionar um gol"
                      >
                        +1
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f7faf8" }}>
                  <Stack spacing={1.5}>
                    <Typography sx={{ fontWeight: 900 }}>
                      Assistências
                    </Typography>
                    <TextField
                      type="number"
                      value={statsForm.assists}
                      onChange={(event) =>
                        updateStatsField("assists", event.target.value)
                      }
                      slotProps={{
                        htmlInput: { min: 0, max: 1000000, step: 1 },
                      }}
                      fullWidth
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => stepStatsField("assists", -1)}
                        disabled={
                          isSavingStats ||
                          getStatsNumber(statsForm.assists) <= 0
                        }
                        fullWidth
                        aria-label="Diminuir uma assistencia"
                      >
                        -1
                      </Button>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => stepStatsField("assists", 1)}
                        disabled={
                          isSavingStats ||
                          getStatsNumber(statsForm.assists) >= 1000000
                        }
                        fullWidth
                        aria-label="Adicionar uma assistencia"
                      >
                        +1
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeStatsDialog} disabled={isSavingStats}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void saveStats()}
            disabled={isSavingStats}
            startIcon={
              isSavingStats ? (
                <CircularProgress color="inherit" size={18} />
              ) : (
                <SaveOutlinedIcon />
              )
            }
          >
            Salvar estatisticas
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
