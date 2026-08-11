import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import {
  Avatar,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import type { DrawParticipant } from "../types";

type GoalkeeperParticipantsDialogProps = {
  open: boolean;
  onClose: () => void;
  participants: DrawParticipant[];
  availablePlayers: DrawParticipant[];
  onImport: (selectedPlayers: DrawParticipant[]) => void;
};

export function GoalkeeperParticipantsDialog({
  open,
  onClose,
  participants,
  availablePlayers,
  onImport,
}: GoalkeeperParticipantsDialogProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const participantIds = useMemo(
    () => new Set(participants.map((participant) => String(participant.id))),
    [participants],
  );
  const selectableGoalkeepers = useMemo(
    () =>
      availablePlayers.filter(
        (player) =>
          player.type === "goalkeeper" &&
          !participantIds.has(String(player.id)),
      ),
    [availablePlayers, participantIds],
  );

  const allSelected =
    selectableGoalkeepers.length > 0 &&
    selectedPlayerIds.length === selectableGoalkeepers.length;

  const togglePlayer = (playerId: string) => {
    setSelectedPlayerIds((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId],
    );
  };

  const toggleSelectAll = () => {
    setSelectedPlayerIds(
      allSelected ? [] : selectableGoalkeepers.map((player) => String(player.id)),
    );
  };

  const closeDialog = () => {
    setSelectedPlayerIds([]);
    onClose();
  };

  const importGoalkeepers = () => {
    const selectedPlayers = selectableGoalkeepers.filter((player) =>
      selectedPlayerIds.includes(String(player.id)),
    );

    onImport(selectedPlayers);
    setSelectedPlayerIds([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
      <DialogTitle>Adicionar goleiros</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 1 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Typography color="text.secondary">
              Selecione quem vai para a lista do sorteio.
            </Typography>
            <Button
              size="small"
              onClick={toggleSelectAll}
              disabled={selectableGoalkeepers.length === 0}
            >
              {allSelected ? "Limpar selecao" : "Selecionar todos"}
            </Button>
          </Stack>

          {selectableGoalkeepers.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
              Nenhum goleiro cadastrado disponivel.
            </Typography>
          ) : (
            <List sx={{ maxHeight: 360, overflowY: "auto", py: 0 }}>
              {selectableGoalkeepers.map((player) => {
                const playerId = String(player.id);
                const isChecked = selectedPlayerIds.includes(playerId);

                return (
                  <ListItemButton
                    key={playerId}
                    onClick={() => togglePlayer(playerId)}
                    dense
                    sx={{ borderRadius: 1.5 }}
                  >
                    <Checkbox
                      edge="start"
                      checked={isChecked}
                      tabIndex={-1}
                      disableRipple
                    />
                    <ListItemAvatar>
                      <Avatar
                        src={player.photoUrl}
                        alt={player.name}
                        sx={{ bgcolor: "primary.main" }}
                      >
                        {player.name.charAt(0).toLocaleUpperCase("pt-BR")}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        player.nickname
                          ? `${player.name} (${player.nickname})`
                          : player.name
                      }
                      secondary={
                        player.jerseyNumber ? `#${player.jerseyNumber}` : undefined
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}

          <Typography color="text.secondary">
            {selectedPlayerIds.length} goleiro
            {selectedPlayerIds.length === 1 ? "" : "s"} selecionado
            {selectedPlayerIds.length === 1 ? "" : "s"}.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={closeDialog}>Cancelar</Button>
        <Button
          variant="contained"
          startIcon={<ShieldOutlinedIcon />}
          onClick={importGoalkeepers}
          disabled={selectedPlayerIds.length === 0}
        >
          Adicionar {selectedPlayerIds.length}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
