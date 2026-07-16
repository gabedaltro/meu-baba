import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { DrawParticipant, DrawParticipantType } from "../types";

const participantTypeLabels: Record<
  DrawParticipantType,
  { label: string; color: "default" | "primary" | "secondary" }
> = {
  monthly_player: { label: "Mensalista", color: "default" },
  goalkeeper: { label: "Goleiro", color: "primary" },
  guest: { label: "Convidado", color: "secondary" },
};

type ParticipantsGridCardProps = {
  participants: DrawParticipant[];
  availablePlayers: DrawParticipant[];
  isLoadingPlayers: boolean;
  onAdd: (playerId: string) => boolean;
  onAddMonthlyPlayers: () => void;
  onOpenGuestImport: () => void;
  onToggleLateArrival: (participantId: string) => void;
  onRemove: (participantId: string) => void;
  onClear: () => void;
};

function getDisplayName(player: DrawParticipant) {
  return player.nickname ? `${player.name} (${player.nickname})` : player.name;
}

function getPlayerDetails(player: DrawParticipant) {
  const details = [participantTypeLabels[player.type].label];

  if (player.jerseyNumber) {
    details.push(`#${player.jerseyNumber}`);
  }

  if (player.nickname) {
    details.push(player.nickname);
  }

  return details.join(" · ");
}

export function ParticipantsGridCard({
  participants,
  availablePlayers,
  isLoadingPlayers,
  onAdd,
  onAddMonthlyPlayers,
  onOpenGuestImport,
  onToggleLateArrival,
  onRemove,
  onClear,
}: ParticipantsGridCardProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const selectedPlayer = availablePlayers.find(
    (player) => String(player.id) === selectedPlayerId,
  );
  const selectedPlayerType = selectedPlayer
    ? participantTypeLabels[selectedPlayer.type]
    : null;
  const participantIds = useMemo(
    () => new Set(participants.map((participant) => String(participant.id))),
    [participants],
  );
  const selectablePlayers = availablePlayers.filter(
    (player) => !participantIds.has(String(player.id)),
  );
  const selectableMonthlyPlayers = selectablePlayers.filter(
    (player) => player.type === "monthly_player",
  );

  const addParticipant = () => {
    if (onAdd(selectedPlayerId)) {
      setSelectedPlayerId("");
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: "hidden",
        bgcolor: "rgba(255,255,255,0.92)",
        boxShadow: "0 18px 50px rgba(17, 54, 35, 0.08)",
      }}
    >
      <Stack spacing={2.5} sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
          }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h2">Quem vai jogar?</Typography>
            <Typography color="text.secondary">
              {participants.length} na lista
            </Typography>
          </Stack>
          <Button
            color="error"
            variant="text"
            onClick={onClear}
            disabled={participants.length === 0}
          >
            Limpar lista
          </Button>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <Select
            value={selectedPlayerId}
            onChange={(event) => setSelectedPlayerId(event.target.value)}
            displayEmpty
            disabled={isLoadingPlayers || selectablePlayers.length === 0}
            sx={{ flex: 1 }}
          >
            <MenuItem value="" disabled>
              {isLoadingPlayers
                ? "Carregando jogadores..."
                : selectablePlayers.length === 0
                  ? "Nenhum jogador cadastrado disponivel"
                  : "Selecione um jogador cadastrado"}
            </MenuItem>
            {selectablePlayers.map((player) => {
              return (
                <MenuItem key={player.id} value={String(player.id)}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center" }}
                  >
                    <Avatar
                      src={player.photoUrl}
                      alt={player.name}
                      sx={{ width: 28, height: 28, fontSize: 12 }}
                    >
                      {player.name.charAt(0).toLocaleUpperCase("pt-BR")}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" noWrap>
                        {getDisplayName(player)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getPlayerDetails(player)}
                      </Typography>
                    </Box>
                  </Stack>
                </MenuItem>
              );
            })}
          </Select>
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={addParticipant}
            disabled={!selectedPlayerId}
            sx={{ minWidth: { xs: "100%", md: 130 } }}
          >
            Adicionar
          </Button>
          <Button
            variant="outlined"
            startIcon={<GroupAddOutlinedIcon />}
            onClick={onAddMonthlyPlayers}
            disabled={isLoadingPlayers || selectableMonthlyPlayers.length === 0}
            sx={{ minWidth: { xs: "100%", md: 190 } }}
          >
            Adicionar mensalistas
          </Button>
          <Button
            variant="outlined"
            startIcon={<PersonAddAltOutlinedIcon />}
            onClick={onOpenGuestImport}
            sx={{ minWidth: { xs: "100%", md: 150 } }}
          >
            Convidados
          </Button>
        </Stack>

        {selectedPlayer && selectedPlayerType ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Avatar
              src={selectedPlayer.photoUrl}
              alt={selectedPlayer.name}
              sx={{ width: 34, height: 34 }}
            >
              {selectedPlayer.name.charAt(0).toLocaleUpperCase("pt-BR")}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {getDisplayName(selectedPlayer)}
            </Typography>
            <Chip
              label={selectedPlayerType.label}
              color={selectedPlayerType.color}
              size="small"
            />
            {selectedPlayer.jerseyNumber ? (
              <Chip label={`#${selectedPlayer.jerseyNumber}`} size="small" />
            ) : null}
          </Stack>
        ) : null}

        {participants.length === 0 ? (
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
            <Typography sx={{ fontWeight: 700 }}>
              Nenhum jogador informado
            </Typography>
            <Typography color="text.secondary" sx={{ textAlign: "center" }}>
              Selecione jogadores cadastrados ou adicione convidados para liberar
              o sorteio.
            </Typography>
          </Stack>
        ) : (
          <Stack
            sx={{
              maxHeight: { xs: 350, md: 480 },
              overflowY: "auto",
              pr: { xs: 0.5, md: 0 },
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  xl: "repeat(3, minmax(0, 1fr))",
                },
                gap: 1,
              }}
            >
              {participants.map((participant) => {
                const participantType = participantTypeLabels[participant.type];

                return (
                  <motion.div
                    key={participant.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        alignItems: "center",
                        border: "1px solid rgba(31, 122, 77, 0.14)",
                        borderRadius: 2,
                        px: 1,
                        py: 0.75,
                        bgcolor: "#f7faf8",
                        minHeight: 58,
                      }}
                    >
                      <Avatar
                        src={participant.photoUrl}
                        alt={participant.name}
                        sx={{
                          width: 34,
                          height: 34,
                          fontSize: 14,
                          fontWeight: 800,
                          bgcolor:
                            participant.type === "goalkeeper"
                              ? "primary.main"
                              : "#dfece4",
                          color:
                            participant.type === "goalkeeper"
                              ? "primary.contrastText"
                              : "primary.dark",
                        }}
                      >
                        {participant.name.charAt(0).toLocaleUpperCase("pt-BR")}
                      </Avatar>
                      <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700 }}
                          noWrap
                        >
                          {getDisplayName(participant)}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          useFlexGap
                          sx={{ flexWrap: "wrap" }}
                        >
                          <Chip
                            label={participantType.label}
                            color={participantType.color}
                            size="small"
                            sx={{ height: 19, fontSize: 10 }}
                          />
                          {participant.jerseyNumber ? (
                            <Chip
                              label={`#${participant.jerseyNumber}`}
                              size="small"
                              sx={{ height: 19, fontSize: 10 }}
                            />
                          ) : null}
                          {participant.isLateArrival ? (
                            <Chip
                              label="Atrasado"
                              color="warning"
                              size="small"
                              sx={{ height: 19, fontSize: 10 }}
                            />
                          ) : null}
                        </Stack>
                      </Stack>
                      <Tooltip
                        title={
                          participant.isLateArrival
                            ? "Remover chegada atrasada"
                            : "Marcar chegada atrasada"
                        }
                      >
                        <IconButton
                          color={participant.isLateArrival ? "warning" : "default"}
                          aria-label={`${
                            participant.isLateArrival
                              ? "Remover chegada atrasada de"
                              : "Marcar chegada atrasada para"
                          } ${participant.name}`}
                          onClick={() => onToggleLateArrival(participant.id)}
                        >
                          <ScheduleOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remover jogador">
                        <IconButton
                          color="error"
                          aria-label={`Remover ${participant.name}`}
                          onClick={() => onRemove(participant.id)}
                        >
                          <DeleteOutlineOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </motion.div>
                );
              })}
            </Box>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}