import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import MilitaryTechOutlinedIcon from "@mui/icons-material/MilitaryTechOutlined";
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
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
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
  type RankingStatus,
} from "../features/rankings/rankingsApi";
import type { PlayerType } from "../features/players/playersApi";

const RANKING_PAGE_SIZE = 10;

const metricLabels: Record<RankingMetric, { label: string; short: string }> = {
  GOALS: { label: "Gols", short: "Gols" },
  ASSISTS: { label: "Assistências", short: "Assist." },
  CAPAS: { label: "Capas", short: "Capas" },
};

const podiumStyles = [
  { label: "Ouro", color: "#d99f16", bg: "#fff7df" },
  { label: "Prata", color: "#7a8794", bg: "#f2f5f8" },
  { label: "Bronze", color: "#a7652a", bg: "#fff0e5" },
];

function getMetricFromParams(value: string | null): RankingMetric {
  if (value === "ASSISTS" || value === "CAPAS") {
    return value;
  }

  return "GOALS";
}

function getStatusFromParams(value: string | null): RankingStatus {
  return value === "INACTIVE" || value === "ALL" ? value : "ACTIVE";
}

function getTypeFromParams(value: string | null): PlayerType | null {
  if (value === "ALL") {
    return null;
  }

  return value === "GUEST" ? "GUEST" : "MEMBER";
}

function getDateFromParams(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
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
  if (metric === "GOALS") {
    return player.goals;
  }

  if (metric === "ASSISTS") {
    return player.assists;
  }

  return player.capas;
}

function getMetricSuffix(metric: RankingMetric, value: number) {
  if (metric === "GOALS") {
    return value === 1 ? "gol" : "gols";
  }

  if (metric === "ASSISTS") {
    return value === 1 ? "assist" : "assists";
  }

  return value === 1 ? "capa" : "capas";
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
                : "Sem número"}
            </Typography>
          </Box>
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ justifyContent: "center", flexWrap: "wrap" }}
        >
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
          <Chip
            label={`${player.capas} C`}
            variant={metric === "CAPAS" ? "filled" : "outlined"}
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
  const breakdown = [
    { key: "GOALS" as const, label: "Gols", count: player.goals },
    { key: "ASSISTS" as const, label: "Assist.", count: player.assists },
    { key: "CAPAS" as const, label: "Capas", count: player.capas },
  ];

  return (
    <Stack
      component={motion.article}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      spacing={1}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "rgba(255,255,255,0.9)",
        borderRadius: 2,
        p: { xs: 1, sm: 1.25 },
      }}
    >
      <Stack
        direction="row"
        spacing={1.25}
        sx={{ alignItems: "center", minWidth: 0 }}
      >
        <Avatar
          sx={{
            bgcolor: "primary.main",
            color: "#fff",
            fontWeight: 900,
            flexShrink: 0,
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 },
            fontSize: { xs: "0.9rem", sm: "1rem" },
          }}
        >
          {player.rank}
        </Avatar>
        <Avatar
          src={player.photoUrl ?? undefined}
          alt={player.name}
          sx={{
            flexShrink: 0,
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 },
          }}
        >
          {player.name.charAt(0).toLocaleUpperCase("pt-BR")}
        </Avatar>
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900 }} noWrap>
            {getPlayerDisplayName(player)}
          </Typography>
          <Stack
            direction="row"
            spacing={0.5}
            useFlexGap
            sx={{ flexWrap: "wrap", mt: 0.25 }}
          >
            <Chip
              label={getPlayerTypeLabel(player)}
              size="small"
              sx={{ height: 20 }}
            />
            {player.jerseyNumber ? (
              <Chip
                label={`#${player.jerseyNumber}`}
                size="small"
                variant="outlined"
                sx={{ height: 20 }}
              />
            ) : null}
            {!player.isActive ? (
              <Chip
                label="Inativo"
                size="small"
                color="error"
                variant="outlined"
                sx={{ height: 20 }}
              />
            ) : null}
          </Stack>
        </Stack>
        <Stack
          sx={{
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            minWidth: { xs: 52, sm: 64 },
            px: 1,
            py: 0.5,
            borderRadius: 2,
            bgcolor: "primary.main",
            color: "#fff",
          }}
        >
          <Typography
            sx={{ fontWeight: 900, lineHeight: 1, fontSize: { xs: "1.15rem", sm: "1.35rem" } }}
          >
            {value}
          </Typography>
          <Typography
            sx={{ fontWeight: 700, fontSize: "0.6rem", textTransform: "uppercase", opacity: 0.85 }}
          >
            {metricLabels[metric].short}
          </Typography>
        </Stack>
      </Stack>

      <Stack
        direction="row"
        spacing={0.75}
        useFlexGap
        sx={{ flexWrap: "wrap", pl: { sm: "52px" } }}
      >
        {breakdown.map((item) => (
          <Chip
            key={item.key}
            size="small"
            label={`${item.count} ${item.label}`}
            color={metric === item.key ? "primary" : "default"}
            variant={metric === item.key ? "filled" : "outlined"}
            sx={{ fontWeight: metric === item.key ? 800 : 500 }}
          />
        ))}
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
  const [entries, setEntries] = useState<RankingPlayer[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState("");

  const metric = getMetricFromParams(searchParams.get("metric"));
  const isCapasMetric = metric === "CAPAS";

  const filters = useMemo<RankingFilters>(
    () => ({
      metric,
      status: getStatusFromParams(searchParams.get("status")),
      type: isCapasMetric ? null : getTypeFromParams(searchParams.get("type")),
      excludeGuests: isCapasMetric,
      search: searchParams.get("search")?.trim() || null,
      startDate: getDateFromParams(searchParams.get("startDate")),
      endDate: getDateFromParams(searchParams.get("endDate")),
    }),
    [searchParams, metric, isCapasMetric],
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
    setIsLoading(true);
    setErrorMessage("");
    setLoadMoreErrorMessage("");

    fetchPlayerRankings({ ...filters, offset: 0, limit: RANKING_PAGE_SIZE })
      .then((response) => {
        setEntries(response.ranking);
        setHasMore(response.hasMore);
      })
      .catch(() => {
        setEntries([]);
        setHasMore(false);
        setErrorMessage("Não foi possível carregar o ranking agora.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;

    fetchPlayerRankings({ ...filters, offset: 0, limit: RANKING_PAGE_SIZE })
      .then((response) => {
        if (isMounted) {
          setEntries(response.ranking);
          setHasMore(response.hasMore);
        }
      })
      .catch(() => {
        if (isMounted) {
          setEntries([]);
          setHasMore(false);
          setErrorMessage("Não foi possível carregar o ranking agora.");
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

  const loadMoreRankings = () => {
    setIsLoadingMore(true);
    setLoadMoreErrorMessage("");

    fetchPlayerRankings({
      ...filters,
      offset: entries.length,
      limit: RANKING_PAGE_SIZE,
    })
      .then((response) => {
        setEntries((current) => [...current, ...response.ranking]);
        setHasMore(response.hasMore);
      })
      .catch(() => {
        setLoadMoreErrorMessage("Não foi possível carregar mais jogadores.");
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  };

  const podium = entries.slice(0, 3);
  const remainingPlayers = entries.slice(3);

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
          </Box>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={filters.metric}
            onChange={(_, value: RankingMetric | null) => {
              if (value) {
                updateFilter("metric", value === "GOALS" ? null : value);
              }
            }}
            sx={{
              bgcolor: "rgba(255,255,255,0.12)",
              borderRadius: 2,
              width: { xs: "100%", md: "auto" },
              flexShrink: 0,
              "& .MuiToggleButton-root": {
                color: "#fff",
                borderColor: "rgba(255,255,255,0.22)",
                px: { xs: 1, sm: 3 },
                py: { xs: 0.75, sm: 1 },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                whiteSpace: "nowrap",
                "&.Mui-selected": {
                  bgcolor: "#fff",
                  color: "primary.dark",
                  "&:hover": { bgcolor: "#edf7f0" },
                },
              },
            }}
          >
            <ToggleButton value="GOALS">
              <SportsSoccerOutlinedIcon
                fontSize="small"
                sx={{ mr: { xs: 0.5, sm: 1 } }}
              />
              Gols
            </ToggleButton>
            <ToggleButton value="ASSISTS">
              <EmojiEventsOutlinedIcon
                fontSize="small"
                sx={{ mr: { xs: 0.5, sm: 1 }, display: { xs: "none", sm: "block" } }}
              />
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Assistências
              </Box>
              <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                Assist.
              </Box>
            </ToggleButton>
            <ToggleButton value="CAPAS">
              <MilitaryTechOutlinedIcon
                fontSize="small"
                sx={{ mr: { xs: 0.5, sm: 1 } }}
              />
              Capas
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
                sm: "repeat(2, minmax(120px, 1fr))",
                md: `2fr repeat(${isCapasMetric ? 3 : 4}, minmax(120px, 1fr))`,
              },
              gap: 1.5,
            }}
          >
            <TextField
              value={filters.search ?? ""}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Buscar por nome ou apelido"
              sx={{ gridColumn: { xs: "1", sm: "1 / -1", md: "auto" } }}
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
            {isCapasMetric ? null : (
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
            )}
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
              label="De"
              type="date"
              value={filters.startDate ?? ""}
              onChange={(event) => updateFilter("startDate", event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Até"
              type="date"
              value={filters.endDate ?? ""}
              onChange={(event) => updateFilter("endDate", event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
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
        ) : entries.length === 0 ? (
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
                Ajuste os filtros para ampliar o ranking.
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
                  Classificação completa
                </Typography>
                {remainingPlayers.length === 0 ? (
                  <Typography color="text.secondary" sx={{ px: 0.5, pb: 1 }}>
                    O ranking atual tem apenas os jogadores do pódio.
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

            {hasMore ? (
              <Stack spacing={1} sx={{ alignItems: "center" }}>
                {loadMoreErrorMessage ? (
                  <Alert severity="error" sx={{ width: "100%" }}>
                    {loadMoreErrorMessage}
                  </Alert>
                ) : null}
                <Button
                  variant="outlined"
                  onClick={loadMoreRankings}
                  disabled={isLoadingMore}
                  startIcon={
                    isLoadingMore ? (
                      <CircularProgress size={18} />
                    ) : (
                      <EmojiEventsOutlinedIcon />
                    )
                  }
                >
                  {isLoadingMore ? "Carregando..." : "Ver mais"}
                </Button>
              </Stack>
            ) : null}
          </>
        )}
      </Stack>
    </Stack>
  );
}
