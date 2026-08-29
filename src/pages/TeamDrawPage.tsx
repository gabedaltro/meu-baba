import ShuffleOutlinedIcon from "@mui/icons-material/ShuffleOutlined";
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
  Grid,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/authContext";
import { getTodayDateInput } from "../features/matchDays/format";
import { saveDrawAsMatchDay } from "../features/matchDays/matchDaysApi";
import { fetchSettings } from "../features/settings/settingsApi";
import { DrawConfigCard } from "../features/teamDraw/components/DrawConfigCard";
import { DrawMatchModal } from "../features/teamDraw/components/DrawMatchModal";
import { DrawResultCard } from "../features/teamDraw/components/DrawResultCard";
import { GoalkeeperParticipantsDialog } from "../features/teamDraw/components/GoalkeeperParticipantsDialog";
import {
  GuestParticipantsDialog,
  type ImportedGuest,
} from "../features/teamDraw/components/GuestParticipantsDialog";
import { ParticipantsGridCard } from "../features/teamDraw/components/ParticipantsGridCard";
import { createTeamDraw } from "../features/teamDraw/services/drawsApi";
import {
  fetchTeamDrawPlayers,
  mapApiPlayerToDrawParticipant,
} from "../features/teamDraw/services/usersApi";
import type { DrawParticipant, DrawTeam } from "../features/teamDraw/types";

const todayEventDate = new Date();
todayEventDate.setHours(21, 30, 0, 0);

const eventMock = {
  title: "Baba Champion Multi Arena",
  startsAt: todayEventDate,
  location: "Champion Multi Arena",
};

const drawEventId = "00000000-0000-4000-8000-000000000001";

const storageKey = "meu-baba-draw-state";

type StoredDrawState = {
  maxPlayersPerTeam: number;
};

function loadStoredDrawState(): StoredDrawState {
  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (storedValue) {
      const parsedState = JSON.parse(storedValue) as Partial<StoredDrawState>;

      return {
        maxPlayersPerTeam: parsedState.maxPlayersPerTeam ?? 6,
      };
    }
  } catch {
    // A fresh state is enough when storage is unavailable or invalid.
  }

  return {
    maxPlayersPerTeam: 6,
  };
}

function normalizeParticipantName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

const localTeamColors: DrawTeam["color"][] = [
  "success",
  "default",
  "primary",
  "secondary",
];
const localTeamNames = ["Time 1", "Time 2", "Time 3", "Time 4"];

function shuffleParticipants(participants: DrawParticipant[]) {
  return [...participants].sort(() => Math.random() - 0.5);
}

function createLocalDrawTeam(index: number): DrawTeam {
  return {
    id: index + 1,
    name: localTeamNames[index] ?? `Time ${index + 1}`,
    color: localTeamColors[index % localTeamColors.length] ?? "default",
    players: [],
  };
}

function putGoalkeepersFirst(players: DrawParticipant[]) {
  return [
    ...players.filter((player) => player.type === "goalkeeper"),
    ...players.filter((player) => player.type !== "goalkeeper"),
  ];
}

function generateLocalTeams(
  participants: DrawParticipant[],
  maxPlayersPerTeam: number,
): DrawTeam[] {
  const safeMaxPlayersPerTeam = Math.max(1, maxPlayersPerTeam);
  const goalkeepers = shuffleParticipants(
    participants.filter((participant) => participant.type === "goalkeeper"),
  );
  const lateFieldPlayers = shuffleParticipants(
    participants.filter(
      (participant) =>
        participant.type !== "goalkeeper" && participant.isLateArrival,
    ),
  );
  const regularFieldPlayers = shuffleParticipants(
    participants.filter(
      (participant) =>
        participant.type !== "goalkeeper" && !participant.isLateArrival,
    ),
  );
  const fieldPlayerCount = regularFieldPlayers.length + lateFieldPlayers.length;
  const teamCount = Math.max(
    1,
    Math.ceil(fieldPlayerCount / safeMaxPlayersPerTeam),
  );
  const teams = Array.from({ length: teamCount }, (_, index) =>
    createLocalDrawTeam(index),
  );
  const lastTeam = teams[teams.length - 1];

  lateFieldPlayers.forEach((player) => {
    lastTeam.players.push(player);
  });

  regularFieldPlayers.forEach((player) => {
    const targetTeam = teams.find((team) => {
      const fieldPlayersInTeam = team.players.filter(
        (teamPlayer) => teamPlayer.type !== "goalkeeper",
      ).length;

      return fieldPlayersInTeam < safeMaxPlayersPerTeam;
    });

    targetTeam?.players.push(player);
  });

  goalkeepers.forEach((goalkeeper, index) => {
    const teamsWithoutGoalkeeper = teams.filter(
      (team) => !team.players.some((player) => player.type === "goalkeeper"),
    );
    const eligibleTeams =
      teamsWithoutGoalkeeper.length > 0 ? teamsWithoutGoalkeeper : teams;
    const targetTeam = eligibleTeams[index % eligibleTeams.length];

    targetTeam.players.unshift(goalkeeper);
  });

  return teams
    .map((team) => ({ ...team, players: putGoalkeepersFirst(team.players) }))
    .filter((team) => team.players.length > 0);
}

function getClipboardPlayerName(player: DrawParticipant) {
  return player.nickname || player.name;
}

function formatTeamsForClipboard(
  teams: DrawTeam[],
  kickoffTeamId: number | null,
) {
  const lines = ["⚽ Baba Champion Multi Arena", ""];

  const teamOne = teams[0];
  const teamTwo = teams[1];

  if (teamOne && teamTwo && kickoffTeamId != null) {
    const kickoffTeam = teamOne.id === kickoffTeamId ? teamOne : teamTwo;
    const sideTeam = teamOne.id === kickoffTeamId ? teamTwo : teamOne;

    lines.push(`${kickoffTeam.name} começa com a bola`);
    lines.push(`${sideTeam.name} escolhe o campo`);
    lines.push("");
  }

  teams.forEach((team) => {
    const marker =
      team.name === "Time extra"
        ? "🟠"
        : team.id === 1
          ? "🟢"
          : team.id === 2
            ? "⚪"
            : team.id === 3
              ? "🔵"
              : "🟡";

    lines.push(`${marker} ${team.name.toUpperCase()}`);
    team.players.forEach((player) => {
      const displayName = getClipboardPlayerName(player);

      lines.push(
        player.type === "goalkeeper" ? `Goleiro ${displayName}` : displayName,
      );
    });
    lines.push("");
  });

  return lines.join("\n").trim();
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back to a temporary textarea when the Clipboard API is blocked.
    }
  }

  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

export function TeamDrawPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const canEdit = isAuthenticated;
  const [storedDrawState] = useState(() => loadStoredDrawState());
  const [participants, setParticipants] = useState<DrawParticipant[]>([]);
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState(
    storedDrawState.maxPlayersPerTeam,
  );
  const [teams, setTeams] = useState<DrawTeam[]>([]);
  const [registeredPlayers, setRegisteredPlayers] = useState<DrawParticipant[]>(
    [],
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const [isGoalkeeperDialogOpen, setIsGoalkeeperDialogOpen] = useState(false);
  const [kickoffTeamId, setKickoffTeamId] = useState<number | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [currentDrawId, setCurrentDrawId] = useState<string | null>(null);
  const [isSaveMatchDayDialogOpen, setIsSaveMatchDayDialogOpen] =
    useState(false);
  const [matchDayDate, setMatchDayDate] = useState(getTodayDateInput());
  const [isSavingMatchDay, setIsSavingMatchDay] = useState(false);
  const [matchDayErrorMessage, setMatchDayErrorMessage] = useState("");

  const summary = useMemo(() => {
    const goalkeeperCount = participants.filter(
      (participant) => participant.type === "goalkeeper",
    ).length;
    const guestCount = participants.filter(
      (participant) => participant.type === "guest",
    ).length;
    const lateCount = participants.filter(
      (participant) => participant.isLateArrival,
    ).length;

    return {
      confirmed: participants.length - guestCount,
      goalkeepers: goalkeeperCount,
      guests: guestCount,
      late: lateCount,
      totalPlayers: participants.length - goalkeeperCount,
      totalPeople: participants.length,
    };
  }, [participants]);

  const displayParticipants = participants;
  const displayTeams = teams;

  useEffect(() => {
    let isMounted = true;

    if (isAuthenticated) {
      fetchSettings()
        .then((settings) => {
          if (isMounted && settings.outfieldPlayersPerTeam > 0) {
            setMaxPlayersPerTeam(settings.outfieldPlayersPerTeam);
          }
        })
        .catch(() => {
          // Settings are optional for the draw screen; keep the local/default value.
        });
    }

    fetchTeamDrawPlayers()
      .then((users) => {
        if (isMounted) {
          setRegisteredPlayers(users.map(mapApiPlayerToDrawParticipant));
        }
      })
      .catch(() => {
        if (isMounted) {
          setSnackbarMessage("Não foi possível carregar os jogadores da API.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        maxPlayersPerTeam,
      } satisfies StoredDrawState),
    );
  }, [maxPlayersPerTeam]);

  const addParticipant = (playerIds: string[]) => {
    if (!canEdit) {
      return 0;
    }

    const participantIds = new Set(
      participants.map((participant) => String(participant.id)),
    );
    const selectedPlayerIds = new Set(playerIds);
    const playersToAdd = registeredPlayers.filter(
      (registeredPlayer) =>
        selectedPlayerIds.has(String(registeredPlayer.id)) &&
        !participantIds.has(String(registeredPlayer.id)),
    );

    if (playersToAdd.length === 0) {
      setSnackbarMessage(
        "Selecione jogadores cadastrados que ainda não estejam na lista.",
      );
      return 0;
    }

    setParticipants((currentParticipants) => [
      ...currentParticipants,
      ...playersToAdd,
    ]);
    setTeams([]);
    setIsDrawModalOpen(false);
    setSnackbarMessage(
      playersToAdd.length === 1
        ? "1 jogador adicionado."
        : `${playersToAdd.length} jogadores adicionados.`,
    );
    return playersToAdd.length;
  };

  const addAllMonthlyPlayers = () => {
    if (!canEdit) {
      return;
    }

    const participantIds = new Set(
      participants.map((participant) => String(participant.id)),
    );
    const monthlyPlayersToAdd = registeredPlayers.filter(
      (player) =>
        player.type === "monthly_player" &&
        !participantIds.has(String(player.id)),
    );

    if (monthlyPlayersToAdd.length === 0) {
      setSnackbarMessage("Nenhum mensalista disponível para adicionar.");
      return;
    }

    setParticipants((currentParticipants) => [
      ...currentParticipants,
      ...monthlyPlayersToAdd,
    ]);
    setTeams([]);
    setIsDrawModalOpen(false);
    setSnackbarMessage(
      `${monthlyPlayersToAdd.length} mensalista${
        monthlyPlayersToAdd.length === 1 ? "" : "s"
      } adicionado${monthlyPlayersToAdd.length === 1 ? "" : "s"}.`,
    );
  };

  const importGoalkeepers = (selectedPlayers: DrawParticipant[]) => {
    if (!canEdit) {
      return;
    }

    const existingIds = new Set(
      participants.map((participant) => String(participant.id)),
    );
    const goalkeepersToAdd = selectedPlayers.filter(
      (player) => !existingIds.has(String(player.id)),
    );

    if (goalkeepersToAdd.length === 0) {
      setSnackbarMessage("Nenhum goleiro novo para adicionar.");
      return;
    }

    setParticipants((currentParticipants) => [
      ...currentParticipants,
      ...goalkeepersToAdd,
    ]);
    setTeams([]);
    setIsDrawModalOpen(false);
    setSnackbarMessage(
      `${goalkeepersToAdd.length} goleiro${
        goalkeepersToAdd.length === 1 ? "" : "s"
      } adicionado${goalkeepersToAdd.length === 1 ? "" : "s"}.`,
    );
  };

  const importGuests = (
    selectedPlayers: DrawParticipant[],
    typedGuests: ImportedGuest[],
  ) => {
    if (!canEdit) {
      return;
    }

    const existingIds = new Set(
      participants.map((participant) => String(participant.id)),
    );
    const existingNames = new Set(
      participants.map((participant) =>
        normalizeParticipantName(participant.name),
      ),
    );
    const guestTimestamp = Date.now();

    const playersToAdd = selectedPlayers.filter(
      (player) => !existingIds.has(String(player.id)),
    );
    const playerNames = new Set(
      playersToAdd.map((player) => normalizeParticipantName(player.name)),
    );
    const typedGuestsToAdd = typedGuests.filter(
      (guest) =>
        !existingNames.has(normalizeParticipantName(guest.name)) &&
        !playerNames.has(normalizeParticipantName(guest.name)),
    );

    const newParticipants: DrawParticipant[] = [
      ...playersToAdd,
      ...typedGuestsToAdd.map((guest, index) => ({
        id: `guest-${guestTimestamp}-${index}`,
        name: guest.name,
        type: "guest" as const,
      })),
    ];

    if (newParticipants.length === 0) {
      setSnackbarMessage("Nenhum convidado novo para adicionar.");
      return;
    }

    setParticipants((currentParticipants) => [
      ...currentParticipants,
      ...newParticipants,
    ]);
    setTeams([]);
    setIsDrawModalOpen(false);
    setSnackbarMessage(
      `${newParticipants.length} convidado${
        newParticipants.length === 1 ? "" : "s"
      } adicionado${newParticipants.length === 1 ? "" : "s"}.`,
    );
  };

  const toggleLateArrival = (participantId: string) => {
    if (!canEdit) {
      return;
    }

    setParticipants((currentParticipants) =>
      currentParticipants.map((participant) =>
        String(participant.id) === participantId
          ? { ...participant, isLateArrival: !participant.isLateArrival }
          : participant,
      ),
    );
    setTeams([]);
    setIsDrawModalOpen(false);
  };

  const removeParticipant = (participantId: string) => {
    if (!canEdit) {
      return;
    }

    setParticipants((currentParticipants) =>
      currentParticipants.filter(
        (participant) => String(participant.id) !== participantId,
      ),
    );
    setTeams([]);
    setIsDrawModalOpen(false);
  };

  const clearParticipants = () => {
    if (!canEdit) {
      return;
    }

    setParticipants([]);
    setTeams([]);
    setIsDrawModalOpen(false);
  };

  const runDraw = async () => {
    if (!canEdit) {
      return;
    }

    if (participants.length === 0) {
      setSnackbarMessage("Adicione pelo menos um jogador antes de sortear.");
      return;
    }

    setIsDrawing(true);

    try {
      let generatedTeams: DrawTeam[];

      if (isAuthenticated) {
        const draw = await createTeamDraw({
          eventId: drawEventId,
          maxOutfieldPlayersPerTeam: maxPlayersPerTeam,
          participants: displayParticipants,
        });

        generatedTeams = draw.teams;
        setCurrentDrawId(draw.id);
      } else {
        generatedTeams = generateLocalTeams(
          displayParticipants,
          maxPlayersPerTeam,
        );
        setCurrentDrawId(null);
      }

      if (generatedTeams.length === 0) {
        setSnackbarMessage("Não foi possível gerar times para este sorteio.");
        return;
      }

      setTeams(generatedTeams);
      setKickoffTeamId(
        generatedTeams.length >= 2
          ? generatedTeams[Math.random() < 0.5 ? 0 : 1].id
          : null,
      );
      setIsDrawModalOpen(true);
      setSnackbarMessage(
        isAuthenticated ? "Sorteio gerado pela API." : "Sorteio gerado.",
      );
    } catch {
      setSnackbarMessage("Não foi possível gerar o sorteio.");
    } finally {
      setIsDrawing(false);
    }
  };

  const copyTeams = async () => {
    const text = formatTeamsForClipboard(displayTeams, kickoffTeamId);
    const didCopy = await copyTextToClipboard(text);

    if (didCopy) {
      setSnackbarMessage("Times copiados para a área de transferência.");
      return;
    }

    setSnackbarMessage("Não foi possível copiar automaticamente.");
  };

  const shareTeams = async () => {
    const text = formatTeamsForClipboard(displayTeams, kickoffTeamId);

    if (navigator.share) {
      try {
        await navigator.share({
          title: eventMock.title,
          text,
        });
        setSnackbarMessage("Times compartilhados com sucesso.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setSnackbarMessage("Compartilhamento cancelado.");
          return;
        }
      }
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setSnackbarMessage("Abrindo WhatsApp para compartilhar os times.");
  };

  const closeSnackbar = () => {
    setSnackbarMessage("");
  };

  const openSaveMatchDayDialog = () => {
    setMatchDayDate(getTodayDateInput());
    setMatchDayErrorMessage("");
    setIsSaveMatchDayDialogOpen(true);
  };

  const closeSaveMatchDayDialog = () => {
    if (isSavingMatchDay) {
      return;
    }

    setIsSaveMatchDayDialogOpen(false);
    setMatchDayErrorMessage("");
  };

  const submitSaveMatchDay = async () => {
    if (!currentDrawId) {
      return;
    }

    if (!matchDayDate) {
      setMatchDayErrorMessage("Informe a data da rodada.");
      return;
    }

    setIsSavingMatchDay(true);
    setMatchDayErrorMessage("");

    try {
      const matchDay = await saveDrawAsMatchDay(currentDrawId, {
        date: matchDayDate,
      });

      setIsSaveMatchDayDialogOpen(false);
      navigate(`/rodadas/${matchDay.id}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setMatchDayErrorMessage("Já existe uma rodada cadastrada nessa data.");
      } else {
        setMatchDayErrorMessage("Não foi possível salvar a rodada.");
      }
    } finally {
      setIsSavingMatchDay(false);
    }
  };

  const changePlayerStat = (
    participantId: string,
    stat: "goals" | "assists",
    delta: number,
  ) => {
    if (!canEdit) {
      return;
    }

    const updatePlayer = (player: DrawParticipant): DrawParticipant =>
      String(player.id) === participantId
        ? {
            ...player,
            [stat]: Math.max(0, (player[stat] ?? 0) + delta),
          }
        : player;

    setParticipants((currentParticipants) =>
      currentParticipants.map(updatePlayer),
    );
    setTeams((currentTeams) =>
      currentTeams.map((team) => ({
        ...team,
        players: team.players.map(updatePlayer),
      })),
    );
  };

  return (
    <Stack
      spacing={{ xs: 2.5, md: 4 }}
      sx={{ pb: { xs: canEdit || teams.length > 0 ? 11 : 2, lg: 2 } }}
    >
      <Paper
        component={motion.header}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        variant="outlined"
        sx={{
          position: "relative",
          overflow: "hidden",
          bgcolor: "#155b39",
          color: "#fff",
          borderColor: "rgba(255,255,255,0.18)",
          p: { xs: 2, sm: 3 },
          boxShadow: "0 20px 60px rgba(16, 70, 43, 0.22)",
          "&::after": {
            content: '""',
            position: "absolute",
            width: 150,
            height: 150,
            border: "2px solid rgba(255,255,255,0.12)",
            borderRadius: "50%",
            right: -45,
            top: "50%",
            transform: "translateY(-50%)",
          },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", position: "relative", zIndex: 1 }}
        >
          <Avatar
            sx={{
              width: { xs: 48, sm: 58 },
              height: { xs: 48, sm: 58 },
              bgcolor: "#fff",
              color: "primary.main",
            }}
          >
            <SportsSoccerOutlinedIcon fontSize="large" />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h1"
              sx={{ color: "inherit", fontSize: { xs: "1.65rem", sm: "2rem" } }}
            >
              Sorteio dos times
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>
              {summary.totalPeople === 0
                ? ""
                : `${summary.totalPeople} nomes prontos para jogar`}
            </Typography>
          </Box>
          <Chip
            icon={<SportsSoccerOutlinedIcon />}
            label={`${summary.totalPlayers} de linha`}
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              bgcolor: "rgba(255,255,255,0.12)",
              color: "#fff",
              "& .MuiChip-icon": { color: "#fff" },
            }}
          />
        </Stack>
      </Paper>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ParticipantsGridCard
            participants={displayParticipants}
            availablePlayers={registeredPlayers}
            isLoadingPlayers={registeredPlayers.length === 0}
            canEdit={canEdit}
            onAdd={addParticipant}
            onAddMonthlyPlayers={addAllMonthlyPlayers}
            onOpenGoalkeeperImport={() => setIsGoalkeeperDialogOpen(true)}
            onOpenGuestImport={() => setIsGuestDialogOpen(true)}
            onToggleLateArrival={toggleLateArrival}
            onRemove={removeParticipant}
            onClear={clearParticipants}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            variant="outlined"
            sx={{
              position: { lg: "sticky" },
              top: { lg: 24 },
              p: { xs: 2, sm: 3 },
              bgcolor: "rgba(255,255,255,0.94)",
              boxShadow: "0 18px 50px rgba(17, 54, 35, 0.08)",
            }}
          >
            <Stack spacing={2.5}>
              <Stack
                direction="row"
                sx={{ alignItems: "center", justifyContent: "space-between" }}
              >
                <Box>
                  <Typography variant="h3">
                    {canEdit ? "Pronto para sortear" : "Times da semana"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {summary.goalkeepers} goleiro
                    {summary.goalkeepers === 1 ? "" : "s"} na lista
                    {summary.late > 0
                      ? `, ${summary.late} atrasado${summary.late === 1 ? "" : "s"}`
                      : ""}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#e3f1e8", color: "primary.main" }}>
                  <ShuffleOutlinedIcon />
                </Avatar>
              </Stack>
              {canEdit ? (
                <DrawConfigCard
                  maxPlayersPerTeam={maxPlayersPerTeam}
                  onMaxPlayersPerTeamChange={setMaxPlayersPerTeam}
                  canEdit={canEdit}
                />
              ) : null}
              {teams.length > 0 ? (
                <Button
                  variant="outlined"
                  onClick={() => setIsDrawModalOpen(true)}
                  sx={{ display: { xs: "none", lg: "inline-flex" } }}
                >
                  Ver confronto
                </Button>
              ) : null}
              {canEdit ? (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={
                    isDrawing ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : (
                      <ShuffleOutlinedIcon />
                    )
                  }
                  onClick={runDraw}
                  disabled={isDrawing || participants.length === 0}
                  sx={{ display: { xs: "none", lg: "inline-flex" } }}
                >
                  {isDrawing ? "Sorteando..." : "Sortear agora"}
                </Button>
              ) : null}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {teams.length > 0 ? (
        <Box
          sx={{
            position: "relative",
            borderRadius: 2,
            bgcolor: "#155b39",
            p: { xs: 2, sm: 3 },
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 1,
              pointerEvents: "none",
            },
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <DrawResultCard
              teams={displayTeams}
              canEdit={canEdit}
              onRedraw={runDraw}
              onCopy={copyTeams}
              onShare={shareTeams}
              onChangePlayerStat={changePlayerStat}
              onSaveAsMatchDay={
                currentDrawId ? openSaveMatchDayDialog : undefined
              }
            />
          </Box>
        </Box>
      ) : null}

      <DrawMatchModal
        open={isDrawModalOpen}
        teams={displayTeams}
        kickoffTeamId={kickoffTeamId}
        onClose={() => setIsDrawModalOpen(false)}
        onCopy={copyTeams}
      />

      <GuestParticipantsDialog
        open={isGuestDialogOpen}
        onClose={() => setIsGuestDialogOpen(false)}
        participants={participants}
        availablePlayers={registeredPlayers}
        onImport={importGuests}
      />

      <GoalkeeperParticipantsDialog
        open={isGoalkeeperDialogOpen}
        onClose={() => setIsGoalkeeperDialogOpen(false)}
        participants={participants}
        availablePlayers={registeredPlayers}
        onImport={importGoalkeepers}
      />

      <Dialog
        open={isSaveMatchDayDialogOpen}
        onClose={closeSaveMatchDayDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Salvar como rodada</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {matchDayErrorMessage ? (
              <Alert severity="error">{matchDayErrorMessage}</Alert>
            ) : null}
            <Typography color="text.secondary">
              Esses times viram a rodada oficial dessa data em "Times da
              semana".
            </Typography>
            <TextField
              label="Data"
              type="date"
              value={matchDayDate}
              onChange={(event) => setMatchDayDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeSaveMatchDayDialog} disabled={isSavingMatchDay}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void submitSaveMatchDay()}
            disabled={isSavingMatchDay}
            startIcon={
              isSavingMatchDay ? (
                <CircularProgress color="inherit" size={18} />
              ) : undefined
            }
          >
            Salvar rodada
          </Button>
        </DialogActions>
      </Dialog>

      {canEdit || teams.length > 0 ? (
        <Box
          sx={{
            display: { xs: "block", lg: "none" },
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: (theme) => theme.zIndex.appBar,
            bgcolor: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(10px)",
            borderTop: "1px solid rgba(31,122,77,0.16)",
            p: 1.5,
            pb: "max(12px, env(safe-area-inset-bottom))",
          }}
        >
          <Stack spacing={1}>
            {teams.length > 0 ? (
              <Button
                variant="outlined"
                onClick={() => setIsDrawModalOpen(true)}
                fullWidth
              >
                Ver confronto
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                variant="contained"
                size="large"
                startIcon={
                  isDrawing ? (
                    <CircularProgress color="inherit" size={18} />
                  ) : (
                    <ShuffleOutlinedIcon />
                  )
                }
                onClick={runDraw}
                disabled={isDrawing || participants.length === 0}
                fullWidth
              >
                {isDrawing
                  ? "Sorteando..."
                  : `Sortear ${participants.length} jogadores`}
              </Button>
            ) : null}
          </Stack>
        </Box>
      ) : null}

      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" variant="filled" onClose={closeSnackbar}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
