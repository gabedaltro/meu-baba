import ShuffleOutlinedIcon from "@mui/icons-material/ShuffleOutlined";
import SportsSoccerOutlinedIcon from "@mui/icons-material/SportsSoccerOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../features/auth/authContext";
import { fetchSettings } from "../features/settings/settingsApi";
import { createTeamDraw } from "../features/teamDraw/services/drawsApi";
import { DrawConfigCard } from "../features/teamDraw/components/DrawConfigCard";
import { DrawMatchModal } from "../features/teamDraw/components/DrawMatchModal";
import { DrawResultCard } from "../features/teamDraw/components/DrawResultCard";
import {
  GuestParticipantsDialog,
  type ImportedGuest,
} from "../features/teamDraw/components/GuestParticipantsDialog";
import { ParticipantsGridCard } from "../features/teamDraw/components/ParticipantsGridCard";
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
  const teamCount = Math.max(1, Math.ceil(fieldPlayerCount / safeMaxPlayersPerTeam));
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
    const eligibleTeams = teamsWithoutGoalkeeper.length > 0 ? teamsWithoutGoalkeeper : teams;
    const targetTeam = eligibleTeams[index % eligibleTeams.length];

    targetTeam.players.unshift(goalkeeper);
  });

  return teams
    .map((team) => ({ ...team, players: putGoalkeepersFirst(team.players) }))
    .filter((team) => team.players.length > 0);
}
function formatTeamsForClipboard(teams: DrawTeam[]) {
  const lines = ["\u26bd Baba Champion Multi Arena", ""];

  teams.forEach((team) => {
    const marker =
      team.name === "Time extra"
        ? "\ud83d\udfe0"
        : team.id === 1
          ? "\ud83d\udfe2"
          : team.id === 2
            ? "\u26aa"
            : team.id === 3
              ? "\ud83d\udd35"
              : "\ud83d\udfe1";

    lines.push(`${marker} ${team.name.toUpperCase()}`);
    team.players.forEach((player) => {
      lines.push(
        player.type === "goalkeeper" ? `Goleiro ${player.name}` : player.name,
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
  const { isAuthenticated } = useAuth();
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
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const summary = useMemo(() => {
    const goalkeeperCount = participants.filter(
      (participant) => participant.type === "goalkeeper",
    ).length;
    const guestCount = participants.filter(
      (participant) => participant.type === "guest",
    ).length;

    return {
      confirmed: participants.length - guestCount,
      goalkeepers: goalkeeperCount,
      guests: guestCount,
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
          setSnackbarMessage("Nao foi possivel carregar os jogadores da API.");
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
        "Selecione jogadores cadastrados que ainda nao estejam na lista.",
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
    const participantIds = new Set(
      participants.map((participant) => String(participant.id)),
    );
    const monthlyPlayersToAdd = registeredPlayers.filter(
      (player) =>
        player.type === "monthly_player" &&
        !participantIds.has(String(player.id)),
    );

    if (monthlyPlayersToAdd.length === 0) {
      setSnackbarMessage("Nenhum mensalista disponivel para adicionar.");
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

  const importGuests = (guests: ImportedGuest[]) => {
    const existingNames = new Set(
      participants.map((participant) =>
        normalizeParticipantName(participant.name),
      ),
    );
    const guestTimestamp = Date.now();
    const guestsToAdd = guests.filter(
      (guest) => !existingNames.has(normalizeParticipantName(guest.name)),
    );

    if (guestsToAdd.length === 0) {
      setSnackbarMessage("Nenhum convidado novo para adicionar.");
      return;
    }

    setParticipants((currentParticipants) => [
      ...currentParticipants,
      ...guestsToAdd.map((guest, index) => ({
        id: `guest-${guestTimestamp}-${index}`,
        name: guest.name,
        type: "guest" as const,
      })),
    ]);
    setTeams([]);
    setIsDrawModalOpen(false);
    setSnackbarMessage(
      `${guestsToAdd.length} convidado${
        guestsToAdd.length === 1 ? "" : "s"
      } adicionado${guestsToAdd.length === 1 ? "" : "s"}.`,
    );
  };

  const toggleLateArrival = (participantId: string) => {
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
    setParticipants((currentParticipants) =>
      currentParticipants.filter(
        (participant) => String(participant.id) !== participantId,
      ),
    );
    setTeams([]);
    setIsDrawModalOpen(false);
  };

  const clearParticipants = () => {
    setParticipants([]);
    setTeams([]);
    setIsDrawModalOpen(false);
  };

  const runDraw = async () => {
    if (participants.length === 0) {
      setSnackbarMessage("Adicione pelo menos um jogador antes de sortear.");
      return;
    }

    setIsDrawing(true);

    try {
      const generatedTeams = isAuthenticated
        ? await createTeamDraw({
            eventId: drawEventId,
            maxOutfieldPlayersPerTeam: maxPlayersPerTeam,
            participants: displayParticipants,
          })
        : generateLocalTeams(displayParticipants, maxPlayersPerTeam);

      if (generatedTeams.length === 0) {
        setSnackbarMessage("Nao foi possivel gerar times para este sorteio.");
        return;
      }

      setTeams(generatedTeams);
      setIsDrawModalOpen(true);
      setSnackbarMessage(
        isAuthenticated ? "Sorteio gerado pela API." : "Sorteio gerado.",
      );
    } catch {
      setSnackbarMessage("Nao foi possivel gerar o sorteio.");
    } finally {
      setIsDrawing(false);
    }
  };

  const copyTeams = async () => {
    const text = formatTeamsForClipboard(displayTeams);
    const didCopy = await copyTextToClipboard(text);

    if (didCopy) {
      setSnackbarMessage("Times copiados para a area de transferencia.");
      return;
    }

    setSnackbarMessage("Nao foi possivel copiar automaticamente.");
  };

  const shareTeams = async () => {
    const text = formatTeamsForClipboard(displayTeams);

    if (navigator.share) {
      try {
        await navigator.share({
          title: eventMock.title,
          text,
        });
        setSnackbarMessage("Times compartilhados com sucesso.");
        return;
      } catch {
        return;
      }
    }

    await copyTeams();
  };

  const closeSnackbar = () => {
    setSnackbarMessage("");
  };

  return (
    <Stack spacing={{ xs: 2.5, md: 4 }} sx={{ pb: { xs: 11, lg: 2 } }}>
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
                ? "A bola esta esperando."
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
            onAdd={addParticipant}
            onAddMonthlyPlayers={addAllMonthlyPlayers}
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
                  <Typography variant="h3">Pronto para sortear</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {summary.goalkeepers} goleiro
                    {summary.goalkeepers === 1 ? "" : "s"} na lista
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "#e3f1e8", color: "primary.main" }}>
                  <ShuffleOutlinedIcon />
                </Avatar>
              </Stack>
              <DrawConfigCard
                maxPlayersPerTeam={maxPlayersPerTeam}
                onMaxPlayersPerTeamChange={setMaxPlayersPerTeam}
              />
              {teams.length > 0 ? (
                <Button
                  variant="outlined"
                  onClick={() => setIsDrawModalOpen(true)}
                  sx={{ display: { xs: "none", lg: "inline-flex" } }}
                >
                  Ver confronto
                </Button>
              ) : null}
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
              onRedraw={runDraw}
              onCopy={copyTeams}
              onShare={shareTeams}
            />
          </Box>
        </Box>
      ) : null}

      <DrawMatchModal
        open={isDrawModalOpen}
        teams={displayTeams}
        onClose={() => setIsDrawModalOpen(false)}
        onCopy={copyTeams}
      />

      <GuestParticipantsDialog
        open={isGuestDialogOpen}
        onClose={() => setIsGuestDialogOpen(false)}
        onImport={importGuests}
      />

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
        </Stack>
      </Box>

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
