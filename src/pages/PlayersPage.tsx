import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
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
  Snackbar,
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
  createPlayerStatEntry,
  deactivatePlayer,
  deleteStatEntry,
  fetchPlayer,
  fetchPlayerStatEntries,
  fetchPlayers,
  type JerseySize,
  type Player,
  type PlayerPayload,
  type PlayerPosition,
  type PlayerStatEntry,
  type PlayerType,
  sortPlayers,
  updatePlayer,
  updateStatEntry,
} from "../features/players/playersApi";

const jerseySizes: JerseySize[] = ["XS", "S", "M", "L", "XL", "XXL"];

type StatEntryFormState = {
  matchDate: string;
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
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function getEmptyEntryForm(): StatEntryFormState {
  return {
    matchDate: getTodayDateInput(),
    goals: "0",
    assists: "0",
  };
}

function formatEntryDate(matchDate: string) {
  const isoDate = matchDate.slice(0, 10);

  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("pt-BR");
}

const emptyForm: PlayerFormState = {
  name: "",
  nickname: "",
  jerseyNumber: "",
  jerseySize: "",
  photoUrl: "",
  position: "OUTFIELD",
  type: "MEMBER",
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

function replacePlayer(players: Player[], updatedPlayer: Player) {
  return sortPlayers(
    players.map((player) =>
      String(player.id) === String(updatedPlayer.id) ? updatedPlayer : player,
    ),
  );
}

export function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [form, setForm] = useState<PlayerFormState>(emptyForm);
  const [editingPlayerId, setEditingPlayerId] = useState<
    string | number | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrorMessage, setFormErrorMessage] = useState("");

  const [statsPlayer, setStatsPlayer] = useState<Player | null>(null);
  const [entryForm, setEntryForm] =
    useState<StatEntryFormState>(getEmptyEntryForm());
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [statEntries, setStatEntries] = useState<PlayerStatEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSavingStats, setIsSavingStats] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [statsErrorMessage, setStatsErrorMessage] = useState("");

  const [togglingPlayerId, setTogglingPlayerId] = useState<
    string | number | null
  >(null);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const activePlayersCount = useMemo(
    () => players.filter((player) => player.isActive).length,
    [players],
  );

  const showSnackbar = (
    message: string,
    severity: SnackbarState["severity"] = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar((current) => ({ ...current, open: false }));
  };

  const loadPlayers = async () => {
    try {
      setPlayers(await fetchPlayers());
      setLoadErrorMessage("");
    } catch {
      setLoadErrorMessage("Não foi possível carregar os jogadores.");
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
          setLoadErrorMessage("Não foi possível carregar os jogadores.");
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

  const openCreateDialog = () => {
    setEditingPlayerId(null);
    setForm(emptyForm);
    setFormErrorMessage("");
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (player: Player) => {
    setEditingPlayerId(player.id);
    setForm(getFormFromPlayer(player));
    setFormErrorMessage("");
    setIsFormDialogOpen(true);
  };

  const closeFormDialog = () => {
    if (isSaving) {
      return;
    }

    setIsFormDialogOpen(false);
    setFormErrorMessage("");
  };

  const savePlayer = async () => {
    const payload = getPlayerPayload(form);

    if (!payload.name) {
      setFormErrorMessage("Informe o nome do jogador.");
      return;
    }

    setIsSaving(true);
    setFormErrorMessage("");

    try {
      if (editingPlayerId) {
        const updatedPlayer = await updatePlayer(editingPlayerId, payload);
        setPlayers((current) => replacePlayer(current, updatedPlayer));
        showSnackbar("Jogador atualizado com sucesso.");
      } else {
        await createPlayer(payload);
        await loadPlayers();
        showSnackbar("Jogador cadastrado com sucesso.");
      }

      setIsFormDialogOpen(false);
    } catch {
      setFormErrorMessage("Não foi possível salvar o jogador.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadStatEntries = async (playerId: string | number) => {
    setIsLoadingEntries(true);

    try {
      setStatEntries(await fetchPlayerStatEntries(playerId));
    } catch {
      setStatsErrorMessage("Não foi possível carregar o historico.");
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const openStatsDialog = (player: Player) => {
    setStatsPlayer(player);
    setEntryForm(getEmptyEntryForm());
    setEditingEntryId(null);
    setStatsErrorMessage("");
    setStatEntries([]);
    void loadStatEntries(player.id);
  };

  const closeStatsDialog = () => {
    if (isSavingStats || deletingEntryId) {
      return;
    }

    setStatsPlayer(null);
    setEntryForm(getEmptyEntryForm());
    setEditingEntryId(null);
    setStatsErrorMessage("");
    setStatEntries([]);
  };

  const getStatsNumber = (value: string) => {
    if (!value) {
      return 0;
    }

    return Number(value);
  };

  const updateEntryField = (field: keyof StatEntryFormState, value: string) => {
    setEntryForm((current) => ({ ...current, [field]: value }));
  };

  const editEntry = (entry: PlayerStatEntry) => {
    setEditingEntryId(entry.id);
    setEntryForm({
      matchDate: entry.matchDate.slice(0, 10),
      goals: String(entry.goals),
      assists: String(entry.assists),
    });
    setStatsErrorMessage("");
  };

  const cancelEditEntry = () => {
    setEditingEntryId(null);
    setEntryForm(getEmptyEntryForm());
    setStatsErrorMessage("");
  };

  const refreshStatsPlayer = async (playerId: string | number) => {
    const updatedPlayer = await fetchPlayer(playerId);
    setPlayers((current) => replacePlayer(current, updatedPlayer));
    setStatsPlayer(updatedPlayer);
  };

  const submitEntry = async () => {
    if (!statsPlayer) {
      return;
    }

    if (!entryForm.matchDate) {
      setStatsErrorMessage("Informe a data do baba.");
      return;
    }

    const goals = getStatsNumber(entryForm.goals);
    const assists = getStatsNumber(entryForm.assists);

    if (
      !Number.isInteger(goals) ||
      !Number.isInteger(assists) ||
      goals < 0 ||
      assists < 0
    ) {
      setStatsErrorMessage(
        "Gols e assistências devem ser inteiros maiores ou iguais a zero.",
      );
      return;
    }

    if (goals === 0 && assists === 0) {
      setStatsErrorMessage(
        "Informe pelo menos um gol ou uma assistência para lançar.",
      );
      return;
    }

    setIsSavingStats(true);
    setStatsErrorMessage("");

    try {
      if (editingEntryId) {
        await updateStatEntry(editingEntryId, {
          matchDate: entryForm.matchDate,
          goals,
          assists,
        });
        showSnackbar("Lançamento atualizado com sucesso.");
      } else {
        await createPlayerStatEntry(statsPlayer.id, {
          matchDate: entryForm.matchDate,
          goals,
          assists,
        });
        showSnackbar("Baba lançado com sucesso.");
      }

      setEditingEntryId(null);
      setEntryForm(getEmptyEntryForm());
      await Promise.all([
        loadStatEntries(statsPlayer.id),
        refreshStatsPlayer(statsPlayer.id),
      ]);
    } catch {
      setStatsErrorMessage("Não foi possível salvar o lançamento.");
    } finally {
      setIsSavingStats(false);
    }
  };

  const removeEntry = async (entry: PlayerStatEntry) => {
    if (!statsPlayer) {
      return;
    }

    if (
      !window.confirm(
        "Remover este lançamento? Essa ação não pode ser desfeita.",
      )
    ) {
      return;
    }

    setDeletingEntryId(entry.id);

    try {
      await deleteStatEntry(entry.id);

      if (editingEntryId === entry.id) {
        setEditingEntryId(null);
        setEntryForm(getEmptyEntryForm());
      }

      showSnackbar("Lançamento removido.");
      await Promise.all([
        loadStatEntries(statsPlayer.id),
        refreshStatsPlayer(statsPlayer.id),
      ]);
    } catch {
      showSnackbar("Não foi possível remover o lançamento.", "error");
    } finally {
      setDeletingEntryId(null);
    }
  };

  const togglePlayerStatus = async (player: Player) => {
    setTogglingPlayerId(player.id);

    try {
      const updatedPlayer = player.isActive
        ? await deactivatePlayer(player.id)
        : await activatePlayer(player.id);

      setPlayers((current) => replacePlayer(current, updatedPlayer));
      showSnackbar(
        updatedPlayer.isActive ? "Jogador reativado." : "Jogador inativado.",
      );
    } catch {
      showSnackbar("Não foi possível alterar o status do jogador.", "error");
    } finally {
      setTogglingPlayerId(null);
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
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              variant="contained"
              onClick={openCreateDialog}
              startIcon={<AddOutlinedIcon />}
              sx={{
                bgcolor: "#fff",
                color: "#155b39",
                "&:hover": { bgcolor: "#eef5f0" },
              }}
            >
              Novo jogador
            </Button>
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
        </Stack>
      </Paper>

      {loadErrorMessage ? (
        <Alert severity="error">{loadErrorMessage}</Alert>
      ) : null}

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
              {players.map((player) => {
                const isToggling = togglingPlayerId === player.id;

                return (
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
                    <Tooltip title="Lançar baba">
                      <IconButton
                        color="primary"
                        onClick={() => openStatsDialog(player)}
                        disabled={isToggling}
                        aria-label={`Lançar gols e assistências de ${player.name}`}
                      >
                        <SportsSoccerOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar jogador">
                      <IconButton
                        onClick={() => openEditDialog(player)}
                        disabled={isToggling}
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
                      <span>
                        <IconButton
                          color={player.isActive ? "warning" : "success"}
                          onClick={() => void togglePlayerStatus(player)}
                          disabled={isToggling}
                          aria-label={
                            player.isActive
                              ? `Inativar ${player.name}`
                              : `Reativar ${player.name}`
                          }
                        >
                          {isToggling ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : player.isActive ? (
                            <PauseCircleOutlineOutlinedIcon />
                          ) : (
                            <PlayCircleOutlineOutlinedIcon />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                );
              })}
            </Box>
          )}
        </Stack>
      </Paper>

      <Dialog
        open={isFormDialogOpen}
        onClose={closeFormDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingPlayerId ? "Editar jogador" : "Novo jogador"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formErrorMessage ? (
              <Alert severity="error">{formErrorMessage}</Alert>
            ) : null}
            <TextField
              label="Nome"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              autoFocus
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
                label="Número"
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
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeFormDialog} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void savePlayer()}
            disabled={isSaving}
            startIcon={
              isSaving ? (
                <CircularProgress color="inherit" size={18} />
              ) : editingPlayerId ? (
                <SaveOutlinedIcon />
              ) : (
                <AddOutlinedIcon />
              )
            }
          >
            {editingPlayerId ? "Salvar" : "Cadastrar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(statsPlayer)}
        onClose={closeStatsDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Lançar baba</DialogTitle>
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
                    Total: {statsPlayer.goals} gol
                    {statsPlayer.goals === 1 ? "" : "s"} e {statsPlayer.assists}{" "}
                    assist{statsPlayer.assists === 1 ? "" : "s"}
                  </Typography>
                </Box>
              </Stack>

              {statsErrorMessage ? (
                <Alert severity="error">{statsErrorMessage}</Alert>
              ) : null}

              <Divider />

              <Stack spacing={1.5}>
                <Typography sx={{ fontWeight: 900 }}>
                  {editingEntryId ? "Editar lançamento" : "Novo lançamento"}
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <TextField
                    label="Data"
                    type="date"
                    value={entryForm.matchDate}
                    onChange={(event) =>
                      updateEntryField("matchDate", event.target.value)
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                  />
                  <TextField
                    label="Gols"
                    type="number"
                    value={entryForm.goals}
                    onChange={(event) =>
                      updateEntryField("goals", event.target.value)
                    }
                    slotProps={{ htmlInput: { min: 0, max: 50, step: 1 } }}
                    fullWidth
                  />
                  <TextField
                    label="Assistências"
                    type="number"
                    value={entryForm.assists}
                    onChange={(event) =>
                      updateEntryField("assists", event.target.value)
                    }
                    slotProps={{ htmlInput: { min: 0, max: 50, step: 1 } }}
                    fullWidth
                  />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    variant="contained"
                    onClick={() => void submitEntry()}
                    disabled={
                      isSavingStats ||
                      (getStatsNumber(entryForm.goals) === 0 &&
                        getStatsNumber(entryForm.assists) === 0)
                    }
                    startIcon={
                      isSavingStats ? (
                        <CircularProgress color="inherit" size={18} />
                      ) : editingEntryId ? (
                        <SaveOutlinedIcon />
                      ) : (
                        <AddOutlinedIcon />
                      )
                    }
                    fullWidth
                  >
                    {editingEntryId ? "Salvar alteração" : "Lançar"}
                  </Button>
                  {editingEntryId ? (
                    <Button
                      variant="outlined"
                      onClick={cancelEditEntry}
                      disabled={isSavingStats}
                      fullWidth
                    >
                      Cancelar edição
                    </Button>
                  ) : null}
                </Stack>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 900 }}>Histórico</Typography>
                {isLoadingEntries ? (
                  <Stack sx={{ alignItems: "center", py: 3 }}>
                    <CircularProgress size={24} />
                  </Stack>
                ) : statEntries.length === 0 ? (
                  <Typography color="text.secondary">
                    Nenhum lançamento ainda.
                  </Typography>
                ) : (
                  <Stack
                    spacing={0.75}
                    sx={{ maxHeight: 260, overflowY: "auto", pr: 0.5 }}
                  >
                    {statEntries.map((entry) => (
                      <Stack
                        key={entry.id}
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems: "center",
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1.5,
                          p: 1,
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700 }} noWrap>
                            {formatEntryDate(entry.matchDate)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {entry.goals} gol{entry.goals === 1 ? "" : "s"} ·{" "}
                            {entry.assists} assist
                            {entry.assists === 1 ? "" : "s"}
                          </Typography>
                        </Box>
                        <Tooltip title="Editar lançamento">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => editEntry(entry)}
                              disabled={Boolean(deletingEntryId)}
                              aria-label={`Editar lançamento de ${formatEntryDate(entry.matchDate)}`}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Remover lançamento">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => void removeEntry(entry)}
                              disabled={deletingEntryId === entry.id}
                              aria-label={`Remover lançamento de ${formatEntryDate(entry.matchDate)}`}
                            >
                              {deletingEntryId === entry.id ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                <DeleteOutlineOutlinedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={closeStatsDialog}
            disabled={isSavingStats || Boolean(deletingEntryId)}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
