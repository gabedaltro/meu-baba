import ContentPasteOutlinedIcon from "@mui/icons-material/ContentPasteOutlined";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

export type ImportedGuest = {
  name: string;
};

type GuestParticipantsDialogProps = {
  open: boolean;
  onClose: () => void;
  onImport: (guests: ImportedGuest[]) => void;
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
  onImport,
}: GuestParticipantsDialogProps) {
  const [guestText, setGuestText] = useState("");
  const parsedGuests = useMemo(() => parseGuestLines(guestText), [guestText]);

  const closeDialog = () => {
    setGuestText("");
    onClose();
  };

  const importGuests = () => {
    onImport(parsedGuests);
    setGuestText("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
      <DialogTitle>Adicionar convidados</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="info">
            Informe um convidado por linha. Pode colar com ou sem numeracao.
          </Alert>
          <TextField
            label="Convidados"
            value={guestText}
            onChange={(event) => setGuestText(event.target.value)}
            placeholder={"Victor\nEverton\n3- Gustavo"}
            multiline
            minRows={8}
            fullWidth
            autoFocus
          />
          <Typography color="text.secondary">
            {parsedGuests.length} convidado
            {parsedGuests.length === 1 ? "" : "s"} identificado
            {parsedGuests.length === 1 ? "" : "s"}.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={closeDialog}>Cancelar</Button>
        <Button
          variant="contained"
          startIcon={<ContentPasteOutlinedIcon />}
          onClick={importGuests}
          disabled={parsedGuests.length === 0}
        >
          Adicionar {parsedGuests.length}
        </Button>
      </DialogActions>
    </Dialog>
  );
}