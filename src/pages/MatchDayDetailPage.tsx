import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import MilitaryTechOutlinedIcon from "@mui/icons-material/MilitaryTechOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ShuffleOutlinedIcon from "@mui/icons-material/ShuffleOutlined";
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
  IconButton,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../features/auth/authContext";
import { formatMatchDayDate } from "../features/matchDays/format";
import {
  createConfronto,
  deleteConfronto,
  deleteMatchDay,
  fetchMatchDay,
  renameMatchDayTeam,
  setMatchDayCapa,
  updateConfronto,
  type ConfrontoScoreSource,
  type MatchDayConfronto,
  type MatchDayDetail,
  type MatchDayPlayer,
  type MatchDayTeam,
} from "../features/matchDays/matchDaysApi";

type ConfrontoFormState = {
  teamAId: string;
  teamBId: string;
  scoreA: string;
  scoreB: string;
};

const emptyConfrontoForm: ConfrontoFormState = {
  teamAId: "",
  teamBId: "",
  scoreA: "0",
  scoreB: "0",
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

function getPlayerLabel(player: MatchDayPlayer) {
  return player.nickname ? `${player.name} (${player.nickname})` : player.name;
}

function putGoalkeepersFirst(players: MatchDayPlayer[]) {
  return [...players].sort((a, b) => {
    const aIsGoalkeeper = a.position === "GOALKEEPER" ? 0 : 1;
    const bIsGoalkeeper = b.position === "GOALKEEPER" ? 0 : 1;

    return aIsGoalkeeper - bIsGoalkeeper;
  });
}

function TeamRosterCard({
  team,
  isCapa,
  canEdit,
  isEditing,
  editValue,
  isSavingName,
  onStartEdit,
  onCancelEdit,
  onChangeEditValue,
  onSubmitEdit,
}: {
  team: MatchDayTeam;
  isCapa: boolean;
  canEdit: boolean;
  isEditing: boolean;
  editValue: string;
  isSavingName: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeEditValue: (value: string) => void;
  onSubmitEdit: () => void;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderColor: isCapa ? "#ffb300" : "divider",
        borderWidth: isCapa ? 2 : 1,
        bgcolor: isCapa ? "#fffaf0" : "#fff",
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {isEditing ? (
            <>
              <TextField
                value={editValue}
                onChange={(event) => onChangeEditValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onSubmitEdit();
                  }

                  if (event.key === "Escape") {
                    onCancelEdit();
                  }
                }}
                size="small"
                autoFocus
                fullWidth
                disabled={isSavingName}
                slotProps={{ htmlInput: { maxLength: 50 } }}
              />
              <Tooltip title="Salvar nome">
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={onSubmitEdit}
                    disabled={isSavingName || !editValue.trim()}
                  >
                    {isSavingName ? (
                      <CircularProgress size={16} />
                    ) : (
                      <CheckOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Cancelar">
                <span>
                  <IconButton
                    size="small"
                    onClick={onCancelEdit}
                    disabled={isSavingName}
                  >
                    <CloseOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          ) : (
            <>
              <Typography variant="h3" sx={{ flex: 1 }} noWrap>
                {team.name}
              </Typography>
              {canEdit ? (
                <Tooltip title="Renomear time">
                  <IconButton size="small" onClick={onStartEdit}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
              {isCapa ? (
                <Chip
                  size="small"
                  icon={<MilitaryTechOutlinedIcon />}
                  label="Capa"
                  color="warning"
                />
              ) : null}
            </>
          )}
        </Stack>
        <Stack spacing={0.75}>
          {putGoalkeepersFirst(team.players).map((player) => (
            <Stack
              key={player.id}
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              <Avatar
                src={player.photoUrl ?? undefined}
                alt={player.name}
                sx={{ width: 32, height: 32, fontSize: 12 }}
              >
                {player.name.charAt(0).toLocaleUpperCase("pt-BR")}
              </Avatar>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, flex: 1, minWidth: 100 }}
                noWrap
              >
                {getPlayerLabel(player)}
              </Typography>
              {player.position === "GOALKEEPER" ? (
                <Chip label="Goleiro" size="small" color="primary" variant="outlined" />
              ) : null}
              {player.type === "GUEST" ? (
                <Chip label="Convidado" size="small" color="secondary" variant="outlined" />
              ) : null}
              {player.jerseyNumber ? (
                <Chip label={`#${player.jerseyNumber}`} size="small" variant="outlined" />
              ) : null}
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function ConfrontoRow({
  confronto,
  teamAName,
  teamBName,
  canManage,
  isDeleting,
  onOpen,
  onEdit,
  onDelete,
}: {
  confronto: MatchDayConfronto;
  teamAName: string;
  teamBName: string;
  canManage: boolean;
  isDeleting: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const winner =
    confronto.scoreA === confronto.scoreB
      ? null
      : confronto.scoreA > confronto.scoreB
        ? "A"
        : "B";

  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={{
        alignItems: "center",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 1.25,
        bgcolor: "#f7faf8",
      }}
    >
      <Box
        onClick={onOpen}
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          cursor: "pointer",
        }}
      >
        <Chip label={`#${confronto.sequence}`} size="small" />
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flex: 1, minWidth: 0, alignItems: "center", flexWrap: "wrap" }}
        >
          <Typography
            sx={{ fontWeight: winner === "A" ? 900 : 600 }}
            noWrap
          >
            {teamAName}
          </Typography>
          <Chip
            label={`${confronto.scoreA} x ${confronto.scoreB}`}
            size="small"
            color="primary"
            sx={{ fontWeight: 900 }}
          />
          <Typography
            sx={{ fontWeight: winner === "B" ? 900 : 600 }}
            noWrap
          >
            {teamBName}
          </Typography>
        </Stack>
        <ChevronRightOutlinedIcon
          fontSize="small"
          sx={{ color: "text.secondary", flexShrink: 0 }}
        />
      </Box>
      {canManage ? (
        <>
          <Tooltip title="Editar confronto">
            <span>
              <IconButton size="small" onClick={onEdit} disabled={isDeleting}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Remover confronto">
            <span>
              <IconButton
                size="small"
                color="error"
                onClick={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <DeleteOutlineOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </>
      ) : null}
    </Stack>
  );
}

export function MatchDayDetailPage() {
  const navigate = useNavigate();
  const { matchDayId } = useParams<{ matchDayId: string }>();
  const { isAuthenticated } = useAuth();

  const [matchDay, setMatchDay] = useState<MatchDayDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDeletingMatchDay, setIsDeletingMatchDay] = useState(false);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const [isConfrontoDialogOpen, setIsConfrontoDialogOpen] = useState(false);
  const [editingConfrontoId, setEditingConfrontoId] = useState<string | null>(
    null,
  );
  const [editingConfrontoScoreSource, setEditingConfrontoScoreSource] =
    useState<ConfrontoScoreSource | null>(null);
  const [confrontoForm, setConfrontoForm] =
    useState<ConfrontoFormState>(emptyConfrontoForm);
  const [isSavingConfronto, setIsSavingConfronto] = useState(false);
  const [confrontoErrorMessage, setConfrontoErrorMessage] = useState("");
  const [deletingConfrontoId, setDeletingConfrontoId] = useState<
    string | null
  >(null);

  const [isSavingCapa, setIsSavingCapa] = useState(false);
  const [capaSelection, setCapaSelection] = useState("");

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamNameDraft, setTeamNameDraft] = useState("");
  const [isSavingTeamName, setIsSavingTeamName] = useState(false);

  const showSnackbar = (
    message: string,
    severity: SnackbarState["severity"] = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar((current) => ({ ...current, open: false }));
  };

  useEffect(() => {
    let isMounted = true;

    if (!matchDayId) {
      return undefined;
    }

    fetchMatchDay(matchDayId)
      .then((detail) => {
        if (isMounted) {
          setMatchDay(detail);
        }
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage("Não foi possível carregar esta rodada.");
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
  }, [matchDayId]);

  const refreshMatchDay = async () => {
    if (!matchDayId) {
      return undefined;
    }

    const detail = await fetchMatchDay(matchDayId);
    setMatchDay(detail);
    return detail;
  };

  const teamsById = useMemo(
    () => new Map((matchDay?.teams ?? []).map((team) => [team.id, team])),
    [matchDay],
  );

  const sortedConfrontos = useMemo(
    () =>
      [...(matchDay?.confrontos ?? [])].sort(
        (a, b) => a.sequence - b.sequence,
      ),
    [matchDay],
  );

  const capaTeam = matchDay?.capaTeamId
    ? teamsById.get(matchDay.capaTeamId)
    : undefined;

  const openCreateConfrontoDialog = () => {
    setEditingConfrontoId(null);
    setEditingConfrontoScoreSource(null);
    setConfrontoForm(emptyConfrontoForm);
    setConfrontoErrorMessage("");
    setIsConfrontoDialogOpen(true);
  };

  const openEditConfrontoDialog = (confronto: MatchDayConfronto) => {
    setEditingConfrontoId(confronto.id);
    setEditingConfrontoScoreSource(confronto.scoreSource);
    setConfrontoForm({
      teamAId: confronto.teamAId,
      teamBId: confronto.teamBId,
      scoreA: String(confronto.scoreA),
      scoreB: String(confronto.scoreB),
    });
    setConfrontoErrorMessage("");
    setIsConfrontoDialogOpen(true);
  };

  const closeConfrontoDialog = () => {
    if (isSavingConfronto) {
      return;
    }

    setIsConfrontoDialogOpen(false);
    setConfrontoErrorMessage("");
  };

  const isEditingManualScore =
    editingConfrontoId !== null && editingConfrontoScoreSource === "MANUAL";

  const submitConfronto = async () => {
    if (!matchDayId) {
      return;
    }

    if (!confrontoForm.teamAId || !confrontoForm.teamBId) {
      setConfrontoErrorMessage("Selecione os dois times do confronto.");
      return;
    }

    if (confrontoForm.teamAId === confrontoForm.teamBId) {
      setConfrontoErrorMessage("Os times do confronto devem ser diferentes.");
      return;
    }

    let scoreA = 0;
    let scoreB = 0;

    if (isEditingManualScore) {
      scoreA = Number(confrontoForm.scoreA || 0);
      scoreB = Number(confrontoForm.scoreB || 0);

      if (
        !Number.isInteger(scoreA) ||
        !Number.isInteger(scoreB) ||
        scoreA < 0 ||
        scoreB < 0
      ) {
        setConfrontoErrorMessage(
          "O placar deve ser um número inteiro maior ou igual a zero.",
        );
        return;
      }
    }

    setIsSavingConfronto(true);
    setConfrontoErrorMessage("");

    try {
      if (editingConfrontoId) {
        await updateConfronto(editingConfrontoId, {
          teamAId: confrontoForm.teamAId,
          teamBId: confrontoForm.teamBId,
          ...(isEditingManualScore ? { scoreA, scoreB } : {}),
        });
        showSnackbar("Confronto atualizado.");
      } else {
        await createConfronto(matchDayId, {
          teamAId: confrontoForm.teamAId,
          teamBId: confrontoForm.teamBId,
        });
        showSnackbar("Confronto adicionado.");
      }

      setIsConfrontoDialogOpen(false);
      await refreshMatchDay();
    } catch {
      setConfrontoErrorMessage("Não foi possível salvar o confronto.");
    } finally {
      setIsSavingConfronto(false);
    }
  };

  const removeConfronto = async (confronto: MatchDayConfronto) => {
    if (
      !window.confirm(
        "Remover este confronto? Isso também reverte os gols e assistências lançados nele.",
      )
    ) {
      return;
    }

    setDeletingConfrontoId(confronto.id);

    try {
      await deleteConfronto(confronto.id);
      showSnackbar("Confronto removido.");
      await refreshMatchDay();
    } catch {
      showSnackbar("Não foi possível remover o confronto.", "error");
    } finally {
      setDeletingConfrontoId(null);
    }
  };

  const startEditingTeamName = (team: MatchDayTeam) => {
    setEditingTeamId(team.id);
    setTeamNameDraft(team.name);
  };

  const cancelEditingTeamName = () => {
    if (isSavingTeamName) {
      return;
    }

    setEditingTeamId(null);
    setTeamNameDraft("");
  };

  const submitTeamName = async () => {
    if (!editingTeamId) {
      return;
    }

    const trimmedName = teamNameDraft.trim();

    if (!trimmedName) {
      showSnackbar("Informe um nome para o time.", "error");
      return;
    }

    setIsSavingTeamName(true);

    try {
      await renameMatchDayTeam(editingTeamId, trimmedName);
      showSnackbar("Nome do time atualizado.");
      setEditingTeamId(null);
      setTeamNameDraft("");
      await refreshMatchDay();
    } catch {
      showSnackbar("Não foi possível renomear o time.", "error");
    } finally {
      setIsSavingTeamName(false);
    }
  };

  const chooseCapa = async () => {
    if (!matchDayId || !capaSelection) {
      return;
    }

    setIsSavingCapa(true);

    try {
      const updated = await setMatchDayCapa(matchDayId, capaSelection);
      setMatchDay(updated);
      showSnackbar("Time capa definido.");
    } catch {
      showSnackbar("Não foi possível definir o time capa.", "error");
    } finally {
      setIsSavingCapa(false);
    }
  };

  const removeMatchDay = async () => {
    if (!matchDayId) {
      return;
    }

    if (
      !window.confirm(
        "Excluir esta rodada? Isso apaga os confrontos e as estatísticas lançadas nela. Essa ação não pode ser desfeita.",
      )
    ) {
      return;
    }

    setIsDeletingMatchDay(true);

    try {
      await deleteMatchDay(matchDayId);
      navigate("/rodadas");
    } catch {
      showSnackbar("Não foi possível excluir a rodada.", "error");
      setIsDeletingMatchDay(false);
    }
  };

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={140} />
        <Skeleton variant="rounded" height={220} />
        <Skeleton variant="rounded" height={220} />
      </Stack>
    );
  }

  if (errorMessage || !matchDay) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">
          {errorMessage || "Rodada não encontrada."}
        </Alert>
        <Button
          component={RouterLink}
          to="/rodadas"
          startIcon={<ArrowBackOutlinedIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          Voltar para times da semana
        </Button>
      </Stack>
    );
  }

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
            sx={{ width: 54, height: 54, bgcolor: "#fff", color: "primary.main" }}
          >
            <MilitaryTechOutlinedIcon fontSize="large" />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h1"
              sx={{
                color: "inherit",
                fontSize: { xs: "1.4rem", sm: "1.75rem" },
                textTransform: "capitalize",
              }}
            >
              {formatMatchDayDate(matchDay.date)}
            </Typography>
            <Stack
              direction="row"
              spacing={0.75}
              useFlexGap
              sx={{ flexWrap: "wrap", mt: 0.5 }}
            >
              <Chip
                size="small"
                icon={
                  matchDay.source === "DRAW" ? (
                    <ShuffleOutlinedIcon />
                  ) : (
                    <GroupsOutlinedIcon />
                  )
                }
                label={matchDay.source === "DRAW" ? "Do sorteio" : "Manual"}
                sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "#fff" }}
              />
              {capaTeam ? (
                <Chip
                  size="small"
                  icon={<MilitaryTechOutlinedIcon />}
                  label={`Capa: ${capaTeam.name}`}
                  sx={{ bgcolor: "#ffd54f", color: "#6b4300", fontWeight: 800 }}
                />
              ) : (
                <Chip
                  size="small"
                  icon={<HourglassEmptyOutlinedIcon />}
                  label="Capa em aberto"
                  sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "#fff" }}
                />
              )}
            </Stack>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              component={RouterLink}
              to="/rodadas"
              variant="outlined"
              startIcon={<ArrowBackOutlinedIcon />}
              sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.55)" }}
            >
              Times da semana
            </Button>
            {isAuthenticated ? (
              <Button
                variant="outlined"
                color="error"
                onClick={() => void removeMatchDay()}
                disabled={isDeletingMatchDay}
                startIcon={
                  isDeletingMatchDay ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <DeleteOutlineOutlinedIcon />
                  )
                }
                sx={{
                  color: "#ffb4a8",
                  borderColor: "rgba(255,180,168,0.6)",
                  "&:hover": {
                    borderColor: "#ffb4a8",
                    bgcolor: "rgba(255,180,168,0.08)",
                  },
                }}
              >
                Excluir rodada
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Paper>

      {!matchDay.capaTeamId && isAuthenticated && matchDay.teams.length > 0 ? (
        <Alert severity="info" icon={<HourglassEmptyOutlinedIcon />}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ alignItems: { xs: "stretch", sm: "center" } }}
          >
            <Typography sx={{ flex: 1 }}>
              O cálculo automático empatou. Escolha o time capa manualmente.
            </Typography>
            <Select
              size="small"
              displayEmpty
              value={capaSelection}
              onChange={(event) => setCapaSelection(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="" disabled>
                Selecione o time
              </MenuItem>
              {matchDay.teams.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </Select>
            <Button
              variant="contained"
              size="small"
              disabled={!capaSelection || isSavingCapa}
              onClick={() => void chooseCapa()}
              startIcon={
                isSavingCapa ? <CircularProgress size={16} /> : undefined
              }
            >
              Definir capa
            </Button>
          </Stack>
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
          },
          gap: 2,
        }}
      >
        {matchDay.teams
          .slice()
          .sort((a, b) => a.teamOrder - b.teamOrder)
          .map((team) => (
            <TeamRosterCard
              key={team.id}
              team={team}
              isCapa={team.id === matchDay.capaTeamId}
              canEdit={isAuthenticated}
              isEditing={editingTeamId === team.id}
              editValue={teamNameDraft}
              isSavingName={isSavingTeamName}
              onStartEdit={() => startEditingTeamName(team)}
              onCancelEdit={cancelEditingTeamName}
              onChangeEditValue={setTeamNameDraft}
              onSubmitEdit={() => void submitTeamName()}
            />
          ))}
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Typography variant="h2">Confrontos</Typography>
            {isAuthenticated ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddOutlinedIcon />}
                onClick={openCreateConfrontoDialog}
                disabled={matchDay.teams.length < 2}
              >
                Adicionar confronto
              </Button>
            ) : null}
          </Stack>

          {sortedConfrontos.length === 0 ? (
            <Typography color="text.secondary">
              Nenhum confronto lançado ainda.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {sortedConfrontos.map((confronto) => (
                <ConfrontoRow
                  key={confronto.id}
                  confronto={confronto}
                  teamAName={teamsById.get(confronto.teamAId)?.name ?? "Time"}
                  teamBName={teamsById.get(confronto.teamBId)?.name ?? "Time"}
                  canManage={isAuthenticated}
                  isDeleting={deletingConfrontoId === confronto.id}
                  onOpen={() =>
                    navigate(
                      `/rodadas/${matchDayId}/confrontos/${confronto.id}`,
                    )
                  }
                  onEdit={() => openEditConfrontoDialog(confronto)}
                  onDelete={() => void removeConfronto(confronto)}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      <Dialog
        open={isConfrontoDialogOpen}
        onClose={closeConfrontoDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {editingConfrontoId ? "Editar confronto" : "Adicionar confronto"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {confrontoErrorMessage ? (
              <Alert severity="error">{confrontoErrorMessage}</Alert>
            ) : null}
            <Select
              displayEmpty
              value={confrontoForm.teamAId}
              onChange={(event) =>
                setConfrontoForm((current) => ({
                  ...current,
                  teamAId: event.target.value,
                }))
              }
              fullWidth
            >
              <MenuItem value="" disabled>
                Time A
              </MenuItem>
              {matchDay.teams.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </Select>
            <Select
              displayEmpty
              value={confrontoForm.teamBId}
              onChange={(event) =>
                setConfrontoForm((current) => ({
                  ...current,
                  teamBId: event.target.value,
                }))
              }
              fullWidth
            >
              <MenuItem value="" disabled>
                Time B
              </MenuItem>
              {matchDay.teams.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </Select>
            {isEditingManualScore ? (
              <Stack direction="row" spacing={1.5}>
                <TextField
                  label="Placar A"
                  type="number"
                  value={confrontoForm.scoreA}
                  onChange={(event) =>
                    setConfrontoForm((current) => ({
                      ...current,
                      scoreA: event.target.value,
                    }))
                  }
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                  fullWidth
                />
                <TextField
                  label="Placar B"
                  type="number"
                  value={confrontoForm.scoreB}
                  onChange={(event) =>
                    setConfrontoForm((current) => ({
                      ...current,
                      scoreB: event.target.value,
                    }))
                  }
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                  fullWidth
                />
              </Stack>
            ) : (
              <Alert severity="info">
                O placar é calculado automaticamente a partir dos gols
                lançados na tela do confronto.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeConfrontoDialog} disabled={isSavingConfronto}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void submitConfronto()}
            disabled={isSavingConfronto}
            startIcon={
              isSavingConfronto ? (
                <CircularProgress color="inherit" size={18} />
              ) : editingConfrontoId ? (
                <SaveOutlinedIcon />
              ) : (
                <AddOutlinedIcon />
              )
            }
          >
            {editingConfrontoId ? "Salvar" : "Adicionar"}
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
