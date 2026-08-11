import ContentPasteOutlinedIcon from "@mui/icons-material/ContentPasteOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import type { DrawParticipant } from "../types";

export type ImportedGuest = {
  name: string;
};

type GuestParticipantsDialogProps = {
  open: boolean;
  onClose: () => void;
  participants: DrawParticipant[];
  availablePlayers: DrawParticipant[];
  onImport: (
    selectedPlayers: DrawParticipant[],
    typedGuests: ImportedGuest[],
  ) => void;
};

function cleanGuestName(value: string) {
  return value
    .replace(/^\d+\s*[-.)º°:]?\s*/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseGuestLines(value: string): ImportedGuest[] {
  const seenNames = new Set<string>();

  return value
    .split(/\r?\n/u)
    .map(cleanGuestName)
    .filter((name) => {
      if (!name) {
        return false;
      }

      const normalizedName = name.toLocaleLowerCase("pt-BR");

      if (seenNames.has(normalizedName)) {
        return false;
      }

      seenNames.add(normalizedName);
      return true;
    })
    .map((name) => ({ name }));
}

export function GuestParticipantsDialog({
  open,
  onClose,
  participants,
  availablePlayers,
  onImport,
}: GuestParticipantsDialogProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [guestText, setGuestText] = useState("");
  const parsedGuests = useMemo(() => parseGuestLines(guestText), [guestText]);

  const participantIds = useMemo(
    () => new Set(participants.map((participant) => String(participant.id))),
    [participants],
  );
  const selectableGuestPlayers = useMemo(
    () =>
      availablePlayers.filter(
        (player) =>
          player.type === "guest" && !participantIds.has(String(player.id)),
      ),
    [availablePlayers, participantIds],
  );
  const selectedPlayers = useMemo(
    () =>
      selectableGuestPlayers.filter((player) =>
        selectedPlayerIds.includes(String(player.id)),
      ),
    [selectableGuestPlayers, selectedPlayerIds],
  );

  const totalCount = selectedPlayers.length + parsedGuests.length;

  const resetState = () => {
    setSelectedPlayerIds([]);
    setGuestText("");
  };

  const closeDialog = () => {
    resetState();
    onClose();
  };

  const importGuests = () => {
    onImport(selectedPlayers, parsedGuests);
    resetState();
    onClose();
  };

  return (
    <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
      <DialogTitle>Adicionar convidados</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>
              Convidados ja cadastrados
            </Typography>
            <Select
              multiple
              value={selectedPlayerIds}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedPlayerIds(
                  typeof value === "string" ? value.split(",") : value,
                );
              }}
              displayEmpty
              disabled={selectableGuestPlayers.length === 0}
              fullWidth
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return selectableGuestPlayers.length === 0
                    ? "Nenhum convidado cadastrado disponivel"
                    : "Selecione convidados cadastrados";
                }

                return `${selected.length} convidado${
                  selected.length === 1 ? "" : "s"
                } selecionado${selected.length === 1 ? "" : "s"}`;
              }}
            >
              <MenuItem value="" disabled>
                {selectableGuestPlayers.length === 0
                  ? "Nenhum convidado cadastrado disponivel"
                  : "Selecione convidados cadastrados"}
              </MenuItem>
              {selectableGuestPlayers.map((player) => {
                const playerId = String(player.id);

                return (
                  <MenuItem key={player.id} value={playerId}>
                    <Checkbox checked={selectedPlayerIds.includes(playerId)} />
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center", minWidth: 0 }}
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
                          {player.nickname
                            ? `${player.name} (${player.nickname})`
                            : player.name}
                        </Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>
          </Stack>

          <Divider>ou</Divider>

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>
              Digitar convidados avulsos
            </Typography>
            <Alert severity="info">
              Informe um convidado por linha. Pode colar com ou sem numeracao.
            </Alert>
            <TextField
              label="Convidados"
              value={guestText}
              onChange={(event) => setGuestText(event.target.value)}
              placeholder={"Victor\nEverton\n3- Gustavo"}
              multiline
              minRows={6}
              fullWidth
            />
          </Stack>

          <Typography color="text.secondary">
            {totalCount} convidado{totalCount === 1 ? "" : "s"} selecionado
            {totalCount === 1 ? "" : "s"}.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={closeDialog}>Cancelar</Button>
        <Button
          variant="contained"
          startIcon={<ContentPasteOutlinedIcon />}
          onClick={importGuests}
          disabled={totalCount === 0}
        >
          Adicionar {totalCount}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
