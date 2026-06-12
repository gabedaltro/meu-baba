import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import ShuffleOutlinedIcon from "@mui/icons-material/ShuffleOutlined";
import SportsHandballOutlinedIcon from "@mui/icons-material/SportsHandballOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { DrawConfigCard } from "../features/teamDraw/components/DrawConfigCard";
import {
  BulkParticipantsDialog,
  type ImportedParticipant,
} from "../features/teamDraw/components/BulkParticipantsDialog";
import { DrawResultCard } from "../features/teamDraw/components/DrawResultCard";
import { ParticipantsGridCard } from "../features/teamDraw/components/ParticipantsGridCard";
import type {
  DrawMode,
  DrawParticipant,
  DrawParticipantType,
  DrawTeam,
} from "../features/teamDraw/types";
import { EventMetricCard } from "../features/nextEvent/components/EventMetricCard";

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
      return JSON.parse(storedValue) as StoredDrawState;
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
  const teams = Array.from({ length: teamCount }, (_, index) => ({
    id: index + 1,
    name: teamNames[index] ?? `Time ${index + 1}`,
    color: teamColors[index] ?? "default",
    players: fieldPlayers.slice(
      index * maxPlayersPerTeam,
      (index + 1) * maxPlayersPerTeam,
    ),
  }));

  goalkeepers.forEach((goalkeeper, index) => {
    teams[index % teams.length].players.unshift(goalkeeper);
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

    lines.push(
      `${marker} ${team.name.toUpperCase()}`,
    );
    team.players.forEach((player) => {
      const suffix = player.type === "goalkeeper" ? " (Goleiro)" : "";
      lines.push(`${player.name}${suffix}`);
    });
    lines.push("");
  });

  return lines.join("\n").trim();
}

export function TeamDrawPage() {
  const [storedDrawState] = useState(() => loadStoredDrawState());
  const [participants, setParticipants] = useState<DrawParticipant[]>(
    storedDrawState.participants,
  );
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState(
    storedDrawState.maxPlayersPerTeam,
  );
  const [drawMode, setDrawMode] = useState<DrawMode>("random");
  const [teams, setTeams] = useState<DrawTeam[]>(storedDrawState.teams);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const eventDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(eventMock.startsAt);

  const eventTime = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(eventMock.startsAt);

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
  ) => {
    const name = rawName.trim();

    if (!name) {
      setSnackbarMessage("Informe o nome do jogador.");
      return false;
    }

    const isDuplicate = participants.some(
      (participant) => participant.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"),
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
      },
    ]);
    setTeams([]);
    return true;
  };

  const removeParticipant = (participantId: number) => {
    setParticipants((currentParticipants) =>
      currentParticipants.filter((participant) => participant.id !== participantId),
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

      if (existingNames.has(normalizedName) || importedNames.has(normalizedName)) {
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
      })),
    ]);
    setTeams([]);

    const ignoredCount = importedParticipants.length - uniqueParticipants.length;
    setSnackbarMessage(
      ignoredCount > 0
        ? `${uniqueParticipants.length} jogadores importados. ${ignoredCount} duplicado(s) ignorado(s).`
        : `${uniqueParticipants.length} jogadores importados com sucesso.`,
    );
  };

  const runDraw = () => {
    if (participants.length === 0) {
      setSnackbarMessage("Adicione pelo menos um jogador antes de sortear.");
      return;
    }

    setIsDrawing(true);
    window.setTimeout(() => {
      const generatedTeams = generateTeams(
        participants,
        maxPlayersPerTeam,
      );
      setTeams(generatedTeams);
      setIsDrawing(false);
      setSnackbarMessage("Sorteio gerado com a quantidade automática de times.");
    }, 700);
  };

  const copyTeams = async () => {
    const text = formatTeamsForClipboard(teams);

    try {
      await navigator.clipboard.writeText(text);
      setSnackbarMessage("Times copiados para a área de transferência.");
    } catch {
      setSnackbarMessage("Resultado formatado gerado para cópia.");
    }
  };

  const shareTeams = async () => {
    const text = formatTeamsForClipboard(teams);

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
    <Stack spacing={{ xs: 2, md: 3 }} sx={{ pb: { xs: 10, lg: 0 } }}>
      <Stack spacing={0.5}>
        <Typography variant="h1">Sorteio dos times</Typography>
        <Typography color="text.secondary">
          Monte os times rapidamente e copie o resultado para enviar no
          WhatsApp.
        </Typography>
      </Stack>

      <Card>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack spacing={{ xs: 1.5, md: 2.5 }}>
            <Box>
              <Typography variant="h2">{eventMock.title}</Typography>
              <Typography color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
                Informações do evento selecionado.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: "row", md: "row" }}
              spacing={{ xs: 1.5, md: 2.5 }}
              useFlexGap
              sx={{ flexWrap: "wrap" }}
            >
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ alignItems: "center" }}
              >
                <CalendarMonthOutlinedIcon color="primary" fontSize="small" />
                <Typography variant="body2">{eventDate}</Typography>
              </Stack>
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ alignItems: "center" }}
              >
                <AccessTimeOutlinedIcon color="primary" fontSize="small" />
                <Typography variant="body2">{eventTime}</Typography>
              </Stack>
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ alignItems: "center" }}
              >
                <LocationOnOutlinedIcon color="primary" fontSize="small" />
                <Typography variant="body2">{eventMock.location}</Typography>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ display: { xs: "block", sm: "none" } }}>
        <CardContent sx={{ p: 1.5 }}>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            <Chip label={`${summary.totalPlayers} jogadores`} color="primary" />
            <Chip label={`${summary.goalkeepers} goleiros`} variant="outlined" />
            <Chip label={`${summary.guests} convidados`} variant="outlined" />
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ display: { xs: "none", sm: "flex" } }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventMetricCard
            label="Confirmados"
            value={summary.confirmed}
            helper="Mensalistas e goleiros"
            icon={<GroupsOutlinedIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventMetricCard
            label="Goleiros"
            value={summary.goalkeepers}
            helper="Confirmados no evento"
            icon={<SportsHandballOutlinedIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventMetricCard
            label="Convidados"
            value={summary.guests}
            helper="Participantes convidados"
            icon={<PersonAddAltOutlinedIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventMetricCard
            label="Total participantes"
            value={summary.totalPlayers}
            helper={`${summary.goalkeepers} goleiro${summary.goalkeepers === 1 ? "" : "s"} à parte`}
            icon={<ShuffleOutlinedIcon color="primary" />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <DrawConfigCard
              maxPlayersPerTeam={maxPlayersPerTeam}
              drawMode={drawMode}
              onMaxPlayersPerTeamChange={setMaxPlayersPerTeam}
              onDrawModeChange={setDrawMode}
            />
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
              disabled={isDrawing}
              sx={{ display: { xs: "none", lg: "inline-flex" } }}
            >
              {isDrawing ? "Gerando sorteio..." : "Gerar sorteio"}
            </Button>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ParticipantsGridCard
            participants={participants}
            onAdd={addParticipant}
            onRemove={removeParticipant}
            onClear={clearParticipants}
            onOpenBulkImport={() => setIsBulkImportOpen(true)}
          />
        </Grid>
      </Grid>

      {teams.length > 0 ? (
        <DrawResultCard
          teams={teams}
          onRedraw={runDraw}
          onCopy={copyTeams}
          onShare={shareTeams}
        />
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
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "divider",
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
          disabled={isDrawing}
          fullWidth
        >
          {isDrawing ? "Gerando sorteio..." : `Gerar sorteio (${participants.length})`}
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
