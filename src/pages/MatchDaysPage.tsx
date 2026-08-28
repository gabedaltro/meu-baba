import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import MilitaryTechOutlinedIcon from "@mui/icons-material/MilitaryTechOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import ShuffleOutlinedIcon from "@mui/icons-material/ShuffleOutlined";
import SportsSoccerOutlinedIcon from "@mui/icons-material/SportsSoccerOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../features/auth/authContext";
import { formatMatchDayDate } from "../features/matchDays/format";
import {
  fetchMatchDays,
  type MatchDaySummary,
} from "../features/matchDays/matchDaysApi";

const MATCH_DAYS_PAGE_SIZE = 10;

function MatchDayRowSkeleton() {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Skeleton variant="circular" width={44} height={44} />
        <Stack sx={{ flex: 1 }} spacing={0.5}>
          <Skeleton width="55%" height={22} />
          <Skeleton width="35%" height={18} />
        </Stack>
      </Stack>
    </Paper>
  );
}

function MatchDayRow({ matchDay }: { matchDay: MatchDaySummary }) {
  return (
    <Paper
      component={RouterLink}
      to={`/rodadas/${matchDay.id}`}
      variant="outlined"
      sx={{
        display: "block",
        p: { xs: 1.5, sm: 2 },
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.15s, box-shadow 0.15s",
        "&:hover": {
          borderColor: "primary.main",
          boxShadow: "0 8px 24px rgba(16, 70, 43, 0.1)",
        },
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "center" }}
      >
        <Avatar
          sx={{
            bgcolor: matchDay.capaTeamId ? "#ffd54f" : "#e3f1e8",
            color: matchDay.capaTeamId ? "#6b4300" : "primary.main",
          }}
        >
          {matchDay.capaTeamId ? (
            <EmojiEventsOutlinedIcon />
          ) : (
            <CalendarMonthOutlinedIcon />
          )}
        </Avatar>
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800 }} noWrap>
            {formatMatchDayDate(matchDay.date)}
          </Typography>
          <Stack
            direction="row"
            spacing={0.75}
            useFlexGap
            sx={{ flexWrap: "wrap", mt: 0.5 }}
          >
            <Chip
              size="small"
              icon={
                matchDay.source === "DRAW" ? (
                  <ShuffleOutlinedIcon />
                ) : (
                  <GroupsOutlinedIcon />
                )
              }
              label={matchDay.source === "DRAW" ? "Do sorteio" : "Manual"}
              variant="outlined"
            />
            <Chip
              size="small"
              label={`${matchDay.teamCount} time${matchDay.teamCount === 1 ? "" : "s"}`}
              variant="outlined"
            />
            <Chip
              size="small"
              label={`${matchDay.confrontoCount} confronto${matchDay.confrontoCount === 1 ? "" : "s"}`}
              variant="outlined"
            />
            {matchDay.capaTeamId ? (
              <Chip
                size="small"
                icon={<MilitaryTechOutlinedIcon />}
                label="Capa definida"
                color="warning"
              />
            ) : (
              <Chip
                size="small"
                icon={<HourglassEmptyOutlinedIcon />}
                label="Capa em aberto"
                variant="outlined"
              />
            )}
          </Stack>
        </Stack>
        <ChevronRightOutlinedIcon color="disabled" />
      </Stack>
    </Paper>
  );
}

export function MatchDaysPage() {
  const { isAuthenticated } = useAuth();
  const [matchDays, setMatchDays] = useState<MatchDaySummary[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState("");

  const loadMatchDays = () => {
    setIsLoading(true);
    setErrorMessage("");

    fetchMatchDays({ offset: 0, limit: MATCH_DAYS_PAGE_SIZE })
      .then((response) => {
        setMatchDays(response.matchDays);
        setHasMore(response.hasMore);
      })
      .catch(() => {
        setMatchDays([]);
        setHasMore(false);
        setErrorMessage("Não foi possível carregar as rodadas agora.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;

    fetchMatchDays({ offset: 0, limit: MATCH_DAYS_PAGE_SIZE })
      .then((response) => {
        if (isMounted) {
          setMatchDays(response.matchDays);
          setHasMore(response.hasMore);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMatchDays([]);
          setHasMore(false);
          setErrorMessage("Não foi possível carregar as rodadas agora.");
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

  const loadMore = () => {
    setIsLoadingMore(true);
    setLoadMoreErrorMessage("");

    fetchMatchDays({ offset: matchDays.length, limit: MATCH_DAYS_PAGE_SIZE })
      .then((response) => {
        setMatchDays((current) => [...current, ...response.matchDays]);
        setHasMore(response.hasMore);
      })
      .catch(() => {
        setLoadMoreErrorMessage("Não foi possível carregar mais rodadas.");
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
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
            <MilitaryTechOutlinedIcon fontSize="large" />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h1"
              sx={{ color: "inherit", fontSize: { xs: "1.65rem", sm: "2rem" } }}
            >
              Times da semana
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>
              Histórico de rodadas, confrontos e o time capa de cada dia.
            </Typography>
          </Box>
          {isAuthenticated ? (
            <Button
              component={RouterLink}
              to="/rodadas/nova"
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              sx={{
                bgcolor: "#fff",
                color: "#155b39",
                "&:hover": { bgcolor: "#eef5f0" },
              }}
            >
              Nova rodada
            </Button>
          ) : null}
        </Stack>
      </Paper>

      {errorMessage ? (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshOutlinedIcon />}
              onClick={loadMatchDays}
            >
              Tentar novamente
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      ) : null}

      {isLoading ? (
        <Stack spacing={1}>
          <MatchDayRowSkeleton />
          <MatchDayRowSkeleton />
          <MatchDayRowSkeleton />
        </Stack>
      ) : matchDays.length === 0 ? (
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
            <Typography variant="h2">Nenhuma rodada cadastrada</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
              Assim que uma rodada for criada, manualmente ou a partir do
              sorteio, ela aparece aqui.
            </Typography>
          </Stack>
        </Paper>
      ) : (
        <>
          <Stack spacing={1}>
            {matchDays.map((matchDay) => (
              <MatchDayRow key={matchDay.id} matchDay={matchDay} />
            ))}
          </Stack>

          {hasMore ? (
            <Stack spacing={1} sx={{ alignItems: "center" }}>
              {loadMoreErrorMessage ? (
                <Alert severity="error" sx={{ width: "100%" }}>
                  {loadMoreErrorMessage}
                </Alert>
              ) : null}
              <Button
                variant="outlined"
                onClick={loadMore}
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
  );
}
