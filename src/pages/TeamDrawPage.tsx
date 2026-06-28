import ContentPasteOutlinedIcon from "@mui/icons-material/ContentPasteOutlined";
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
import { DrawConfigCard } from "../features/teamDraw/components/DrawConfigCard";
import {
  BulkParticipantsDialog,
  type ImportedParticipant,
} from "../features/teamDraw/components/BulkParticipantsDialog";
import { DrawResultCard } from "../features/teamDraw/components/DrawResultCard";
import { ParticipantsGridCard } from "../features/teamDraw/components/ParticipantsGridCard";
import type {
  DrawParticipant,
  DrawParticipantType,
  DrawTeam,
} from "../features/teamDraw/types";

const todayEventDate = new Date();
todayEventDate.setHours(21, 30, 0, 0);

const eventMock = {
  title: "Baba Champion Multi Arena",
  startsAt: todayEventDate,
  location: "Champion Multi Arena",
};

const storageKey = "meu-baba-draw-state";

type StoredDrawState = {
  participants: DrawParticipant[];
  teams: DrawTeam[];
  maxPlayersPerTeam: number;
};

function loadStoredDrawState(): StoredDrawState {
  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (storedValue) {
      const parsedState = JSON.parse(storedValue) as Partial<StoredDrawState>;

      return {
        participants: parsedState.participants ?? [],
        teams: parsedState.teams ?? [],
        maxPlayersPerTeam: parsedState.maxPlayersPerTeam ?? 6,
      };
    }
  } catch {
    // A fresh state is enough when storage is unavailable or invalid.
  }

  return {
    participants: [],
    teams: [],
    maxPlayersPerTeam: 6,
  };
}

const teamColors: DrawTeam["color"][] = [
  "success",
  "default",
  "primary",
  "secondary",
];
const teamNames = ["Time 1", "Time 2", "Time 3", "Time 4"];

function shuffleParticipants(participants: DrawParticipant[]) {
  return [...participants].sort(() => Math.random() - 0.5);
}

function isLateParticipant(participant: DrawParticipant) {
  return participant.arrivalStatus === "late";
}

function createDrawTeam(index: number): DrawTeam {
  return {
    id: index + 1,
    name: teamNames[index] ?? `Time ${index + 1}`,
    color: teamColors[index] ?? "default",
    players: [],
  };
}

function putGoalkeepersFirst(players: DrawParticipant[]) {
  return [
    ...players.filter((player) => player.type === "goalkeeper"),
    ...players.filter((player) => player.type !== "goalkeeper"),
  ];
}

function getFieldPlayerCount(team: DrawTeam) {
  return team.players.filter((player) => player.type !== "goalkeeper").length;
}

function getSuggestedTeamForLateParticipant(
  teams: DrawTeam[],
  participant: DrawParticipant,
  maxPlayersPerTeam: number,
) {
  if (teams.length === 0) {
    return null;
  }

  if (participant.type === "goalkeeper") {
    const teamWithoutGoalkeeper = teams.find(
      (team) => !team.players.some((player) => player.type === "goalkeeper"),
    );

    return teamWithoutGoalkeeper ?? teams[0];
  }

  const availableTeams = teams.filter(
    (team) => getFieldPlayerCount(team) < maxPlayersPerTeam,
  );
  const targetTeams = availableTeams.length > 0 ? availableTeams : teams;

  return [...targetTeams].sort(
    (firstTeam, secondTeam) =>
      getFieldPlayerCount(firstTeam) - getFieldPlayerCount(secondTeam),
  )[0];
}

function generateTeams(
  participants: DrawParticipant[],
  maxPlayersPerTeam: number,
): DrawTeam[] {
  const goalkeepers = shuffleParticipants(
    participants.filter((participant) => participant.type === "goalkeeper"),
  );
  const fieldPlayers = shuffleParticipants(
    participants.filter((participant) => participant.type !== "goalkeeper"),
  );
  const teamCount = Math.max(
    1,
    Math.ceil(fieldPlayers.length / maxPlayersPerTeam),
  );
  const teams: DrawTeam[] = Array.from({ length: teamCount }, (_, index) =>
    createDrawTeam(index),
  );

  fieldPlayers.forEach((player, index) => {
    teams[Math.floor(index / maxPlayersPerTeam)].players.push(player);
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

  teams.forEach((team) => {
    team.players = putGoalkeepersFirst(team.players);
  });

  return teams;
}

function formatTeamsForClipboard(teams: DrawTeam[]) {
  const lines = ["⚽ Baba Champion Multi Arena", ""];

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
      const suffix = player.type === "goalkeeper" ? " (Goleiro)" : "";
      lines.push(`${player.name}${suffix}`);
    });
    lines.push("");
  });

  return lines.join("\n").trim();
}

function formatLateParticipantsForClipboard(lateParticipants: DrawParticipant[]) {
  if (lateParticipants.length === 0) {
    return "";
  }

  return [
    "",
    "⏱️ PARA COMPLETAR",
    ...lateParticipants.map((participant) => participant.name),
  ].join("\n");
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Some mobile browsers block the modern API even in secure contexts.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "-9999px";
  textArea.style.opacity = "0";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, textArea.value.length);

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textArea);
  }
}

export function TeamDrawPage() {
  const [storedDrawState] = useState(() => loadStoredDrawState());
  const [participants, setParticipants] = useState<DrawParticipant[]>(
    storedDrawState.participants,
  );
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState(
    storedDrawState.maxPlayersPerTeam,
  );
  const [teams, setTeams] = useState<DrawTeam[]>(storedDrawState.teams);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const summary = useMemo(() => {
    const goalkeeperCount = participants.filter(
      (participant) => participant.type === "goalkeeper",
    ).length;
    const guestCount = participants.filter(
      (participant) => participant.type === "guest",
    ).length;
    const lateCount = participants.filter(isLateParticipant).length;
    const availableParticipants = participants.filter(
      (participant) => !isLateParticipant(participant),
    );
    const availableGoalkeepers = availableParticipants.filter(
      (participant) => participant.type === "goalkeeper",
    ).length;

    return {
      confirmed: participants.length - guestCount,
      goalkeepers: goalkeeperCount,
      guests: guestCount,
      late: lateCount,
      available: availableParticipants.length,
      availablePlayers: availableParticipants.length - availableGoalkeepers,
      totalPlayers: participants.length - goalkeeperCount,
      totalPeople: participants.length,
    };
  }, [participants]);

  const lateParticipants = useMemo(
    () => participants.filter(isLateParticipant),
    [participants],
  );

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        participants,
        teams,
        maxPlayersPerTeam,
      } satisfies StoredDrawState),
    );
  }, [maxPlayersPerTeam, participants, teams]);

  const addParticipant = (
    rawName: string,
    type: DrawParticipantType,
    isLate: boolean,
  ) => {
    const name = rawName.trim();

    if (!name) {
      setSnackbarMessage("Informe o nome do jogador.");
      return false;
    }

    const isDuplicate = participants.some(
      (participant) =>
        participant.name.toLocaleLowerCase("pt-BR") ===
        name.toLocaleLowerCase("pt-BR"),
    );

    if (isDuplicate) {
      setSnackbarMessage("Este jogador já está na lista.");
      return false;
    }

    setParticipants((currentParticipants) => [
      ...currentParticipants,
      {
        id: Date.now(),
        name,
        type,
        arrivalStatus: isLate ? "late" : "on_time",
      },
    ]);
    setTeams([]);
    return true;
  };

  const removeParticipant = (participantId: number) => {
    setParticipants((currentParticipants) =>
      currentParticipants.filter(
        (participant) => participant.id !== participantId,
      ),
    );
    setTeams([]);
  };

  const toggleLateParticipant = (participantId: number) => {
    setParticipants((currentParticipants) =>
      currentParticipants.map((participant) =>
        participant.id === participantId
          ? {
              ...participant,
              arrivalStatus: isLateParticipant(participant)
                ? "on_time"
                : "late",
            }
          : participant,
      ),
    );
    setTeams([]);
  };

  const clearParticipants = () => {
    setParticipants([]);
    setTeams([]);
  };

  const importParticipants = (importedParticipants: ImportedParticipant[]) => {
    const existingNames = new Set(
      participants.map((participant) =>
        participant.name.toLocaleLowerCase("pt-BR"),
      ),
    );
    const importedNames = new Set<string>();
    const uniqueParticipants = importedParticipants.filter((participant) => {
      const normalizedName = participant.name.toLocaleLowerCase("pt-BR");

      if (
        existingNames.has(normalizedName) ||
        importedNames.has(normalizedName)
      ) {
        return false;
      }

      importedNames.add(normalizedName);
      return true;
    });

    const importTimestamp = Date.now();
    setParticipants((currentParticipants) => [
      ...currentParticipants,
      ...uniqueParticipants.map((participant, index) => ({
        id: importTimestamp + index,
        name: participant.name,
        type: participant.type,
        arrivalStatus: "on_time" as const,
      })),
    ]);
    setTeams([]);

    const ignoredCount =
      importedParticipants.length - uniqueParticipants.length;
    setSnackbarMessage(
      ignoredCount > 0
        ? `${uniqueParticipants.length} jogadores importados. ${ignoredCount} duplicado(s) ignorado(s).`
        : `${uniqueParticipants.length} jogadores importados com sucesso.`,
    );
  };

  const runDraw = () => {
    const availableParticipants = participants.filter(
      (participant) => !isLateParticipant(participant),
    );

    if (availableParticipants.length === 0) {
      setSnackbarMessage("Adicione pelo menos um jogador antes de sortear.");
      return;
    }

    setIsDrawing(true);
    window.setTimeout(() => {
      const generatedTeams = generateTeams(
        availableParticipants,
        maxPlayersPerTeam,
      );
      setTeams(generatedTeams);
      setIsDrawing(false);
      setSnackbarMessage(
        lateParticipants.length > 0
          ? "Sorteio gerado. Atrasados ficaram separados para completar depois."
          : "Sorteio gerado com a quantidade automática de times.",
      );
    }, 700);
  };

  const getFormattedDrawText = () =>
    `${formatTeamsForClipboard(teams)}${formatLateParticipantsForClipboard(lateParticipants)}`;

  const copyTeams = async () => {
    const text = getFormattedDrawText();
    const copied = await copyTextToClipboard(text);

    if (copied) {
      setSnackbarMessage("Times copiados para a área de transferência.");
      return;
    }

    setSnackbarMessage("Não foi possível copiar automaticamente neste navegador.");
  };

  const shareTeams = async () => {
    const text = getFormattedDrawText();

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

  const assignLateParticipant = (participantId: number) => {
    const participant = participants.find(
      (currentParticipant) => currentParticipant.id === participantId,
    );

    if (!participant) {
      return;
    }

    const suggestedTeam = getSuggestedTeamForLateParticipant(
      teams,
      participant,
      maxPlayersPerTeam,
    );

    if (!suggestedTeam) {
      setSnackbarMessage("Sorteie os times antes de encaixar atrasados.");
      return;
    }

    setTeams((currentTeams) =>
      currentTeams.map((team) =>
        team.id === suggestedTeam.id
          ? {
              ...team,
              players: putGoalkeepersFirst([
                ...team.players,
                { ...participant, arrivalStatus: "on_time" },
              ]),
            }
          : team,
      ),
    );
    setParticipants((currentParticipants) =>
      currentParticipants.map((currentParticipant) =>
        currentParticipant.id === participantId
          ? { ...currentParticipant, arrivalStatus: "on_time" }
          : currentParticipant,
      ),
    );
    setSnackbarMessage(`${participant.name} entrou no ${suggestedTeam.name}.`);
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
                ? "A bola está esperando."
                : `${summary.available} prontos para jogar${
                    summary.late > 0
                      ? ` e ${summary.late} atrasado${summary.late === 1 ? "" : "s"}`
                      : ""
                  }`}
            </Typography>
          </Box>
          <Chip
            icon={<SportsSoccerOutlinedIcon />}
            label={`${summary.availablePlayers} de linha`}
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
            participants={participants}
            onAdd={addParticipant}
            onRemove={removeParticipant}
            onClear={clearParticipants}
            onOpenBulkImport={() => setIsBulkImportOpen(true)}
            onToggleLate={toggleLateParticipant}
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
                    {summary.late > 0
                      ? `, ${summary.late} atrasado${summary.late === 1 ? "" : "s"}`
                      : ""}
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
              <Button
                variant="outlined"
                startIcon={<ContentPasteOutlinedIcon />}
                onClick={() => setIsBulkImportOpen(true)}
              >
                Colar lista do WhatsApp
              </Button>
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
                disabled={isDrawing || summary.available === 0}
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
              teams={teams}
              lateParticipants={lateParticipants}
              maxPlayersPerTeam={maxPlayersPerTeam}
              onRedraw={runDraw}
              onCopy={copyTeams}
              onShare={shareTeams}
              onAssignLateParticipant={assignLateParticipant}
            />
          </Box>
        </Box>
      ) : null}

      <BulkParticipantsDialog
        open={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImport={importParticipants}
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
          disabled={isDrawing || summary.available === 0}
          fullWidth
        >
          {isDrawing
            ? "Sorteando..."
            : `Sortear ${summary.available} jogadores`}
        </Button>
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


