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
  DrawLateArrivalRule,
  DrawParticipant,
  DrawParticipantType,
  DrawSpecialGroupingConfig,
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

const defaultSpecialGroupings: DrawSpecialGroupingConfig[] = [
  {
    id: "agrupamento-fixo",
    name: "Agrupamento fixo",
    enabled: true,
    target: "team",
    preferredTeamIndexes: [0, 1],
    rules: [
      { name: "TZ" },
      { name: "FILIPE" },
      { name: "SAYA" },
      { name: "ITALO BARROS" },
      { name: "GABRIEL GIL" },
      { name: "GABRIEL", aliases: ["GABEMONSTER"], type: "goalkeeper" },
    ],
  },
  {
    id: "agrupamento-ronald",
    name: "Agrupamento Ronald",
    enabled: true,
    target: "team",
    rules: [
      { name: "RONALD" },
      { name: "FELIPE", aliases: ["FELIPE M"] },
      { name: "MARCO P", aliases: ["MARCO PITANGUEIRA"] },
      { name: "JOHN", aliases: ["JONH"] },
      { name: "DUDU", aliases: ["EDUARDO"] },
    ],
  },
];

const defaultLateArrivalRule: DrawLateArrivalRule = {
  id: "joao-mendes-ultimo-time",
  name: "Chegada tardia",
  enabled: true,
  aliases: ["JOAO MENDES", "JOÃO MENDES", "MENDES"],
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

function normalizeParticipantName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function getParticipantByRule(
  participants: DrawParticipant[],
  rule: DrawSpecialGroupingConfig["rules"][number],
) {
  const ruleNames = [rule.name, ...(rule.aliases ?? [])].map((name) =>
    normalizeParticipantName(name),
  );

  return participants.find((participant) => {
    const hasSameName = ruleNames.includes(normalizeParticipantName(participant.name));
    const hasSameType = !rule.type || participant.type === rule.type;

    return hasSameName && hasSameType;
  });
}

function getSpecialGroupingParticipants(
  participants: DrawParticipant[],
  specialGrouping: DrawSpecialGroupingConfig,
) {
  if (!specialGrouping.enabled) {
    return [];
  }

  const groupedParticipants = specialGrouping.rules.map((rule) =>
    getParticipantByRule(participants, rule),
  );
  const requiredParticipants = groupedParticipants.filter(
    (_, index) => !specialGrouping.rules[index].optional,
  );

  if (requiredParticipants.some((participant) => !participant)) {
    return [];
  }

  return groupedParticipants.filter((participant) => participant) as DrawParticipant[];
}

function getLateArrivalParticipant(
  participants: DrawParticipant[],
  lateArrivalRule: DrawLateArrivalRule,
) {
  if (!lateArrivalRule.enabled) {
    return null;
  }

  const lateArrivalNames = lateArrivalRule.aliases.map((name) =>
    normalizeParticipantName(name),
  );

  return (
    participants.find((participant) =>
      lateArrivalNames.includes(normalizeParticipantName(participant.name)),
    ) ?? null
  );
}

function countFieldPlayers(players: DrawParticipant[]) {
  return players.filter((player) => player.type !== "goalkeeper").length;
}

function findTeamWithFewestFieldPlayers(
  teams: DrawTeam[],
  maxPlayersPerTeam: number,
) {
  const teamsWithCapacity = teams.filter(
    (team) => countFieldPlayers(team.players) < maxPlayersPerTeam,
  );
  const eligibleTeams = teamsWithCapacity.length > 0 ? teamsWithCapacity : teams;

  return eligibleTeams.reduce((selectedTeam, currentTeam) => {
    if (countFieldPlayers(currentTeam.players) < countFieldPlayers(selectedTeam.players)) {
      return currentTeam;
    }

    return selectedTeam;
  }, eligibleTeams[0]);
}

function createDrawTeam(index: number): DrawTeam {
  return {
    id: index + 1,
    name: teamNames[index] ?? `Time ${index + 1}`,
    color: teamColors[index] ?? "default",
    players: [],
  };
}

function getRandomTargetTeam(
  teams: DrawTeam[],
  maxPlayersPerTeam: number,
  playersToAdd: DrawParticipant[],
  preferredTeamIndexes?: number[],
) {
  const fieldPlayersToAdd = countFieldPlayers(playersToAdd);
  const preferredTeams = preferredTeamIndexes
    ?.map((teamIndex) => teams[teamIndex])
    .filter((team): team is DrawTeam => Boolean(team));
  const preferredTeamsWithCapacity = preferredTeams?.filter(
    (team) => countFieldPlayers(team.players) + fieldPlayersToAdd <= maxPlayersPerTeam,
  );
  const teamsWithCapacity = teams.filter(
    (team) => countFieldPlayers(team.players) + fieldPlayersToAdd <= maxPlayersPerTeam,
  );
  const eligibleTeams =
    preferredTeamsWithCapacity?.length
      ? preferredTeamsWithCapacity
      : teamsWithCapacity;

  if (eligibleTeams.length === 0) {
    const extraTeam = createDrawTeam(teams.length);

    teams.push(extraTeam);
    return extraTeam;
  }

  return eligibleTeams[Math.floor(Math.random() * eligibleTeams.length)];
}

function findOrCreateTeamWithFieldCapacity(
  teams: DrawTeam[],
  maxPlayersPerTeam: number,
  player: DrawParticipant,
) {
  if (player.type === "goalkeeper") {
    return findTeamWithFewestFieldPlayers(teams, maxPlayersPerTeam);
  }

  const teamWithCapacity = findTeamWithFewestFieldPlayers(teams, maxPlayersPerTeam);

  if (countFieldPlayers(teamWithCapacity.players) < maxPlayersPerTeam) {
    return teamWithCapacity;
  }

  const extraTeam = createDrawTeam(teams.length);

  teams.push(extraTeam);
  return extraTeam;
}

function putGoalkeepersFirst(players: DrawParticipant[]) {
  return [
    ...players.filter((player) => player.type === "goalkeeper"),
    ...players.filter((player) => player.type !== "goalkeeper"),
  ];
}

function generateTeams(
  participants: DrawParticipant[],
  maxPlayersPerTeam: number,
  specialGroupings: DrawSpecialGroupingConfig[],
  lateArrivalRule: DrawLateArrivalRule,
): DrawTeam[] {
  const appliedSpecialGroupings = specialGroupings
    .map((grouping) => ({
      grouping,
      participants: getSpecialGroupingParticipants(participants, grouping),
    }))
    .filter(({ participants }) => participants.length > 0);
  const groupedParticipantIds = new Set(
    appliedSpecialGroupings.flatMap(({ participants }) =>
      participants.map((participant) => participant.id),
    ),
  );
  const lateArrivalParticipant = getLateArrivalParticipant(
    participants.filter((participant) => !groupedParticipantIds.has(participant.id)),
    lateArrivalRule,
  );
  const reservedParticipantIds = new Set([
    ...groupedParticipantIds,
    ...(lateArrivalParticipant ? [lateArrivalParticipant.id] : []),
  ]);
  const availableParticipants = participants.filter(
    (participant) => !reservedParticipantIds.has(participant.id),
  );
  const goalkeepers = shuffleParticipants(
    availableParticipants.filter((participant) => participant.type === "goalkeeper"),
  );
  const fieldPlayers = shuffleParticipants(
    availableParticipants.filter((participant) => participant.type !== "goalkeeper"),
  );
  const totalFieldPlayers = participants.filter(
    (participant) => participant.type !== "goalkeeper",
  ).length;
  const teamCount = Math.max(
    1,
    Math.ceil(totalFieldPlayers / maxPlayersPerTeam),
  );
  const teams: DrawTeam[] = Array.from({ length: teamCount }, (_, index) =>
    createDrawTeam(index),
  );

  appliedSpecialGroupings.forEach(({ grouping, participants: groupingParticipants }) => {
    const targetTeam = getRandomTargetTeam(
      teams,
      maxPlayersPerTeam,
      groupingParticipants,
      grouping.preferredTeamIndexes,
    );

    targetTeam.players.push(...shuffleParticipants(groupingParticipants));
    targetTeam.appliedGroupingNames = [
      ...(targetTeam.appliedGroupingNames ?? []),
      grouping.name,
    ];
  });

  fieldPlayers.forEach((player) => {
    findOrCreateTeamWithFieldCapacity(teams, maxPlayersPerTeam, player).players.push(player);
  });

  goalkeepers.forEach((goalkeeper, index) => {
    const teamsWithoutGoalkeeper = teams.filter(
      (team) => !team.players.some((player) => player.type === "goalkeeper"),
    );
    const eligibleTeams = teamsWithoutGoalkeeper.length > 0 ? teamsWithoutGoalkeeper : teams;
    const targetTeam = eligibleTeams[index % eligibleTeams.length];

    targetTeam.players.unshift(goalkeeper);
  });

  if (lateArrivalParticipant) {
    const currentLastTeam = teams[teams.length - 1];
    const lastTeam =
      lateArrivalParticipant.type === "goalkeeper" ||
      countFieldPlayers(currentLastTeam.players) < maxPlayersPerTeam
        ? currentLastTeam
        : createDrawTeam(teams.length);

    if (!teams.includes(lastTeam)) {
      teams.push(lastTeam);
    }

    lastTeam.players.push(lateArrivalParticipant);
    lastTeam.appliedGroupingNames = [
      ...(lastTeam.appliedGroupingNames ?? []),
      lateArrivalRule.name,
    ];
  }

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
        defaultSpecialGroupings,
        defaultLateArrivalRule,
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
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", position: "relative", zIndex: 1 }}>
          <Avatar sx={{ width: { xs: 48, sm: 58 }, height: { xs: 48, sm: 58 }, bgcolor: "#fff", color: "primary.main" }}>
            <SportsSoccerOutlinedIcon fontSize="large" />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h1" sx={{ color: "inherit", fontSize: { xs: "1.65rem", sm: "2rem" } }}>
              Sorteio dos times
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>
              {summary.totalPeople === 0 ? "A bola está esperando." : `${summary.totalPeople} nomes prontos para jogar`}
            </Typography>
          </Box>
          <Chip
            icon={<SportsSoccerOutlinedIcon />}
            label={`${summary.totalPlayers} de linha`}
            sx={{ display: { xs: "none", sm: "inline-flex" }, bgcolor: "rgba(255,255,255,0.12)", color: "#fff", "& .MuiChip-icon": { color: "#fff" } }}
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
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="h3">Pronto para sortear</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {summary.goalkeepers} goleiro{summary.goalkeepers === 1 ? "" : "s"} na lista
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
              teams={teams}
              onRedraw={runDraw}
              onCopy={copyTeams}
              onShare={shareTeams}
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
          disabled={isDrawing || participants.length === 0}
          fullWidth
        >
          {isDrawing ? "Sorteando..." : `Sortear ${participants.length} jogadores`}
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
