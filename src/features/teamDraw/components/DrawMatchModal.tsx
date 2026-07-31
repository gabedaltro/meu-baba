import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SportsSoccerOutlinedIcon from "@mui/icons-material/SportsSoccerOutlined";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type { DrawParticipant, DrawTeam } from "../types";

type DrawMatchModalProps = {
  open: boolean;
  teams: DrawTeam[];
  onClose: () => void;
  onCopy: () => void;
};

type FieldPlayerMarkerProps = {
  player: DrawParticipant;
  side: "left" | "right";
  x: number;
  y: number;
};

const leftFormation = [
  { x: 24, y: 34 },
  { x: 24, y: 66 },
  { x: 36, y: 28 },
  { x: 36, y: 72 },
  { x: 47, y: 38 },
  { x: 47, y: 62 },
];

const rightFormation = leftFormation.map((position) => ({
  x: 100 - position.x,
  y: position.y,
}));

function getPlayerLabel(player: DrawParticipant) {
  return player.nickname ? player.nickname : player.name;
}

function getPlayerNumber(player: DrawParticipant, index: number) {
  return player.jerseyNumber ? `#${player.jerseyNumber}` : String(index + 1);
}

function splitTeamPlayers(team?: DrawTeam) {
  const players = team?.players ?? [];

  return {
    goalkeeper: players.find((player) => player.type === "goalkeeper"),
    fieldPlayers: players.filter((player) => player.type !== "goalkeeper"),
  };
}

function FieldPlayerMarker({ player, side, x, y }: FieldPlayerMarkerProps) {
  return (
    <Stack
      spacing={0.5}
      sx={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        alignItems: "center",
        transform: "translate(-50%, -50%)",
        width: { xs: 54, sm: 92 },
      }}
    >
      <Avatar
        src={player.photoUrl}
        alt={player.name}
        sx={{
          width: { xs: 26, sm: 42 },
          height: { xs: 26, sm: 42 },
          border: "2px solid #fff",
          bgcolor: side === "left" ? "#dff5e8" : "#e9f2ff",
          color: side === "left" ? "#0f5f38" : "#164f83",
          fontSize: { xs: 11, sm: 14 },
          fontWeight: 900,
          boxShadow: "0 8px 18px rgba(0,0,0,0.24)",
        }}
      >
        {player.name.charAt(0).toLocaleUpperCase("pt-BR")}
      </Avatar>
      <Typography
        variant="caption"
        title={player.name}
        sx={{
          maxWidth: "100%",
          color: "#fff",
          fontWeight: 900,
          lineHeight: { xs: 0.95, sm: 1.05 },
          textAlign: "center",
          textShadow: "0 1px 4px rgba(0,0,0,0.72)",
          fontSize: { xs: 9.5, sm: 12 },
        }}
        noWrap
      >
        {getPlayerLabel(player)}
      </Typography>
    </Stack>
  );
}

function GoalkeeperMarker({
  player,
  side,
}: {
  player?: DrawParticipant;
  side: "left" | "right";
}) {
  const x = side === "left" ? 7 : 93;

  return (
    <Stack
      spacing={0.5}
      sx={{
        position: "absolute",
        left: `${x}%`,
        top: "50%",
        alignItems: "center",
        transform: "translate(-50%, -50%)",
        width: { xs: 56, sm: 92 },
      }}
    >
      <Avatar
        src={player?.photoUrl}
        alt={player?.name ?? "Goleiro"}
        sx={{
          width: { xs: 30, sm: 50 },
          height: { xs: 30, sm: 50 },
          border: "3px solid #fff",
          bgcolor: "#ffe9a8",
          color: "#6b4300",
          fontSize: { xs: 12, sm: 15 },
          fontWeight: 900,
          boxShadow: "0 10px 22px rgba(0,0,0,0.28)",
        }}
      >
        {player?.name.charAt(0).toLocaleUpperCase("pt-BR") ?? "G"}
      </Avatar>
      <Chip
        label={player ? getPlayerLabel(player) : "Sem goleiro"}
        size="small"
        sx={{
          maxWidth: "100%",
          bgcolor: "rgba(255,255,255,0.9)",
          color: "#173d25",
          fontWeight: 800,
          "& .MuiChip-label": { px: { xs: 0.5, sm: 0.75 }, fontSize: { xs: 9.5, sm: 12 } },
        }}
      />
    </Stack>
  );
}

function MatchField({ teamOne, teamTwo }: { teamOne?: DrawTeam; teamTwo?: DrawTeam }) {
  const firstTeam = splitTeamPlayers(teamOne);
  const secondTeam = splitTeamPlayers(teamTwo);

  return (
    <Box
      sx={{
        position: "relative",
        height: { xs: "min(58vh, 350px)", sm: 520 },
        minHeight: { xs: 315, sm: 520 },
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "#14733f",
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0.04) 50%, transparent 50%), linear-gradient(0deg, rgba(255,255,255,0.05) 50%, transparent 50%)",
        backgroundSize: { xs: "56px 56px, 100% 52px", sm: "80px 80px, 100% 70px" },
        border: { xs: "2px solid rgba(255,255,255,0.85)", sm: "3px solid rgba(255,255,255,0.85)" },
        boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.08), 0 24px 70px rgba(5,39,22,0.22)",
      }}
    >
      <Box sx={{ position: "absolute", inset: { xs: 10, sm: 18 }, border: "2px solid rgba(255,255,255,0.88)" }} />
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: 18,
          bottom: 18,
          borderLeft: "2px solid rgba(255,255,255,0.88)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: { xs: 72, sm: 130 },
          height: { xs: 72, sm: 130 },
          border: "2px solid rgba(255,255,255,0.88)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          left: 18,
          top: "30%",
          width: "13%",
          height: "40%",
          border: "2px solid rgba(255,255,255,0.88)",
          borderLeft: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          right: 18,
          top: "30%",
          width: "13%",
          height: "40%",
          border: "2px solid rgba(255,255,255,0.88)",
          borderRight: 0,
        }}
      />

      <Stack
        direction="row"
        sx={{
          position: "absolute",
          left: 18,
          right: 18,
          top: 14,
          justifyContent: "space-between",
          pointerEvents: "none",
        }}
      >
        <Chip label={teamOne?.name ?? "Time 1"} sx={{ bgcolor: "#fff", fontWeight: 900 }} />
        <Chip label={teamTwo?.name ?? "Time 2"} sx={{ bgcolor: "#fff", fontWeight: 900 }} />
      </Stack>

      <GoalkeeperMarker player={firstTeam.goalkeeper} side="left" />
      <GoalkeeperMarker player={secondTeam.goalkeeper} side="right" />

      {firstTeam.fieldPlayers.slice(0, 6).map((player, index) => (
        <FieldPlayerMarker
          key={player.id}
          player={player}
          side="left"
          x={leftFormation[index].x}
          y={leftFormation[index].y}
        />
      ))}
      {secondTeam.fieldPlayers.slice(0, 6).map((player, index) => (
        <FieldPlayerMarker
          key={player.id}
          player={player}
          side="right"
          x={rightFormation[index].x}
          y={rightFormation[index].y}
        />
      ))}
    </Box>
  );
}

function AllTeamsList({ teams }: { teams: DrawTeam[] }) {
  if (teams.length === 0) {
    return (
      <Stack
        spacing={1}
        sx={{
          alignItems: "center",
          justifyContent: "center",
          minHeight: 280,
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "#f7faf8",
        }}
      >
        <GroupsOutlinedIcon color="primary" />
        <Typography sx={{ fontWeight: 800 }}>Nenhum time gerado</Typography>
        <Typography color="text.secondary" sx={{ textAlign: "center" }}>
          Quando o sorteio for gerado, todos os times aparecem aqui.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {teams.map((team, teamIndex) => (
        <Box
          key={team.id}
          sx={{
            overflow: "hidden",
            borderRadius: 2,
            border: "1px solid rgba(21,91,57,0.16)",
            bgcolor: "#ffffff",
            boxShadow: "0 12px 34px rgba(10,43,27,0.08)",
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              px: 2,
              py: 1.5,
              bgcolor: ["#155b39", "#1b6b91", "#945f15", "#68448a"][teamIndex % 4],
              color: "#fff",
            }}
          >
            <SportsSoccerOutlinedIcon />
            <Typography variant="h3" sx={{ color: "inherit", flex: 1 }}>
              {team.name}
            </Typography>
            <Chip
              label={`${team.players.length} jogadores`}
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "#fff" }}
            />
          </Stack>
          <Stack divider={<Divider flexItem />}>
            {team.players.map((player, index) => (
              <Stack
                key={player.id}
                direction="row"
                spacing={1.25}
                sx={{ alignItems: "center", px: 2, py: 1.1 }}
              >
                <Avatar
                  src={player.photoUrl}
                  alt={player.name}
                  sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 900 }}
                >
                  {player.name.charAt(0).toLocaleUpperCase("pt-BR")}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800 }} noWrap>
                    {player.nickname ? `${player.name} (${player.nickname})` : player.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {player.type === "goalkeeper" ? "Goleiro" : "Linha"}
                    {player.isLateArrival ? " · Atrasado" : ""}
                  </Typography>
                </Box>
                <Chip
                  label={getPlayerNumber(player, index)}
                  color={player.type === "goalkeeper" ? "primary" : "default"}
                  variant={player.jerseyNumber ? "filled" : "outlined"}
                  sx={{ fontWeight: 900 }}
                />
              </Stack>
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

export function DrawMatchModal({ open, teams, onClose, onCopy }: DrawMatchModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const didCopyOnOpenRef = useRef(false);
  const teamOne = teams[0];
  const teamTwo = teams[1];

  const closeModal = () => {
    setActiveTab(0);
    onClose();
  };

  useEffect(() => {
    if (!open) {
      didCopyOnOpenRef.current = false;
      return;
    }

    if (!didCopyOnOpenRef.current) {
      didCopyOnOpenRef.current = true;
      onCopy();
    }
  }, [onCopy, open]);

  return (
    <Dialog
      open={open}
      onClose={closeModal}
      fullWidth
      maxWidth="lg"
      slotProps={{
        paper: {
          sx: {
            m: { xs: 1, sm: 4 },
            width: { xs: "calc(100% - 16px)", sm: "calc(100% - 64px)" },
            maxHeight: { xs: "calc(100dvh - 16px)", sm: "calc(100% - 64px)" },
          },
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: "center",
            px: { xs: 2, sm: 3 },
            py: 2,
            bgcolor: "#123d2a",
            color: "#fff",
          }}
        >
          <Avatar sx={{ bgcolor: "#fff", color: "primary.main", width: { xs: 34, sm: 40 }, height: { xs: 34, sm: 40 } }}>
            <SportsSoccerOutlinedIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h2" sx={{ color: "inherit", fontSize: { xs: "1.1rem", sm: "1.5rem" } }}>
              {teamOne?.name ?? "Time 1"} x {teamTwo?.name ?? "Time 2"}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)", fontSize: { xs: 11, sm: 14 }, lineHeight: 1.25 }}>
              Times copiados automaticamente para a area de transferencia.
            </Typography>
          </Box>
          <IconButton size="small" onClick={closeModal} aria-label="Fechar confronto" sx={{ color: "#fff" }}>
            <CloseOutlinedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <Box sx={{ borderBottom: 1, borderColor: "divider", px: { xs: 0.5, sm: 3 } }}>
        <Tabs value={activeTab} onChange={(_, value: number) => setActiveTab(value)} variant="fullWidth" sx={{ minHeight: { xs: 38, sm: 48 }, "& .MuiTab-root": { minHeight: { xs: 38, sm: 48 }, py: { xs: 0.5, sm: 1.5 }, fontSize: { xs: 12, sm: 14 } } }}>
          <Tab label="Confronto" />
          <Tab label="Todos os times" />
        </Tabs>
      </Box>
      <DialogContent sx={{ bgcolor: "#f3f7f4", p: { xs: 1, sm: 3 }, overflowX: "hidden" }}>
        {activeTab === 0 ? (
          <Stack spacing={{ xs: 1, sm: 2 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: "space-between" }}
            >
              <Chip label="Formacao 2-2-2" color="success" size="small" sx={{ fontWeight: 900, flex: 1, maxWidth: { xs: 180, sm: "none" } }} />
              <Chip
                icon={<ContentCopyOutlinedIcon />}
                label="Copiado ao abrir"
                variant="outlined"
                sx={{ bgcolor: "#fff" }}
              />
            </Stack>
            <MatchField teamOne={teamOne} teamTwo={teamTwo} />
          </Stack>
        ) : (
          <AllTeamsList teams={teams} />
        )}
      </DialogContent>
      <DialogActions sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 1, sm: 2 }, gap: 1, "& .MuiButton-root": { minHeight: { xs: 36, sm: 40 } } }}>
        <Button startIcon={<ContentCopyOutlinedIcon />} onClick={onCopy}>
          Copiar novamente
        </Button>
        <Button variant="contained" onClick={closeModal}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}