import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SportsSoccerOutlinedIcon from "@mui/icons-material/SportsSoccerOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchPlayerRankings,
  type RankingFilters,
  type RankingMetric,
  type RankingPlayer,
  type RankingResponse,
  type RankingStatus,
} from "../features/rankings/rankingsApi";
import type {
  PlayerPosition,
  PlayerType,
} from "../features/players/playersApi";

const metricLabels: Record<RankingMetric, { label: string; short: string }> = {
  GOALS: { label: "Gols", short: "G" },
  ASSISTS: { label: "Assistências", short: "A" },
};

const podiumStyles = [
  { label: "Ouro", color: "#d99f16", bg: "#fff7df" },
  { label: "Prata", color: "#7a8794", bg: "#f2f5f8" },
  { label: "Bronze", color: "#a7652a", bg: "#fff0e5" },
];

function getMetricFromParams(value: string | null): RankingMetric {
  return value === "ASSISTS" ? "ASSISTS" : "GOALS";
}

function getStatusFromParams(value: string | null): RankingStatus {
  return value === "INACTIVE" || value === "ALL" ? value : "ACTIVE";
}

function getPositionFromParams(value: string | null): PlayerPosition | null {
  return value === "GOALKEEPER" || value === "OUTFIELD" ? value : null;
}

function getTypeFromParams(value: string | null): PlayerType | null {
  if (value === "ALL") {
    return null;
  }

  return value === "GUEST" ? "GUEST" : "MEMBER";
}

function getLimitFromParams(value: string | null) {
  if (!value) {
    return null;
  }

  const parsedLimit = Number(value);

  if (!Number.isInteger(parsedLimit)) {
    return null;
  }

  return Math.min(100, Math.max(1, parsedLimit));
}

function getBooleanFromParams(value: string | null) {
  return value === "true";
}

function getPlayerDisplayName(player: RankingPlayer) {
  return player.nickname ? `${player.name} (${player.nickname})` : player.name;
}

function getPlayerTypeLabel(player: RankingPlayer) {
  if (player.position === "GOALKEEPER") {
    return "Goleiro";
  }

  return player.type === "GUEST" ? "Convidado" : "Mensalista";
}

function getMetricValue(player: RankingPlayer, metric: RankingMetric) {
  return metric === "GOALS" ? player.goals : player.assists;
}

function getMetricSuffix(metric: RankingMetric, value: number) {
  if (metric === "GOALS") {
    return value === 1 ? "gol" : "gols";
  }

  return value === 1 ? "assist" : "assists";
}

function PodiumCard({
  player,
  metric,
  index,
}: {
  player: RankingPlayer;
  metric: RankingMetric;
  index: number;
}) {
  const value = getMetricValue(player, metric);
  const style = podiumStyles[index] ?? podiumStyles[0];

  return (
    <Paper
      component={motion.article}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 2.5 },
        minHeight: 250,
        bgcolor: style.bg,
        borderColor: `${style.color}55`,
        boxShadow: "0 18px 45px rgba(26, 71, 48, 0.12)",
        position: "relative",
        overflow: "hidden",
        "&::after": {
          content: '""',
          position: "absolute",
          width: 130,
          height: 130,
          border: `18px solid ${style.color}18`,
          borderRadius: "50%",
          right: -42,
          top: -42,
        },
      }}
    >
      <Stack
        spacing={2}
        sx={{ position: "relative", zIndex: 1, height: "100%" }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Chip
            icon={<EmojiEventsOutlinedIcon />}
            label={`${style.label} - #${player.rank}`}
            sx={{ bgcolor: style.color, color: "#fff", fontWeight: 900 }}
          />
          <Chip label={getPlayerTypeLabel(player)} variant="outlined" />
        </Stack>
        <Stack
          spacing={1.25}
          sx={{
            alignItems: "center",
            textAlign: "center",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <Avatar
            src={player.photoUrl ?? undefined}
            alt={player.name}
            sx={{
              width: { xs: 82, sm: index === 0 ? 104 : 92 },
              height: { xs: 82, sm: index === 0 ? 104 : 92 },
              border: `4px solid ${style.color}`,
              bgcolor: "#fff",
              color: style.color,
              fontSize: 34,
              fontWeight: 900,
            }}
          >
            {player.name.charAt(0).toLocaleUpperCase("pt-BR")}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" noWrap>
              {getPlayerDisplayName(player)}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {player.jerseyNumber
                ? `Camisa #${player.jerseyNumber}`
                : "Sem numero"}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
          <Chip
            label={`${value} ${getMetricSuffix(metric, value)}`}
            color="primary"
            sx={{ fontWeight: 900, height: 34 }}
          />
          <Chip
            label={`${player.goals} G`}
            variant={metric === "GOALS" ? "filled" : "outlined"}
          />
          <Chip
            label={`${player.assists} A`}
            variant={metric === "ASSISTS" ? "filled" : "outlined"}
          />
        </Stack>
      </Stack>
    </Paper>
  );
}

function RankingRow({
  player,
  metric,
}: {
  player: RankingPlayer;
  metric: RankingMetric;
}) {
  const value = getMetricValue(player, metric);

  return (
    <Stack
      component={motion.article}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      direction="row"
      spacing={1.25}
      sx={{
        alignItems: "center",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "rgba(255,255,255,0.9)",
        borderRadius: 2,
        p: 1.25,
      }}
    >
      <Avatar sx={{ bgcolor: "primary.main", color: "#fff", fontWeight: 900 }}>
        {player.rank}
      </Avatar>
      <Avatar src={player.photoUrl ?? undefined} alt={player.name}>
        {player.name.charAt(0).toLocaleUpperCase("pt-BR")}
      </Avatar>
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 900 }} noWrap>
          {getPlayerDisplayName(player)}
        </Typography>
        <Stack
          direction="row"
          spacing={0.75}
          useFlexGap
          sx={{ flexWrap: "wrap", mt: 0.25 }}
        >
          <Chip label={getPlayerTypeLabel(player)} size="small" />
          {player.jerseyNumber ? (
            <Chip
              label={`#${player.jerseyNumber}`}
              size="small"
              variant="outlined"
            />
          ) : null}
          {!player.isActive ? (
            <Chip
              label="Inativo"
              size="small"
              color="error"
              variant="outlined"
            />
          ) : null}
        </Stack>
      </Stack>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        <Chip
          label={`${value} ${metricLabels[metric].short}`}
          color="primary"
          sx={{ fontWeight: 900 }}
        />
        <Chip
          label={`${player.goals} G`}
          variant={metric === "GOALS" ? "filled" : "outlined"}
        />
        <Chip
          label={`${player.assists} A`}
          variant={metric === "ASSISTS" ? "filled" : "outlined"}
        />
      </Stack>
    </Stack>
  );
}

function PodiumSkeleton() {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, minHeight: 250 }}>
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Skeleton width={130} height={32} />
        <Skeleton variant="circular" width={96} height={96} />
        <Skeleton width="70%" height={30} />
        <Skeleton width="45%" height={36} />
      </Stack>
    </Paper>
  );
}

export function RankingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [rankingResponse, setRankingResponse] =
    useState<RankingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const filters = useMemo<RankingFilters>(
    () => ({
      metric: getMetricFromParams(searchParams.get("metric")),
      limit: getLimitFromParams(searchParams.get("limit")),
      status: getStatusFromParams(searchParams.get("status")),
      position: getPositionFromParams(searchParams.get("position")),
      type: getTypeFromParams(searchParams.get("type")),
      search: searchParams.get("search")?.trim() || null,
      includeZero: getBooleanFromParams(searchParams.get("includeZero")),
    }),
    [searchParams],
  );

  const updateFilter = (
    key: keyof RankingFilters,
    value: string | number | boolean | null,
  ) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value === null || value === "" || value === false) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, String(value));
    }
    setSearchParams(nextParams, { replace: true });
  };

  const loadRankings = () => {
    fetchPlayerRankings(filters)
      .then((response) => {
        setRankingResponse(response);
      })
      .catch(() => {
        setRankingResponse(null);
        setErrorMessage("Nao foi possivel carregar o ranking agora.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;

    fetchPlayerRankings(filters)
      .then((response) => {
        if (isMounted) {
          setRankingResponse(response);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRankingResponse(null);
          setErrorMessage("Nao foi possivel carregar o ranking agora.");
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
  }, [filters]);

  const ranking = rankingResponse?.ranking ?? [];
  const podium = ranking.slice(0, 3);
  const remainingPlayers = ranking.slice(3);

  return (
    <Stack spacing={{ xs: 2.5, md: 4 }} sx={{ pb: 5 }}>
      <Paper
        variant="outlined"
        sx={{
          bgcolor: "#155b39",
          color: "#fff",
          borderColor: "rgba(255,255,255,0.18)",
          p: { xs: 2.25, sm: 3 },
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 20px 60px rgba(16, 70, 43, 0.22)",
          "&::after": {
            content: '""',
            position: "absolute",
            width: 170,
            height: 170,
            border: "2px solid rgba(255,255,255,0.12)",
            borderRadius: "50%",
            right: -52,
            top: -38,
          },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            alignItems: { xs: "stretch", md: "center" },
            position: "relative",
            zIndex: 1,
          }}
        >
          <Avatar
            sx={{
              width: 58,
              height: 58,
              bgcolor: "#fff",
              color: "primary.main",
            }}
          >
            <EmojiEventsOutlinedIcon fontSize="large" />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h1"
              sx={{
                color: "inherit",
                fontSize: { xs: "1.8rem", sm: "2.25rem" },
              }}
            >
              Rankings do Baba
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.76)", maxWidth: 720 }}>
              Veja quem lidera em gols e assistências. Ranking público,
              atualizado pela API.
            </Typography>
          </Box>
          <ToggleButtonGroup
            exclusive
            value={filters.metric}
            onChange={(_, value: RankingMetric | null) => {
              if (value) {
                updateFilter("metric", value === "GOALS" ? null : value);
              }
            }}
            sx={{
              bgcolor: "rgba(255,255,255,0.12)",
              borderRadius: 2,
              "& .MuiToggleButton-root": {
                color: "#fff",
                borderColor: "rgba(255,255,255,0.22)",
                px: { xs: 2, sm: 3 },
                "&.Mui-selected": {
                  bgcolor: "#fff",
                  color: "primary.dark",
                  "&:hover": { bgcolor: "#edf7f0" },
                },
              },
            }}
          >
            <ToggleButton value="GOALS">
              <SportsSoccerOutlinedIcon sx={{ mr: 1 }} />
              Gols
            </ToggleButton>
            <ToggleButton value="ASSISTS">
              <EmojiEventsOutlinedIcon sx={{ mr: 1 }} />
              Assistências
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      <Accordion
        defaultExpanded={!isMobile}
        disableGutters
        sx={{
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "none",
          overflow: "hidden",
        }}
      >
        <AccordionSummary>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <FilterListOutlinedIcon color="primary" />
            <Typography variant="h3">Filtros</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "2fr repeat(4, minmax(120px, 1fr))",
              },
              gap: 1.5,
            }}
          >
            <TextField
              value={filters.search ?? ""}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Buscar por nome ou apelido"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Select
              value={filters.type ?? "ALL"}
              displayEmpty
              onChange={(event) =>
                updateFilter(
                  "type",
                  event.target.value === "MEMBER" ? null : event.target.value,
                )
              }
            >
              <MenuItem value="ALL">Todos tipos</MenuItem>
              <MenuItem value="MEMBER">Mensalistas</MenuItem>
              <MenuItem value="GUEST">Convidados</MenuItem>
            </Select>
            <Select
              value={filters.position ?? ""}
              displayEmpty
              onChange={(event) =>
                updateFilter("position", event.target.value || null)
              }
            >
              <MenuItem value="">Todas posições</MenuItem>
              <MenuItem value="OUTFIELD">Linha</MenuItem>
              <MenuItem value="GOALKEEPER">Goleiros</MenuItem>
            </Select>
            <Select
              value={filters.status}
              onChange={(event) =>
                updateFilter(
                  "status",
                  event.target.value === "ACTIVE" ? null : event.target.value,
                )
              }
            >
              <MenuItem value="ACTIVE">Ativos</MenuItem>
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="INACTIVE">Inativos</MenuItem>
            </Select>
            <TextField
              label="Limite"
              type="number"
              value={filters.limit ?? ""}
              onChange={(event) =>
                updateFilter(
                  "limit",
                  event.target.value
                    ? Math.min(100, Math.max(1, Number(event.target.value)))
                    : null,
                )
              }
              placeholder="Todos"
              helperText="Vazio exibe todos os jogadores retornados pela API."
              slotProps={{ htmlInput: { min: 1, max: 100 } }}
            />
          </Box>
          <FormControlLabel
            sx={{ mt: 1.5 }}
            control={
              <Switch
                checked={filters.includeZero}
                onChange={(event) =>
                  updateFilter("includeZero", event.target.checked)
                }
              />
            }
            label="Incluir jogadores zerados"
          />
        </AccordionDetails>
      </Accordion>

      {errorMessage ? (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshOutlinedIcon />}
              onClick={loadRankings}
            >
              Tentar novamente
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      ) : null}

      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{ justifyContent: "space-between", gap: 1 }}
        >
          <Box>
            <Typography variant="h2">
              Top {metricLabels[filters.metric].label}
            </Typography>
            <Typography color="text.secondary">
              {isLoading
                ? "Carregando ranking..."
                : `${rankingResponse?.total ?? 0} jogador${rankingResponse?.total === 1 ? "" : "es"} encontrados`}
            </Typography>
          </Box>
          <Chip
            label={`Metric: ${metricLabels[filters.metric].label}`}
            color="primary"
            sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
          />
        </Stack>

        {isLoading ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <PodiumSkeleton />
            <PodiumSkeleton />
            <PodiumSkeleton />
          </Box>
        ) : ranking.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}
          >
            <Stack spacing={1.5} sx={{ alignItems: "center" }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "#e3f1e8",
                  color: "primary.main",
                }}
              >
                <SportsSoccerOutlinedIcon fontSize="large" />
              </Avatar>
              <Typography variant="h2">Nenhum jogador encontrado</Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 520 }}>
                Ajuste os filtros ou inclua jogadores zerados para ampliar o
                ranking.
              </Typography>
            </Stack>
          </Paper>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              {podium.map((player, index) => (
                <PodiumCard
                  key={player.id}
                  player={player}
                  metric={filters.metric}
                  index={index}
                />
              ))}
            </Box>

            <Paper
              variant="outlined"
              sx={{ p: { xs: 1.25, sm: 2 }, bgcolor: "rgba(255,255,255,0.78)" }}
            >
              <Stack spacing={1.1}>
                <Typography variant="h3" sx={{ px: 0.5 }}>
                  Classificacao completa
                </Typography>
                {remainingPlayers.length === 0 ? (
                  <Typography color="text.secondary" sx={{ px: 0.5, pb: 1 }}>
                    O ranking atual tem apenas os jogadores do podio.
                  </Typography>
                ) : (
                  remainingPlayers.map((player) => (
                    <RankingRow
                      key={player.id}
                      player={player}
                      metric={filters.metric}
                    />
                  ))
                )}
              </Stack>
            </Paper>
          </>
        )}
      </Stack>
    </Stack>
  );
}
