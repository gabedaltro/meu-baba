import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandLessOutlinedIcon from "@mui/icons-material/ExpandLessOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import RemoveOutlinedIcon from "@mui/icons-material/RemoveOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
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
import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../features/auth/authContext";
import { formatMatchDayDateShort } from "../features/matchDays/format";
import {
  createConfrontoSubstitution,
  deleteConfrontoSubstitution,
  fetchMatchDay,
  setConfrontoPlayerStats,
  updateConfronto,
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

type StatsFormEntry = { goals: number; ownGoals: number; assists: number };
const emptyStatsEntry: StatsFormEntry = { goals: 0, ownGoals: 0, assists: 0 };

type SaveState = "idle" | "saving" | "saved" | "error";

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

function getPlayerShortLabel(player: MatchDayPlayer) {
  return player.nickname || player.name;
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

function getStatSummary(entry: StatsFormEntry) {
  const parts: string[] = [];

  if (entry.goals > 0) {
    parts.push(`${entry.goals} gol${entry.goals === 1 ? "" : "s"}`);
  }

  if (entry.assists > 0) {
    parts.push(`${entry.assists} assist.`);
  }

  if (entry.ownGoals > 0) {
    parts.push(`${entry.ownGoals} contra`);
  }

  return parts.join(" · ");
}

function StatStepper({
  label,
  value,
  onIncrement,
  onDecrement,
}: {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <Stack
      sx={{
        flex: 1,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2.5,
        p: 1,
        alignItems: "center",
        gap: 0.75,
        minWidth: 84,
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 800, color: "text.secondary", letterSpacing: "0.05em" }}
      >
        {label.toUpperCase()}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <IconButton
          size="small"
          onClick={onDecrement}
          disabled={value <= 0}
          aria-label={`Diminuir ${label}`}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <RemoveOutlinedIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ width: 20, textAlign: "center", fontWeight: 900 }}>
          {value}
        </Typography>
        <IconButton
          size="small"
          onClick={onIncrement}
          aria-label={`Aumentar ${label}`}
          sx={{ bgcolor: "primary.main", color: "#fff", "&:hover": { bgcolor: "primary.dark" } }}
        >
          <AddOutlinedIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Stack>
  );
}

function ConfrontoContent({
  confronto,
  teamAName,
  teamBName,
  teamsById,
  canManage,
  availableSubstitutePlayers,
  isLoadingRegisteredPlayers,
  onEnsureRegisteredPlayersLoaded,
  onRefreshMatchDay,
  onShowSnackbar,
}: {
  confronto: MatchDayConfronto;
  teamAName: string;
  teamBName: string;
  teamsById: Map<string, MatchDayTeam>;
  canManage: boolean;
  availableSubstitutePlayers: DrawParticipant[];
  isLoadingRegisteredPlayers: boolean;
  onEnsureRegisteredPlayersLoaded: () => void;
  onRefreshMatchDay: () => Promise<MatchDayDetail | undefined>;
  onShowSnackbar: (message: string, severity?: "success" | "error") => void;
}) {
  const eligibleTeams = useMemo(
    () => getConfrontoEligibleTeams(confronto, teamsById),
    [confronto, teamsById],
  );

  const [statsForm, setStatsForm] = useState<Record<string, StatsFormEntry>>(
    () => {
      const initial: Record<string, StatsFormEntry> = {};

      eligibleTeams.forEach((group) => {
        group.players.forEach((player) => {
          const existing = confronto.playerStats.find(
            (stat) => stat.playerId === player.playerId,
          );

          initial[player.playerId] = {
            goals: existing?.goals ?? 0,
            ownGoals: existing?.ownGoals ?? 0,
            assists: existing?.assists ?? 0,
          };
        });
      });

      return initial;
    },
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [expandedTeamPlayerId, setExpandedTeamPlayerId] = useState<
    string | null
  >(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const [isManualScoreDialogOpen, setIsManualScoreDialogOpen] =
    useState(false);
  const [manualScoreForm, setManualScoreForm] = useState({
    scoreA: String(confronto.scoreA),
    scoreB: String(confronto.scoreB),
  });
  const [isSavingManualScore, setIsSavingManualScore] = useState(false);
  const [manualScoreErrorMessage, setManualScoreErrorMessage] = useState("");

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const persistStats = (form: Record<string, StatsFormEntry>) => {
    const entries = eligibleTeams.flatMap((group) =>
      group.players.map((player) => {
        const values = form[player.playerId] ?? emptyStatsEntry;

        return {
          playerId: player.playerId,
          goals: values.goals,
          ownGoals: values.ownGoals,
          assists: values.assists,
        };
      }),
    );

    setConfrontoPlayerStats(confronto.id, entries)
      .then(() => {
        setSaveState("saved");
        return onRefreshMatchDay();
      })
      .catch(() => {
        setSaveState("error");
        onShowSnackbar("Não foi possível salvar as estatísticas.", "error");
      });
  };

  const changeStatsField = (
    playerId: string,
    field: keyof StatsFormEntry,
    delta: number,
  ) => {
    const entry = statsForm[playerId] ?? emptyStatsEntry;
    const nextValue = Math.max(0, entry[field] + delta);
    const nextForm = {
      ...statsForm,
      [playerId]: { ...entry, [field]: nextValue },
    };

    setStatsForm(nextForm);
    setSaveState("saving");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      persistStats(nextForm);
    }, 700);
  };

  const startSubstitution = (teamPlayerId: string) => {
    setSubstitutingOutTeamPlayerId(teamPlayerId);
    setSubstituteSelectedPlayerId("");
    setSubstituteGuestName("");
    setSubstitutionErrorMessage("");
    onEnsureRegisteredPlayersLoaded();
  };

  const cancelSubstitution = () => {
    setSubstitutingOutTeamPlayerId(null);
    setSubstituteSelectedPlayerId("");
    setSubstituteGuestName("");
    setSubstitutionErrorMessage("");
  };

  const submitSubstitution = async () => {
    if (!substitutingOutTeamPlayerId) {
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
      await createConfrontoSubstitution(confronto.id, {
        outTeamPlayerId: substitutingOutTeamPlayerId,
        in: substituteSelectedPlayerId
          ? { playerId: substituteSelectedPlayerId }
          : { name: trimmedGuestName, type: "GUEST" },
      });
      onShowSnackbar("Substituição registrada.");
      setSubstitutingOutTeamPlayerId(null);
      setSubstituteSelectedPlayerId("");
      setSubstituteGuestName("");
      await onRefreshMatchDay();
    } catch {
      setSubstitutionErrorMessage("Não foi possível registrar a substituição.");
    } finally {
      setIsSavingSubstitution(false);
    }
  };

  const removeSubstitution = async (substitution: ConfrontoSubstitution) => {
    if (
      !window.confirm(
        "Desfazer esta substituição? O gol/assistência do substituto nesse confronto será removido.",
      )
    ) {
      return;
    }

    setRemovingSubstitutionId(substitution.id);

    try {
      await deleteConfrontoSubstitution(confronto.id, substitution.id);
      onShowSnackbar("Substituição desfeita.");
      await onRefreshMatchDay();
    } catch {
      onShowSnackbar("Não foi possível desfazer a substituição.", "error");
    } finally {
      setRemovingSubstitutionId(null);
    }
  };

  const openManualScoreDialog = () => {
    setManualScoreForm({
      scoreA: String(confronto.scoreA),
      scoreB: String(confronto.scoreB),
    });
    setManualScoreErrorMessage("");
    setIsManualScoreDialogOpen(true);
  };

  const closeManualScoreDialog = () => {
    if (isSavingManualScore) {
      return;
    }

    setIsManualScoreDialogOpen(false);
  };

  const submitManualScore = async () => {
    const scoreA = Number(manualScoreForm.scoreA || 0);
    const scoreB = Number(manualScoreForm.scoreB || 0);

    if (
      !Number.isInteger(scoreA) ||
      !Number.isInteger(scoreB) ||
      scoreA < 0 ||
      scoreB < 0
    ) {
      setManualScoreErrorMessage(
        "O placar deve ser um número inteiro maior ou igual a zero.",
      );
      return;
    }

    setIsSavingManualScore(true);
    setManualScoreErrorMessage("");

    try {
      await updateConfronto(confronto.id, { scoreA, scoreB });
      onShowSnackbar("Placar atualizado.");
      setIsManualScoreDialogOpen(false);
      await onRefreshMatchDay();
    } catch {
      setManualScoreErrorMessage("Não foi possível salvar o placar.");
    } finally {
      setIsSavingManualScore(false);
    }
  };

  const winner =
    confronto.scoreA === confronto.scoreB
      ? null
      : confronto.scoreA > confronto.scoreB
        ? "A"
        : "B";

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", justifyContent: "center" }}
        >
          <Typography
            sx={{
              flex: 1,
              textAlign: "right",
              fontWeight: winner === "A" ? 900 : 600,
              color: winner === "B" ? "text.secondary" : "text.primary",
            }}
            noWrap
          >
            {teamAName}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "baseline", flexShrink: 0 }}
          >
            <Typography
              sx={{
                fontSize: { xs: "2.5rem", sm: "2.75rem" },
                fontWeight: 900,
                lineHeight: 1,
                color: winner === "B" ? "text.secondary" : "text.primary",
              }}
            >
              {confronto.scoreA}
            </Typography>
            <Typography
              sx={{ fontSize: "1.1rem", fontWeight: 700, color: "text.secondary" }}
            >
              &times;
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "2.5rem", sm: "2.75rem" },
                fontWeight: 900,
                lineHeight: 1,
                color: winner === "A" ? "text.secondary" : "text.primary",
              }}
            >
              {confronto.scoreB}
            </Typography>
          </Stack>
          <Typography
            sx={{
              flex: 1,
              textAlign: "left",
              fontWeight: winner === "B" ? 900 : 600,
              color: winner === "A" ? "text.secondary" : "text.primary",
            }}
            noWrap
          >
            {teamBName}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "center", mt: 1.5 }}
        >
          {confronto.scoreSource === "GOALS" ? (
            <Chip
              icon={<LockOutlinedIcon sx={{ fontSize: 14 }} />}
              label="Placar automático · soma os gols abaixo"
              size="small"
              sx={{ bgcolor: "#eef5f0", color: "primary.main", fontWeight: 700 }}
            />
          ) : canManage ? (
            <Button
              size="small"
              startIcon={<EditOutlinedIcon fontSize="small" />}
              onClick={openManualScoreDialog}
            >
              Editar placar manual
            </Button>
          ) : (
            <Chip label="Placar manual" size="small" variant="outlined" />
          )}
        </Stack>

        <Stack
          direction="row"
          spacing={0.5}
          sx={{ alignItems: "center", justifyContent: "center", mt: 1, minHeight: 20 }}
        >
          {saveState === "saving" ? (
            <>
              <CircularProgress size={12} />
              <Typography variant="caption" color="text.secondary">
                Salvando estatísticas…
              </Typography>
            </>
          ) : null}
          {saveState === "saved" ? (
            <>
              <CheckOutlinedIcon sx={{ fontSize: 14, color: "primary.main" }} />
              <Typography variant="caption" color="text.secondary">
                Estatísticas salvas
              </Typography>
            </>
          ) : null}
          {saveState === "error" ? (
            <Typography variant="caption" color="error">
              Não foi possível salvar as estatísticas
            </Typography>
          ) : null}
        </Stack>
      </Paper>

      {eligibleTeams.map((group) => (
        <Stack key={group.teamId} spacing={1}>
          <Typography
            variant="overline"
            sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1.2 }}
          >
            {group.teamName}
          </Typography>

          {group.players.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhum jogador cadastrado neste time para lançar estatísticas.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {group.players.map((player) => {
                const entry = statsForm[player.playerId] ?? emptyStatsEntry;
                const isExpanded = expandedTeamPlayerId === player.teamPlayerId;
                const isSubstituting =
                  substitutingOutTeamPlayerId === player.teamPlayerId;
                const activeSubstitution = player.isSubstitute
                  ? confronto.substitutions.find(
                      (item) => item.id === player.teamPlayerId,
                    )
                  : undefined;

                return (
                  <Stack
                    key={player.teamPlayerId}
                    spacing={1}
                    sx={{
                      border: "1px solid",
                      borderColor: isExpanded ? "primary.main" : "divider",
                      borderRadius: 2,
                      p: 1,
                      bgcolor: isExpanded ? "#ffffff" : "#f7faf8",
                      boxShadow: isExpanded
                        ? "0 4px 14px rgba(31,122,77,0.14)"
                        : "none",
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Avatar
                        src={player.photoUrl ?? undefined}
                        alt={player.name}
                        sx={{
                          width: 34,
                          height: 34,
                          fontSize: 13,
                          flexShrink: 0,
                          ...(player.position === "GOALKEEPER"
                            ? { bgcolor: "primary.main" }
                            : {}),
                        }}
                      >
                        {player.name.charAt(0).toLocaleUpperCase("pt-BR")}
                      </Avatar>
                      <Stack
                        direction="row"
                        spacing={0.75}
                        useFlexGap
                        sx={{ flex: 1, minWidth: 0, alignItems: "center", flexWrap: "wrap" }}
                      >
                        <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap>
                          {getPlayerShortLabel(player)}
                        </Typography>
                        {player.position === "GOALKEEPER" ? (
                          <Chip label="Goleiro" size="small" color="primary" variant="outlined" />
                        ) : null}
                        {player.isSubstitute ? (
                          <Chip label="Substituto" size="small" color="secondary" variant="outlined" />
                        ) : null}
                        {!isExpanded && getStatSummary(entry) ? (
                          <Chip
                            label={getStatSummary(entry)}
                            size="small"
                            sx={{ bgcolor: "#eef1ee", color: "text.secondary", fontWeight: 700 }}
                          />
                        ) : null}
                      </Stack>
                      {canManage ? (
                        activeSubstitution ? (
                          <Tooltip title="Desfazer substituição">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => void removeSubstitution(activeSubstitution)}
                                disabled={removingSubstitutionId === activeSubstitution.id}
                              >
                                {removingSubstitutionId === activeSubstitution.id ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <UndoOutlinedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Substituir jogador">
                            <IconButton
                              size="small"
                              onClick={() =>
                                isSubstituting
                                  ? cancelSubstitution()
                                  : startSubstitution(player.teamPlayerId)
                              }
                            >
                              <SwapHorizOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )
                      ) : null}
                      {canManage ? (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setExpandedTeamPlayerId(isExpanded ? null : player.teamPlayerId)
                          }
                          aria-label={isExpanded ? "Recolher" : `Lançar estatística de ${player.name}`}
                        >
                          {isExpanded ? (
                            <ExpandLessOutlinedIcon fontSize="small" />
                          ) : (
                            <ExpandMoreOutlinedIcon fontSize="small" />
                          )}
                        </IconButton>
                      ) : null}
                    </Stack>

                    {isSubstituting ? (
                      <Stack spacing={1} sx={{ pt: 0.5 }}>
                        {substitutionErrorMessage ? (
                          <Alert severity="error" sx={{ py: 0 }}>
                            {substitutionErrorMessage}
                          </Alert>
                        ) : null}
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
                            (!substituteSelectedPlayerId && !substituteGuestName.trim())
                          }
                        >
                          Confirmar substituição
                        </Button>
                      </Stack>
                    ) : null}

                    {isExpanded ? (
                      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                        <StatStepper
                          label="Gols"
                          value={entry.goals}
                          onIncrement={() => changeStatsField(player.playerId, "goals", 1)}
                          onDecrement={() => changeStatsField(player.playerId, "goals", -1)}
                        />
                        <StatStepper
                          label="Contra"
                          value={entry.ownGoals}
                          onIncrement={() => changeStatsField(player.playerId, "ownGoals", 1)}
                          onDecrement={() => changeStatsField(player.playerId, "ownGoals", -1)}
                        />
                        <StatStepper
                          label="Assist."
                          value={entry.assists}
                          onIncrement={() => changeStatsField(player.playerId, "assists", 1)}
                          onDecrement={() => changeStatsField(player.playerId, "assists", -1)}
                        />
                      </Stack>
                    ) : null}
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Stack>
      ))}

      <Dialog open={isManualScoreDialogOpen} onClose={closeManualScoreDialog} fullWidth maxWidth="xs">
        <DialogTitle>Editar placar</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {manualScoreErrorMessage ? (
              <Alert severity="error">{manualScoreErrorMessage}</Alert>
            ) : null}
            <Stack direction="row" spacing={1.5}>
              <TextField
                label={teamAName}
                type="number"
                value={manualScoreForm.scoreA}
                onChange={(event) =>
                  setManualScoreForm((current) => ({ ...current, scoreA: event.target.value }))
                }
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                fullWidth
              />
              <TextField
                label={teamBName}
                type="number"
                value={manualScoreForm.scoreB}
                onChange={(event) =>
                  setManualScoreForm((current) => ({ ...current, scoreB: event.target.value }))
                }
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeManualScoreDialog} disabled={isSavingManualScore}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void submitManualScore()}
            disabled={isSavingManualScore}
            startIcon={
              isSavingManualScore ? (
                <CircularProgress color="inherit" size={18} />
              ) : (
                <SaveOutlinedIcon />
              )
            }
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export function ConfrontoDetailPage() {
  const navigate = useNavigate();
  const { matchDayId, confrontoId } = useParams<{
    matchDayId: string;
    confrontoId: string;
  }>();
  const { isAuthenticated } = useAuth();

  const [matchDay, setMatchDay] = useState<MatchDayDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [registeredPlayers, setRegisteredPlayers] = useState<DrawParticipant[]>([]);
  const [isLoadingRegisteredPlayers, setIsLoadingRegisteredPlayers] = useState(false);
  const [hasLoadedRegisteredPlayers, setHasLoadedRegisteredPlayers] = useState(false);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

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

  const teamsById = useMemo(
    () => new Map((matchDay?.teams ?? []).map((team) => [team.id, team])),
    [matchDay],
  );

  const sortedConfrontos = useMemo(
    () => [...(matchDay?.confrontos ?? [])].sort((a, b) => a.sequence - b.sequence),
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
    () => registeredPlayers.filter((player) => !rosterPlayerIds.has(String(player.id))),
    [registeredPlayers, rosterPlayerIds],
  );

  const activeIndex = sortedConfrontos.findIndex((item) => item.id === confrontoId);
  const activeConfronto = activeIndex >= 0 ? sortedConfrontos[activeIndex] : null;
  const prevConfronto = activeIndex > 0 ? sortedConfrontos[activeIndex - 1] : null;
  const nextConfronto =
    activeIndex >= 0 && activeIndex < sortedConfrontos.length - 1
      ? sortedConfrontos[activeIndex + 1]
      : null;

  const goToConfronto = (id: string) => {
    navigate(`/rodadas/${matchDayId}/confrontos/${id}`, { replace: true });
  };

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={64} />
        <Skeleton variant="rounded" height={44} />
        <Skeleton variant="rounded" height={180} />
        <Skeleton variant="rounded" height={260} />
      </Stack>
    );
  }

  if (errorMessage || !matchDay) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{errorMessage || "Rodada não encontrada."}</Alert>
        <Button
          onClick={() => navigate("/rodadas")}
          startIcon={<ArrowBackOutlinedIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          Voltar para times da semana
        </Button>
      </Stack>
    );
  }

  if (!activeConfronto) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">Confronto não encontrado nesta rodada.</Alert>
        <Button
          onClick={() => navigate(`/rodadas/${matchDayId}`)}
          startIcon={<ArrowBackOutlinedIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          Voltar para a rodada
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2} sx={{ pb: 4 }}>
      <Paper
        variant="outlined"
        sx={{
          bgcolor: "#155b39",
          borderColor: "rgba(255,255,255,0.18)",
          borderRadius: 2,
          px: 1,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <IconButton
          onClick={() => navigate(`/rodadas/${matchDayId}`)}
          sx={{ color: "#fff", flexShrink: 0 }}
          aria-label="Voltar para a rodada"
        >
          <ArrowBackOutlinedIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 15 }} noWrap>
            Confronto #{activeConfronto.sequence} de {sortedConfrontos.length}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: 12 }} noWrap>
            {formatMatchDayDateShort(matchDay.date)}
          </Typography>
        </Box>
      </Paper>

      {sortedConfrontos.length > 1 ? (
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
          {sortedConfrontos.map((item) => (
            <Chip
              key={item.id}
              label={item.sequence}
              clickable
              onClick={() => goToConfronto(item.id)}
              color={item.id === activeConfronto.id ? "primary" : undefined}
              variant={item.id === activeConfronto.id ? "filled" : "outlined"}
              sx={{
                flexShrink: 0,
                minWidth: 40,
                fontWeight: 700,
                ...(item.id === activeConfronto.id ? {} : { bgcolor: "#f4f7f5" }),
              }}
            />
          ))}
        </Stack>
      ) : null}

      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Button
          size="small"
          startIcon={<ChevronLeftOutlinedIcon />}
          onClick={() => prevConfronto && goToConfronto(prevConfronto.id)}
          disabled={!prevConfronto}
        >
          Anterior
        </Button>
        <Button
          size="small"
          endIcon={<ChevronRightOutlinedIcon />}
          onClick={() => nextConfronto && goToConfronto(nextConfronto.id)}
          disabled={!nextConfronto}
        >
          Próximo
        </Button>
      </Stack>

      <ConfrontoContent
        key={activeConfronto.id}
        confronto={activeConfronto}
        teamAName={teamsById.get(activeConfronto.teamAId)?.name ?? "Time A"}
        teamBName={teamsById.get(activeConfronto.teamBId)?.name ?? "Time B"}
        teamsById={teamsById}
        canManage={isAuthenticated}
        availableSubstitutePlayers={availableSubstitutePlayers}
        isLoadingRegisteredPlayers={isLoadingRegisteredPlayers}
        onEnsureRegisteredPlayersLoaded={ensureRegisteredPlayersLoaded}
        onRefreshMatchDay={refreshMatchDay}
        onShowSnackbar={showSnackbar}
      />

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
