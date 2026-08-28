import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import MilitaryTechOutlinedIcon from "@mui/icons-material/MilitaryTechOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import axios from "axios";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
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
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { getTodayDateInput } from "../features/matchDays/format";
import {
  createMatchDay,
  type CreateMatchDayPayload,
} from "../features/matchDays/matchDaysApi";
import {
  fetchTeamDrawPlayers,
  mapApiPlayerToDrawParticipant,
} from "../features/teamDraw/services/usersApi";
import type { DrawParticipant } from "../features/teamDraw/types";

type ManualPlayerDraft =
  | {
      kind: "player";
      key: string;
      playerId: string;
      name: string;
      nickname?: string;
      jerseyNumber?: number;
      photoUrl?: string;
      isGoalkeeper: boolean;
    }
  | { kind: "guest"; key: string; name: string };

type ManualTeamDraft = {
  key: string;
  name: string;
  players: ManualPlayerDraft[];
};

function createKey() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `key-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEmptyTeam(order: number): ManualTeamDraft {
  return { key: createKey(), name: `Time ${order}`, players: [] };
}

function getManualPlayerLabel(player: ManualPlayerDraft) {
  if (player.kind === "guest") {
    return player.name;
  }

  return player.nickname ? `${player.name} (${player.nickname})` : player.name;
}

export function MatchDayCreatePage() {
  const navigate = useNavigate();

  const [date, setDate] = useState(getTodayDateInput());
  const [maxOutfieldPlayersPerTeam, setMaxOutfieldPlayersPerTeam] =
    useState(6);
  const [teamsDraft, setTeamsDraft] = useState<ManualTeamDraft[]>([
    createEmptyTeam(1),
    createEmptyTeam(2),
  ]);

  const [registeredPlayers, setRegisteredPlayers] = useState<
    DrawParticipant[]
  >([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  const [selectedPlayerIdsByTeam, setSelectedPlayerIdsByTeam] = useState<
    Record<string, string[]>
  >({});
  const [guestNameByTeam, setGuestNameByTeam] = useState<
    Record<string, string>
  >({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    fetchTeamDrawPlayers()
      .then((players) => {
        if (isMounted) {
          setRegisteredPlayers(players.map(mapApiPlayerToDrawParticipant));
        }
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage("Não foi possível carregar os jogadores cadastrados.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingPlayers(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const assignedPlayerIds = useMemo(() => {
    const ids = new Set<string>();

    teamsDraft.forEach((team) => {
      team.players.forEach((player) => {
        if (player.kind === "player") {
          ids.add(player.playerId);
        }
      });
    });

    return ids;
  }, [teamsDraft]);

  const availablePlayers = useMemo(
    () =>
      registeredPlayers.filter(
        (player) => !assignedPlayerIds.has(String(player.id)),
      ),
    [registeredPlayers, assignedPlayerIds],
  );

  const addTeam = () => {
    setTeamsDraft((current) => [
      ...current,
      createEmptyTeam(current.length + 1),
    ]);
  };

  const removeTeam = (teamKey: string) => {
    if (teamsDraft.length <= 2) {
      return;
    }

    setTeamsDraft((current) => current.filter((team) => team.key !== teamKey));
  };

  const renameTeam = (teamKey: string, name: string) => {
    setTeamsDraft((current) =>
      current.map((team) => (team.key === teamKey ? { ...team, name } : team)),
    );
  };

  const addSelectedPlayersToTeam = (teamKey: string) => {
    const selectedIds = selectedPlayerIdsByTeam[teamKey] ?? [];

    if (selectedIds.length === 0) {
      return;
    }

    const playersToAdd = availablePlayers.filter((player) =>
      selectedIds.includes(String(player.id)),
    );

    setTeamsDraft((current) =>
      current.map((team) =>
        team.key === teamKey
          ? {
              ...team,
              players: [
                ...team.players,
                ...playersToAdd.map(
                  (player): ManualPlayerDraft => ({
                    kind: "player",
                    key: createKey(),
                    playerId: String(player.id),
                    name: player.name,
                    nickname: player.nickname,
                    jerseyNumber: player.jerseyNumber,
                    photoUrl: player.photoUrl,
                    isGoalkeeper: player.type === "goalkeeper",
                  }),
                ),
              ],
            }
          : team,
      ),
    );
    setSelectedPlayerIdsByTeam((current) => ({ ...current, [teamKey]: [] }));
  };

  const addGuestToTeam = (teamKey: string) => {
    const name = (guestNameByTeam[teamKey] ?? "").trim();

    if (!name) {
      return;
    }

    setTeamsDraft((current) =>
      current.map((team) =>
        team.key === teamKey
          ? {
              ...team,
              players: [
                ...team.players,
                { kind: "guest", key: createKey(), name },
              ],
            }
          : team,
      ),
    );
    setGuestNameByTeam((current) => ({ ...current, [teamKey]: "" }));
  };

  const removePlayerFromTeam = (teamKey: string, playerKey: string) => {
    setTeamsDraft((current) =>
      current.map((team) =>
        team.key === teamKey
          ? {
              ...team,
              players: team.players.filter(
                (player) => player.key !== playerKey,
              ),
            }
          : team,
      ),
    );
  };

  const submit = async () => {
    setErrorMessage("");

    if (!date) {
      setErrorMessage("Informe a data da rodada.");
      return;
    }

    if (teamsDraft.length < 2) {
      setErrorMessage("Adicione pelo menos dois times.");
      return;
    }

    if (teamsDraft.some((team) => !team.name.trim())) {
      setErrorMessage("Todos os times precisam de um nome.");
      return;
    }

    if (teamsDraft.some((team) => team.players.length === 0)) {
      setErrorMessage("Cada time precisa de pelo menos um jogador.");
      return;
    }

    const payload: CreateMatchDayPayload = {
      date,
      maxOutfieldPlayersPerTeam,
      teams: teamsDraft.map((team) => ({
        name: team.name.trim(),
        players: team.players.map((player) =>
          player.kind === "player"
            ? { playerId: player.playerId }
            : { name: player.name, type: "GUEST" as const },
        ),
      })),
    };

    setIsSubmitting(true);

    try {
      const created = await createMatchDay(payload);
      navigate(`/rodadas/${created.id}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setErrorMessage("Já existe uma rodada cadastrada para essa data.");
      } else if (axios.isAxiosError(error) && error.response?.status === 400) {
        setErrorMessage(
          "Confira os times: limite de jogadores por time, jogador inativo ou duplicado.",
        );
      } else {
        setErrorMessage("Não foi possível criar a rodada.");
      }
    } finally {
      setIsSubmitting(false);
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
            sx={{ width: 54, height: 54, bgcolor: "#fff", color: "primary.main" }}
          >
            <MilitaryTechOutlinedIcon fontSize="large" />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h1"
              sx={{ color: "inherit", fontSize: { xs: "1.4rem", sm: "1.75rem" } }}
            >
              Nova rodada
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>
              Monte os times manualmente, sem precisar sortear.
            </Typography>
          </Box>
          <Button
            component={RouterLink}
            to="/rodadas"
            variant="outlined"
            startIcon={<ArrowBackOutlinedIcon />}
            sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.55)" }}
          >
            Times da semana
          </Button>
        </Stack>
      </Paper>

      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            label="Data"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            label="Jogadores de linha por time"
            type="number"
            value={maxOutfieldPlayersPerTeam}
            onChange={(event) =>
              setMaxOutfieldPlayersPerTeam(
                Math.max(1, Number(event.target.value || 1)),
              )
            }
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
            fullWidth
          />
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        {teamsDraft.map((team) => {
          const selectedIds = selectedPlayerIdsByTeam[team.key] ?? [];

          return (
            <Paper key={team.key} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <TextField
                    label="Nome do time"
                    value={team.name}
                    onChange={(event) =>
                      renameTeam(team.key, event.target.value)
                    }
                    size="small"
                    fullWidth
                  />
                  <Tooltip title="Remover time">
                    <span>
                      <IconButton
                        color="error"
                        onClick={() => removeTeam(team.key)}
                        disabled={teamsDraft.length <= 2}
                      >
                        <DeleteOutlineOutlinedIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>

                {team.players.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    Nenhum jogador neste time ainda.
                  </Typography>
                ) : (
                  <Stack spacing={0.75}>
                    {team.players.map((player) => (
                      <Stack
                        key={player.key}
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
                        <Avatar
                          src={
                            player.kind === "player"
                              ? player.photoUrl
                              : undefined
                          }
                          sx={{ width: 28, height: 28, fontSize: 12 }}
                        >
                          {player.name.charAt(0).toLocaleUpperCase("pt-BR")}
                        </Avatar>
                        <Typography
                          variant="body2"
                          sx={{ flex: 1, fontWeight: 700, minWidth: 0 }}
                          noWrap
                        >
                          {getManualPlayerLabel(player)}
                        </Typography>
                        {player.kind === "player" && player.isGoalkeeper ? (
                          <Chip label="Goleiro" size="small" color="primary" variant="outlined" />
                        ) : null}
                        {player.kind === "guest" ? (
                          <Chip label="Convidado" size="small" color="secondary" variant="outlined" />
                        ) : null}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            removePlayerFromTeam(team.key, player.key)
                          }
                        >
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                )}

                <Stack direction="row" spacing={1}>
                  <Select
                    multiple
                    displayEmpty
                    size="small"
                    value={selectedIds}
                    disabled={isLoadingPlayers || availablePlayers.length === 0}
                    onChange={(event) => {
                      const value = event.target.value;

                      setSelectedPlayerIdsByTeam((current) => ({
                        ...current,
                        [team.key]:
                          typeof value === "string" ? value.split(",") : value,
                      }));
                    }}
                    renderValue={(selected) =>
                      selected.length === 0
                        ? "Selecionar jogadores"
                        : `${selected.length} selecionado${selected.length === 1 ? "" : "s"}`
                    }
                    sx={{ flex: 1 }}
                  >
                    {availablePlayers.map((player) => {
                      const playerId = String(player.id);

                      return (
                        <MenuItem key={playerId} value={playerId}>
                          <Checkbox checked={selectedIds.includes(playerId)} />
                          <Typography variant="body2" noWrap>
                            {player.nickname
                              ? `${player.name} (${player.nickname})`
                              : player.name}
                          </Typography>
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddOutlinedIcon />}
                    onClick={() => addSelectedPlayersToTeam(team.key)}
                    disabled={selectedIds.length === 0}
                  >
                    Adicionar
                  </Button>
                </Stack>

                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Convidado avulso"
                    size="small"
                    value={guestNameByTeam[team.key] ?? ""}
                    onChange={(event) =>
                      setGuestNameByTeam((current) => ({
                        ...current,
                        [team.key]: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addGuestToTeam(team.key);
                      }
                    }}
                    fullWidth
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PersonAddAltOutlinedIcon />}
                    onClick={() => addGuestToTeam(team.key)}
                    disabled={!(guestNameByTeam[team.key] ?? "").trim()}
                  >
                    Adicionar
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button
          variant="outlined"
          startIcon={<AddOutlinedIcon />}
          onClick={addTeam}
        >
          Adicionar time
        </Button>
        <Button
          variant="contained"
          startIcon={
            isSubmitting ? (
              <CircularProgress color="inherit" size={18} />
            ) : (
              <SaveOutlinedIcon />
            )
          }
          onClick={() => void submit()}
          disabled={isSubmitting}
          sx={{ ml: { sm: "auto" } }}
        >
          Criar rodada
        </Button>
      </Stack>
    </Stack>
  );
}
