import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import MilitaryTechOutlinedIcon from "@mui/icons-material/MilitaryTechOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import RemoveOutlinedIcon from "@mui/icons-material/RemoveOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ShuffleOutlinedIcon from "@mui/icons-material/ShuffleOutlined";
import SportsSoccerOutlinedIcon from "@mui/icons-material/SportsSoccerOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";
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
  createConfrontoSubstitution,
  deleteConfronto,
  deleteConfrontoSubstitution,
  deleteMatchDay,
  fetchMatchDay,
  renameMatchDayTeam,
  setConfrontoPlayerStats,
  setMatchDayCapa,
  updateConfronto,
  type ConfrontoScoreSource,
  type ConfrontoSubstitution,
  type MatchDayConfronto,
  type MatchDayDetail,
  type MatchDayPlayer,
  type MatchDayTeam,
} from "../features/matchDays/matchDaysApi";
import {
  fetchTeamDrawPlayers,
  mapApiPlayerToDrawParticipant,
} from "../features/teamDraw/services/usersApi";
import type { DrawParticipant } from "../features/teamDraw/types";

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

type StatsFormEntry = { goals: number; ownGoals: number; assists: number };

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

function getPlayerLabel(player: MatchDayPlayer) {
  return player.nickname ? `${player.name} (${player.nickname})` : player.name;
}

function getPlayerShortLabel(player: MatchDayPlayer) {
  return player.nickname || player.name;
}

function StatStepper({
  label,
  value,
  onIncrement,
  onDecrement,
  disabled,
}: {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
}) {
  return (
    <Stack
      direction="row"
      spacing={0.25}
      sx={{
        alignItems: "center",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        pl: 1,
        bgcolor: "#fff",
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 800, color: "text.secondary", minWidth: 40 }}
      >
        {label}
      </Typography>
      <IconButton
        size="small"
        onClick={onDecrement}
        disabled={disabled || value <= 0}
        aria-label={`Diminuir ${label}`}
      >
        <RemoveOutlinedIcon fontSize="small" />
      </IconButton>
      <Typography sx={{ width: 18, textAlign: "center", fontWeight: 900 }}>
        {value}
      </Typography>
      <IconButton
        size="small"
        onClick={onIncrement}
        disabled={disabled}
        aria-label={`Aumentar ${label}`}
      >
        <AddOutlinedIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

function putGoalkeepersFirst(players: MatchDayPlayer[]) {
  return [...players].sort((a, b) => {
    const aIsGoalkeeper = a.position === "GOALKEEPER" ? 0 : 1;
    const bIsGoalkeeper = b.position === "GOALKEEPER" ? 0 : 1;

    return aIsGoalkeeper - bIsGoalkeeper;
  });
}

type ConfrontoRosterPlayer = MatchDayPlayer & { isSubstitute: boolean };

function applySubstitutions(
  team: MatchDayTeam | undefined,
  substitutions: ConfrontoSubstitution[],
): ConfrontoRosterPlayer[] {
  const substitutionsByOutId = new Map(
    substitutions.map((substitution) => [
      substitution.outTeamPlayerId,
      substitution,
    ]),
  );

  return (team?.players ?? []).map((player) => {
    const substitution = substitutionsByOutId.get(player.teamPlayerId);

    if (!substitution) {
      return { ...player, isSubstitute: false };
    }

    return {
      id: substitution.id,
      teamPlayerId: substitution.id,
      playerId: substitution.inPlayer.playerId,
      name: substitution.inPlayer.name,
      nickname: substitution.inPlayer.nickname,
      jerseyNumber: substitution.inPlayer.jerseyNumber,
      photoUrl: substitution.inPlayer.photoUrl,
      position: substitution.inPlayer.position,
      type: substitution.inPlayer.type,
      isSubstitute: true,
    };
  });
}

function getEligibleTeamPlayers(
  team: MatchDayTeam | undefined,
  substitutions: ConfrontoSubstitution[],
) {
  const eligible = applySubstitutions(team, substitutions).filter(
    (player): player is ConfrontoRosterPlayer & { playerId: string } =>
      player.playerId !== null,
  );

  return putGoalkeepersFirst(eligible) as (ConfrontoRosterPlayer & {
    playerId: string;
  })[];
}

function getConfrontoEligibleTeams(
  confronto: Pick<MatchDayConfronto, "teamAId" | "teamBId" | "substitutions">,
  teamsById: Map<string, MatchDayTeam>,
) {
  const teamA = teamsById.get(confronto.teamAId);
  const teamB = teamsById.get(confronto.teamBId);

  return [
    {
      teamId: confronto.teamAId,
      teamName: teamA?.name ?? "Time A",
      players: getEligibleTeamPlayers(teamA, confronto.substitutions),
    },
    {
      teamId: confronto.teamBId,
      teamName: teamB?.name ?? "Time B",
      players: getEligibleTeamPlayers(teamB, confronto.substitutions),
    },
  ];
}

function getConfrontoEligiblePlayers(
  confronto: Pick<MatchDayConfronto, "teamAId" | "teamBId" | "substitutions">,
  teamsById: Map<string, MatchDayTeam>,
) {
  return getConfrontoEligibleTeams(confronto, teamsById).flatMap(
    (group) => group.players,
  );
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
  onEdit,
  onDelete,
  onManageStats,
  onManageSubstitutions,
}: {
  confronto: MatchDayConfronto;
  teamAName: string;
  teamBName: string;
  canManage: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onManageStats: () => void;
  onManageSubstitutions: () => void;
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
      <Chip label={`#${confronto.sequence}`} size="small" />
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: "center", flexWrap: "wrap" }}
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
      </Stack>
      <Tooltip title="Gols e assistências">
        <IconButton size="small" color="primary" onClick={onManageStats}>
          <SportsSoccerOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {canManage ? (
        <>
          <Tooltip title="Substituições">
            <IconButton size="small" onClick={onManageSubstitutions}>
              <SwapHorizOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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

  const [statsConfronto, setStatsConfronto] =
    useState<MatchDayConfronto | null>(null);
  const [statsForm, setStatsForm] = useState<
    Record<string, StatsFormEntry>
  >({});
  const [isSavingStats, setIsSavingStats] = useState(false);
  const [statsErrorMessage, setStatsErrorMessage] = useState("");

  const [substitutionConfronto, setSubstitutionConfronto] =
    useState<MatchDayConfronto | null>(null);
  const [substitutingOutTeamPlayerId, setSubstitutingOutTeamPlayerId] =
    useState<string | null>(null);
  const [substituteSelectedPlayerId, setSubstituteSelectedPlayerId] =
    useState("");
  const [substituteGuestName, setSubstituteGuestName] = useState("");
  const [isSavingSubstitution, setIsSavingSubstitution] = useState(false);
  const [substitutionErrorMessage, setSubstitutionErrorMessage] =
    useState("");
  const [removingSubstitutionId, setRemovingSubstitutionId] = useState<
    string | null
  >(null);
  const [registeredPlayers, setRegisteredPlayers] = useState<
    DrawParticipant[]
  >([]);
  const [isLoadingRegisteredPlayers, setIsLoadingRegisteredPlayers] =
    useState(false);
  const [hasLoadedRegisteredPlayers, setHasLoadedRegisteredPlayers] =
    useState(false);

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

  const rosterPlayerIds = useMemo(() => {
    const ids = new Set<string>();

    (matchDay?.teams ?? []).forEach((team) => {
      team.players.forEach((player) => {
        if (player.playerId) {
          ids.add(player.playerId);
        }
      });
    });

    return ids;
  }, [matchDay]);

  const availableSubstitutePlayers = useMemo(
    () =>
      registeredPlayers.filter(
        (player) => !rosterPlayerIds.has(String(player.id)),
      ),
    [registeredPlayers, rosterPlayerIds],
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

  const openStatsDialog = (confronto: MatchDayConfronto) => {
    const eligiblePlayers = getConfrontoEligiblePlayers(confronto, teamsById);
    const initialForm: Record<string, StatsFormEntry> = {};

    eligiblePlayers.forEach((player) => {
      const existing = confronto.playerStats.find(
        (stat) => stat.playerId === player.playerId,
      );

      initialForm[player.playerId] = {
        goals: existing?.goals ?? 0,
        ownGoals: existing?.ownGoals ?? 0,
        assists: existing?.assists ?? 0,
      };
    });

    setStatsForm(initialForm);
    setStatsConfronto(confronto);
    setStatsErrorMessage("");
  };

  const closeStatsDialog = () => {
    if (isSavingStats) {
      return;
    }

    setStatsConfronto(null);
    setStatsForm({});
    setStatsErrorMessage("");
  };

  const emptyStatsEntry: StatsFormEntry = { goals: 0, ownGoals: 0, assists: 0 };

  const changeStatsField = (
    playerId: string,
    field: keyof StatsFormEntry,
    delta: number,
  ) => {
    setStatsForm((current) => {
      const entry = current[playerId] ?? emptyStatsEntry;
      const nextValue = Math.max(0, entry[field] + delta);

      return { ...current, [playerId]: { ...entry, [field]: nextValue } };
    });
  };

  const submitStats = async () => {
    if (!statsConfronto) {
      return;
    }

    const eligiblePlayers = getConfrontoEligiblePlayers(
      statsConfronto,
      teamsById,
    );
    const entries = eligiblePlayers.map((player) => {
      const values = statsForm[player.playerId] ?? emptyStatsEntry;

      return {
        playerId: player.playerId,
        goals: values.goals,
        ownGoals: values.ownGoals,
        assists: values.assists,
      };
    });

    setIsSavingStats(true);
    setStatsErrorMessage("");

    try {
      await setConfrontoPlayerStats(statsConfronto.id, entries);
      showSnackbar("Estatísticas do confronto atualizadas.");
      setStatsConfronto(null);
      setStatsForm({});
      await refreshMatchDay();
    } catch {
      setStatsErrorMessage("Não foi possível salvar as estatísticas.");
    } finally {
      setIsSavingStats(false);
    }
  };

  const ensureRegisteredPlayersLoaded = () => {
    if (hasLoadedRegisteredPlayers || isLoadingRegisteredPlayers) {
      return;
    }

    setIsLoadingRegisteredPlayers(true);

    fetchTeamDrawPlayers()
      .then((players) => {
        setRegisteredPlayers(players.map(mapApiPlayerToDrawParticipant));
        setHasLoadedRegisteredPlayers(true);
      })
      .catch(() => {
        showSnackbar("Não foi possível carregar os jogadores cadastrados.", "error");
      })
      .finally(() => {
        setIsLoadingRegisteredPlayers(false);
      });
  };

  const openSubstitutionDialog = (confronto: MatchDayConfronto) => {
    setSubstitutionConfronto(confronto);
    setSubstitutingOutTeamPlayerId(null);
    setSubstituteSelectedPlayerId("");
    setSubstituteGuestName("");
    setSubstitutionErrorMessage("");
    ensureRegisteredPlayersLoaded();
  };

  const closeSubstitutionDialog = () => {
    if (isSavingSubstitution || removingSubstitutionId) {
      return;
    }

    setSubstitutionConfronto(null);
    setSubstitutingOutTeamPlayerId(null);
    setSubstituteSelectedPlayerId("");
    setSubstituteGuestName("");
    setSubstitutionErrorMessage("");
  };

  const startSubstitution = (teamPlayerId: string) => {
    setSubstitutingOutTeamPlayerId(teamPlayerId);
    setSubstituteSelectedPlayerId("");
    setSubstituteGuestName("");
    setSubstitutionErrorMessage("");
  };

  const cancelSubstitution = () => {
    setSubstitutingOutTeamPlayerId(null);
    setSubstituteSelectedPlayerId("");
    setSubstituteGuestName("");
    setSubstitutionErrorMessage("");
  };

  const submitSubstitution = async () => {
    if (!substitutionConfronto || !substitutingOutTeamPlayerId) {
      return;
    }

    const trimmedGuestName = substituteGuestName.trim();

    if (!substituteSelectedPlayerId && !trimmedGuestName) {
      setSubstitutionErrorMessage(
        "Selecione um jogador cadastrado ou digite um nome.",
      );
      return;
    }

    setIsSavingSubstitution(true);
    setSubstitutionErrorMessage("");

    try {
      await createConfrontoSubstitution(substitutionConfronto.id, {
        outTeamPlayerId: substitutingOutTeamPlayerId,
        in: substituteSelectedPlayerId
          ? { playerId: substituteSelectedPlayerId }
          : { name: trimmedGuestName, type: "GUEST" },
      });
      showSnackbar("Substituição registrada.");
      setSubstitutingOutTeamPlayerId(null);
      setSubstituteSelectedPlayerId("");
      setSubstituteGuestName("");

      const refreshed = await refreshMatchDay();
      const updatedConfronto = refreshed?.confrontos.find(
        (confronto) => confronto.id === substitutionConfronto.id,
      );

      if (updatedConfronto) {
        setSubstitutionConfronto(updatedConfronto);
      }
    } catch {
      setSubstitutionErrorMessage("Não foi possível registrar a substituição.");
    } finally {
      setIsSavingSubstitution(false);
    }
  };

  const removeSubstitution = async (substitution: ConfrontoSubstitution) => {
    if (!substitutionConfronto) {
      return;
    }

    if (
      !window.confirm(
        "Desfazer esta substituição? O gol/assistência do substituto nesse confronto será removido.",
      )
    ) {
      return;
    }

    setRemovingSubstitutionId(substitution.id);

    try {
      await deleteConfrontoSubstitution(
        substitutionConfronto.id,
        substitution.id,
      );
      showSnackbar("Substituição desfeita.");

      const refreshed = await refreshMatchDay();
      const updatedConfronto = refreshed?.confrontos.find(
        (confronto) => confronto.id === substitutionConfronto.id,
      );

      if (updatedConfronto) {
        setSubstitutionConfronto(updatedConfronto);
      }
    } catch {
      showSnackbar("Não foi possível desfazer a substituição.", "error");
    } finally {
      setRemovingSubstitutionId(null);
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

  const eligibleStatsTeams = statsConfronto
    ? getConfrontoEligibleTeams(statsConfronto, teamsById)
    : [];
  const eligibleStatsPlayers = eligibleStatsTeams.flatMap(
    (group) => group.players,
  );

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
                  onEdit={() => openEditConfrontoDialog(confronto)}
                  onDelete={() => void removeConfronto(confronto)}
                  onManageStats={() => openStatsDialog(confronto)}
                  onManageSubstitutions={() => openSubstitutionDialog(confronto)}
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
                lançados em "Gols e assistências".
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

      <Dialog
        open={Boolean(statsConfronto)}
        onClose={closeStatsDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Gols e assistências do confronto</DialogTitle>
        <DialogContent>
          {statsConfronto ? (
            <Stack spacing={2} sx={{ pt: 1 }}>
              {statsErrorMessage ? (
                <Alert severity="error">{statsErrorMessage}</Alert>
              ) : null}
              {eligibleStatsPlayers.length === 0 ? (
                <Typography color="text.secondary">
                  Nenhum jogador cadastrado nesses times para lançar
                  estatísticas. Convidados avulsos não podem ser creditados.
                </Typography>
              ) : (
                <Stack spacing={2.5} sx={{ maxHeight: 420, overflowY: "auto", pr: 0.5 }}>
                  {eligibleStatsTeams.map((group) => (
                    <Stack key={group.teamId} spacing={1}>
                      <Typography
                        variant="overline"
                        sx={{
                          fontWeight: 800,
                          color: "primary.main",
                          lineHeight: 1.2,
                        }}
                      >
                        {group.teamName}
                      </Typography>
                      {group.players.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Nenhum jogador cadastrado neste time.
                        </Typography>
                      ) : (
                        <Stack spacing={1}>
                          {group.players.map((player) => {
                            const entry =
                              statsForm[player.playerId] ?? emptyStatsEntry;

                            return (
                              <Stack
                                key={player.playerId}
                                spacing={1}
                                sx={{
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: 2,
                                  p: 1,
                                  bgcolor: "#f7faf8",
                                }}
                              >
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  sx={{ alignItems: "center" }}
                                >
                                  <Avatar
                                    src={player.photoUrl ?? undefined}
                                    alt={player.name}
                                    sx={{ width: 30, height: 30, fontSize: 12 }}
                                  >
                                    {player.name.charAt(0).toLocaleUpperCase("pt-BR")}
                                  </Avatar>
                                  <Typography
                                    sx={{ flex: 1, fontWeight: 800, minWidth: 0 }}
                                    noWrap
                                  >
                                    {getPlayerShortLabel(player)}
                                  </Typography>
                                  {player.position === "GOALKEEPER" ? (
                                    <Chip
                                      label="Goleiro"
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      sx={{ flexShrink: 0 }}
                                    />
                                  ) : null}
                                  {player.isSubstitute ? (
                                    <Chip
                                      label="Substituto"
                                      size="small"
                                      color="secondary"
                                      variant="outlined"
                                      sx={{ flexShrink: 0 }}
                                    />
                                  ) : null}
                                </Stack>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  useFlexGap
                                  sx={{ flexWrap: "wrap" }}
                                >
                                  <StatStepper
                                    label="Gols"
                                    value={entry.goals}
                                    disabled={isSavingStats}
                                    onIncrement={() =>
                                      changeStatsField(player.playerId, "goals", 1)
                                    }
                                    onDecrement={() =>
                                      changeStatsField(player.playerId, "goals", -1)
                                    }
                                  />
                                  <StatStepper
                                    label="Contra"
                                    value={entry.ownGoals}
                                    disabled={isSavingStats}
                                    onIncrement={() =>
                                      changeStatsField(player.playerId, "ownGoals", 1)
                                    }
                                    onDecrement={() =>
                                      changeStatsField(player.playerId, "ownGoals", -1)
                                    }
                                  />
                                  <StatStepper
                                    label="Assist."
                                    value={entry.assists}
                                    disabled={isSavingStats}
                                    onIncrement={() =>
                                      changeStatsField(player.playerId, "assists", 1)
                                    }
                                    onDecrement={() =>
                                      changeStatsField(player.playerId, "assists", -1)
                                    }
                                  />
                                </Stack>
                              </Stack>
                            );
                          })}
                        </Stack>
                      )}
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeStatsDialog} disabled={isSavingStats}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void submitStats()}
            disabled={isSavingStats || eligibleStatsPlayers.length === 0}
            startIcon={
              isSavingStats ? (
                <CircularProgress color="inherit" size={18} />
              ) : (
                <SaveOutlinedIcon />
              )
            }
          >
            Salvar estatísticas
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(substitutionConfronto)}
        onClose={closeSubstitutionDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Substituições do confronto</DialogTitle>
        <DialogContent>
          {substitutionConfronto ? (
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Alert severity="info">
                Substitua um jogador ausente só nesse confronto. Ele continua
                normal nos outros confrontos da rodada.
              </Alert>
              {substitutionErrorMessage ? (
                <Alert severity="error">{substitutionErrorMessage}</Alert>
              ) : null}
              {[
                {
                  teamId: substitutionConfronto.teamAId,
                  team: teamsById.get(substitutionConfronto.teamAId),
                },
                {
                  teamId: substitutionConfronto.teamBId,
                  team: teamsById.get(substitutionConfronto.teamBId),
                },
              ].map(({ teamId, team }) => (
                <Stack key={teamId} spacing={1}>
                  <Typography
                    variant="overline"
                    sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1.2 }}
                  >
                    {team?.name ?? "Time"}
                  </Typography>
                  <Stack spacing={1}>
                    {(team?.players ?? []).map((player) => {
                      const substitution = substitutionConfronto.substitutions.find(
                        (item) => item.outTeamPlayerId === player.teamPlayerId,
                      );
                      const isEditingThisPlayer =
                        substitutingOutTeamPlayerId === player.teamPlayerId;

                      return (
                        <Stack
                          key={player.teamPlayerId}
                          spacing={1}
                          sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 2,
                            p: 1,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: "center" }}
                          >
                            <Avatar
                              src={player.photoUrl ?? undefined}
                              alt={player.name}
                              sx={{ width: 30, height: 30, fontSize: 12 }}
                            >
                              {player.name.charAt(0).toLocaleUpperCase("pt-BR")}
                            </Avatar>
                            <Typography
                              sx={{ flex: 1, fontWeight: 800, minWidth: 0 }}
                              noWrap
                            >
                              {getPlayerShortLabel(player)}
                            </Typography>
                            {!substitution ? (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<SwapHorizOutlinedIcon />}
                                onClick={() =>
                                  isEditingThisPlayer
                                    ? cancelSubstitution()
                                    : startSubstitution(player.teamPlayerId)
                                }
                              >
                                {isEditingThisPlayer ? "Cancelar" : "Substituir"}
                              </Button>
                            ) : null}
                          </Stack>

                          {substitution ? (
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{
                                alignItems: "center",
                                bgcolor: "#f7faf8",
                                borderRadius: 1.5,
                                p: 1,
                              }}
                            >
                              <SwapHorizOutlinedIcon
                                fontSize="small"
                                color="action"
                              />
                              <Typography
                                variant="body2"
                                sx={{ flex: 1, fontWeight: 700, minWidth: 0 }}
                                noWrap
                              >
                                {substitution.inPlayer.nickname
                                  ? substitution.inPlayer.nickname
                                  : substitution.inPlayer.name}
                              </Typography>
                              <Tooltip title="Desfazer substituição">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => void removeSubstitution(substitution)}
                                    disabled={removingSubstitutionId === substitution.id}
                                  >
                                    {removingSubstitutionId === substitution.id ? (
                                      <CircularProgress size={16} color="inherit" />
                                    ) : (
                                      <UndoOutlinedIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          ) : null}

                          {isEditingThisPlayer ? (
                            <Stack spacing={1} sx={{ pt: 0.5 }}>
                              <Select
                                displayEmpty
                                size="small"
                                value={substituteSelectedPlayerId}
                                disabled={
                                  isLoadingRegisteredPlayers ||
                                  availableSubstitutePlayers.length === 0
                                }
                                onChange={(event) => {
                                  setSubstituteSelectedPlayerId(event.target.value);
                                  setSubstituteGuestName("");
                                }}
                                fullWidth
                              >
                                <MenuItem value="">
                                  {isLoadingRegisteredPlayers
                                    ? "Carregando jogadores..."
                                    : availableSubstitutePlayers.length === 0
                                      ? "Nenhum jogador disponível"
                                      : "Selecionar jogador cadastrado"}
                                </MenuItem>
                                {availableSubstitutePlayers.map((candidate) => (
                                  <MenuItem key={candidate.id} value={String(candidate.id)}>
                                    {candidate.nickname
                                      ? `${candidate.name} (${candidate.nickname})`
                                      : candidate.name}
                                  </MenuItem>
                                ))}
                              </Select>
                              <Divider>ou</Divider>
                              <TextField
                                label="Nome digitado"
                                size="small"
                                value={substituteGuestName}
                                onChange={(event) => {
                                  setSubstituteGuestName(event.target.value);
                                  setSubstituteSelectedPlayerId("");
                                }}
                                fullWidth
                              />
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={
                                  isSavingSubstitution ? (
                                    <CircularProgress color="inherit" size={16} />
                                  ) : (
                                    <PersonAddAltOutlinedIcon />
                                  )
                                }
                                onClick={() => void submitSubstitution()}
                                disabled={
                                  isSavingSubstitution ||
                                  (!substituteSelectedPlayerId &&
                                    !substituteGuestName.trim())
                                }
                              >
                                Confirmar substituição
                              </Button>
                            </Stack>
                          ) : null}
                        </Stack>
                      );
                    })}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={closeSubstitutionDialog}
            disabled={isSavingSubstitution || Boolean(removingSubstitutionId)}
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
