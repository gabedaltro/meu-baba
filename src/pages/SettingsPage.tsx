import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  ListItemText,
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
import { useAuth } from "../features/auth/authContext";
import { fetchPlayers, type Player } from "../features/players/playersApi";
import {
  fetchSettings,
  saveSettings,
  type PlayerGroupSetting,
} from "../features/settings/settingsApi";

type SettingsFormState = {
  maxGuestsPerTeam: string;
  outfieldPlayersPerTeam: string;
};

const defaultForm: SettingsFormState = {
  maxGuestsPerTeam: "2",
  outfieldPlayersPerTeam: "5",
};

function getNumberValue(value: string, fallback: number) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : fallback;
}

function getPlayerName(player: Player) {
  return player.nickname ? `${player.name} (${player.nickname})` : player.name;
}

function getPlayerTypeLabel(player: Player) {
  if (player.position === "GOALKEEPER") {
    return "Goleiro";
  }

  return player.type === "GUEST" ? "Convidado" : "Mensalista";
}

function getPlayerId(player: Player) {
  return String(player.id);
}

function normalizeGroups(groups: PlayerGroupSetting[]) {
  return groups
    .map((group) => ({
      playerIds: Array.from(new Set(group.playerIds.map(String))),
    }))
    .filter((group) => group.playerIds.length > 0);
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { clearSession } = useAuth();
  const [form, setForm] = useState<SettingsFormState>(defaultForm);
  const [playerGroups, setPlayerGroups] = useState<PlayerGroupSetting[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const activePlayers = useMemo(
    () => players.filter((player) => player.isActive),
    [players],
  );
  const playerById = useMemo(
    () => new Map(players.map((player) => [getPlayerId(player), player])),
    [players],
  );

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([fetchSettings(), fetchPlayers()])
      .then(([settingsResult, playersResult]) => {
        if (!isMounted) {
          return;
        }

        if (settingsResult.status === "fulfilled") {
          setForm({
            maxGuestsPerTeam: String(settingsResult.value.maxGuestsPerTeam),
            outfieldPlayersPerTeam: String(
              settingsResult.value.outfieldPlayersPerTeam,
            ),
          });
          setPlayerGroups(settingsResult.value.playerGroups ?? []);
        } else if (settingsResult.reason?.response?.status !== 404) {
          setErrorMessage("Nao foi possivel carregar as configurações.");
        }

        if (playersResult.status === "fulfilled") {
          setPlayers(playersResult.value);
        } else {
          setErrorMessage("Nao foi possivel carregar os jogadores.");
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

  const usedPlayerIdsByOtherGroups = (groupIndex: number) =>
    new Set(
      playerGroups.flatMap((group, index) =>
        index === groupIndex ? [] : group.playerIds.map(String),
      ),
    );

  const getAvailablePlayersForGroup = (groupIndex: number) => {
    const usedPlayerIds = usedPlayerIdsByOtherGroups(groupIndex);

    return activePlayers.filter(
      (player) => !usedPlayerIds.has(getPlayerId(player)),
    );
  };

  const updateField = (field: keyof SettingsFormState, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setMessage("");
    setErrorMessage("");
  };

  const addGroup = () => {
    setPlayerGroups((currentGroups) => [...currentGroups, { playerIds: [] }]);
    setMessage("");
    setErrorMessage("");
  };

  const removeGroup = (groupIndex: number) => {
    setPlayerGroups((currentGroups) =>
      currentGroups.filter((_, index) => index !== groupIndex),
    );
    setMessage("");
    setErrorMessage("");
  };

  const updateGroupPlayers = (groupIndex: number, value: string[] | string) => {
    const selectedIds = Array.isArray(value) ? value : value.split(",");
    const usedPlayerIds = usedPlayerIdsByOtherGroups(groupIndex);
    const nextPlayerIds = selectedIds
      .map(String)
      .filter((playerId) => playerId && !usedPlayerIds.has(playerId));

    setPlayerGroups((currentGroups) =>
      currentGroups.map((group, index) =>
        index === groupIndex ? { ...group, playerIds: nextPlayerIds } : group,
      ),
    );
    setMessage("");
    setErrorMessage("");
  };

  const validateGroups = (groups: PlayerGroupSetting[]) => {
    const seenPlayerIds = new Set<string>();

    for (const group of groups) {
      if (group.playerIds.length < 2) {
        return "Cada agrupamento precisa ter pelo menos 2 jogadores.";
      }

      for (const playerId of group.playerIds) {
        if (seenPlayerIds.has(playerId)) {
          return "Um jogador nao pode aparecer em mais de um agrupamento.";
        }

        seenPlayerIds.add(playerId);
      }
    }

    return null;
  };

  const disconnect = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const submitSettings = async () => {
    const maxGuestsPerTeam = getNumberValue(form.maxGuestsPerTeam, 0);
    const outfieldPlayersPerTeam = getNumberValue(
      form.outfieldPlayersPerTeam,
      1,
    );
    const normalizedGroups = normalizeGroups(playerGroups);
    const groupError = validateGroups(normalizedGroups);

    if (outfieldPlayersPerTeam < 1) {
      setErrorMessage("Informe pelo menos 1 jogador de linha por time.");
      return;
    }

    if (groupError) {
      setErrorMessage(groupError);
      return;
    }

    setIsSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const savedSettings = await saveSettings({
        maxGuestsPerTeam,
        outfieldPlayersPerTeam,
        playerGroups: normalizedGroups,
      });

      setForm({
        maxGuestsPerTeam: String(savedSettings.maxGuestsPerTeam),
        outfieldPlayersPerTeam: String(savedSettings.outfieldPlayersPerTeam),
      });
      setPlayerGroups(savedSettings.playerGroups ?? []);
      setMessage("Configurações salvas com sucesso.");
    } catch {
      setErrorMessage("Nao foi possivel salvar as configurações.");
    } finally {
      setIsSaving(false);
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
            <SettingsOutlinedIcon fontSize="large" />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h1"
              sx={{ color: "inherit", fontSize: { xs: "1.65rem", sm: "2rem" } }}
            >
              Configurações do sorteio
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>
              Ajustes operacionais usados pelo sorteio de times
            </Typography>
          </Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ alignItems: { xs: "stretch", sm: "center" } }}
          >
            <Button
              component={RouterLink}
              to="/sorteio"
              variant="outlined"
              startIcon={<ArrowBackOutlinedIcon />}
              sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.55)" }}
            >
              Ir para sorteio
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<LogoutOutlinedIcon />}
              onClick={disconnect}
            >
              Desconectar
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {message ? <Alert severity="success">{message}</Alert> : null}
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        {isLoading ? (
          <Stack sx={{ alignItems: "center", py: 5 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={3}>
            <Stack spacing={2.5} sx={{ maxWidth: 620 }}>
              <Typography variant="h2">Regras gerais</Typography>
              <TextField
                label="Maximo de convidados por time"
                type="number"
                value={form.maxGuestsPerTeam}
                onChange={(event) =>
                  updateField("maxGuestsPerTeam", event.target.value)
                }
                slotProps={{ htmlInput: { min: 0 } }}
                fullWidth
              />
              <TextField
                label="Jogadores de linha por time"
                type="number"
                value={form.outfieldPlayersPerTeam}
                onChange={(event) =>
                  updateField("outfieldPlayersPerTeam", event.target.value)
                }
                helperText="Usado apenas como valor padrao do input no sorteio."
                slotProps={{ htmlInput: { min: 1 } }}
                fullWidth
              />
            </Stack>

            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ alignItems: { xs: "stretch", sm: "center" } }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h2">Agrupamentos</Typography>
                  <Typography color="text.secondary">
                    Selecione jogadores que devem cair no mesmo time.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<AddOutlinedIcon />}
                  onClick={addGroup}
                  disabled={activePlayers.length < 2}
                >
                  Adicionar grupo
                </Button>
              </Stack>

              {playerGroups.length === 0 ? (
                <Stack
                  sx={{
                    alignItems: "center",
                    border: "1px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                    py: 4,
                    px: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 800 }}>
                    Nenhum agrupamento configurado
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{ textAlign: "center" }}
                  >
                    Adicione um grupo quando quiser manter jogadores juntos no
                    sorteio.
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  {playerGroups.map((group, groupIndex) => {
                    const availablePlayers =
                      getAvailablePlayersForGroup(groupIndex);

                    return (
                      <Paper key={groupIndex} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={1.5}>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: "center" }}
                          >
                            <Typography variant="h3" sx={{ flex: 1 }}>
                              Grupo {groupIndex + 1}
                            </Typography>
                            <Tooltip title="Remover grupo">
                              <IconButton
                                color="error"
                                onClick={() => removeGroup(groupIndex)}
                                aria-label={`Remover grupo ${groupIndex + 1}`}
                              >
                                <DeleteOutlineOutlinedIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>

                          <Select
                            multiple
                            value={group.playerIds.map(String)}
                            onChange={(event) =>
                              updateGroupPlayers(
                                groupIndex,
                                event.target.value as string[] | string,
                              )
                            }
                            displayEmpty
                            renderValue={(selected) => {
                              const selectedIds = selected as string[];

                              if (selectedIds.length === 0) {
                                return "Selecione ao menos 2 jogadores";
                              }

                              return (
                                <Stack
                                  direction="row"
                                  spacing={0.5}
                                  useFlexGap
                                  sx={{ flexWrap: "wrap" }}
                                >
                                  {selectedIds.map((playerId) => {
                                    const player = playerById.get(playerId);

                                    return (
                                      <Chip
                                        key={playerId}
                                        label={
                                          player
                                            ? getPlayerName(player)
                                            : playerId
                                        }
                                        size="small"
                                      />
                                    );
                                  })}
                                </Stack>
                              );
                            }}
                            fullWidth
                          >
                            {availablePlayers.map((player) => {
                              const playerId = getPlayerId(player);
                              const isSelected = group.playerIds
                                .map(String)
                                .includes(playerId);

                              return (
                                <MenuItem key={playerId} value={playerId}>
                                  <Checkbox checked={isSelected} />
                                  <ListItemText
                                    primary={getPlayerName(player)}
                                    secondary={getPlayerTypeLabel(player)}
                                  />
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Stack>

            <Button
              variant="contained"
              size="large"
              startIcon={
                isSaving ? (
                  <CircularProgress color="inherit" size={18} />
                ) : (
                  <SaveOutlinedIcon />
                )
              }
              onClick={submitSettings}
              disabled={isSaving}
              sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
            >
              Salvar configurações
            </Button>
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
