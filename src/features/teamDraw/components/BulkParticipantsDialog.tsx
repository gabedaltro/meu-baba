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
import type { DrawParticipantType } from "../types";

export type ImportedParticipant = {
  name: string;
  type: DrawParticipantType;
};

type BulkParticipantsDialogProps = {
  open: boolean;
  onClose: () => void;
  onImport: (participants: ImportedParticipant[]) => void;
};

function cleanParticipantName(value: string) {
  return value
    .replace(/[✅☑✔✓]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function identifySection(line: string): DrawParticipantType | null {
  const normalizedLine = line
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("pt-BR");

  if (/\b(goleiro|goleiros)\b/u.test(normalizedLine)) {
    return "goalkeeper";
  }

  if (/\b(convidado|convidados)\b/u.test(normalizedLine)) {
    return "guest";
  }

  if (
    /\b(associado|associados|mensalista|mensalistas)\b/u.test(normalizedLine)
  ) {
    return "monthly_player";
  }

  return null;
}

function parseWhatsAppList(value: string): ImportedParticipant[] {
  const participants: ImportedParticipant[] = [];
  let currentType: DrawParticipantType = "monthly_player";
  let hasStartedFirstList = false;
  let hasExplicitSections = false;

  value.split(/\r?\n/u).forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      return;
    }

    const sectionType = identifySection(line);
    const numberedMatch = line.match(/^(\d+)\s*[-.)º°:]?\s*(.*)$/u);

    if (!numberedMatch) {
      if (sectionType) {
        currentType = sectionType;
        hasExplicitSections = true;
      }

      return;
    }

    const listNumber = numberedMatch ? Number(numberedMatch[1]) : null;
    const rawName = numberedMatch[2];

    if (listNumber === 1 && hasStartedFirstList && !hasExplicitSections) {
      currentType = "guest";
    }

    const name = cleanParticipantName(rawName);

    if (!name) {
      return;
    }

    participants.push({ name, type: currentType });
    hasStartedFirstList = true;
  });

  return participants;
}

export function BulkParticipantsDialog({
  open,
  onClose,
  onImport,
}: BulkParticipantsDialogProps) {
  const [listText, setListText] = useState("");
  const parsedParticipants = useMemo(
    () => parseWhatsAppList(listText),
    [listText],
  );
  const monthlyPlayerCount = parsedParticipants.filter(
    (participant) => participant.type === "monthly_player",
  ).length;
  const guestCount = parsedParticipants.filter(
    (participant) => participant.type === "guest",
  ).length;

  const importParticipants = () => {
    onImport(parsedParticipants);
    setListText("");
    onClose();
  };

  const closeDialog = () => {
    setListText("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="md">
      <DialogTitle>Colar lista do WhatsApp</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="info">
            O sistema identifica seções como Associados, Goleiros e Convidados.
            Quando não houver títulos, a primeira lista será considerada de
            mensalistas e a segunda, após reiniciar a numeração em 1, de
            convidados.
          </Alert>

          <TextField
            label="Lista de jogadores"
            value={listText}
            onChange={(event) => setListText(event.target.value)}
            placeholder={"1- Gabriel\n2- João\n\n1- Filipe\n2- Marco"}
            multiline
            minRows={12}
            fullWidth
            autoFocus
          />

          <Typography color="text.secondary">
            Identificados: {monthlyPlayerCount} mensalistas,{" "}
            {
              parsedParticipants.filter(
                (participant) => participant.type === "goalkeeper",
              ).length
            }{" "}
            goleiros e {guestCount} convidados.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={closeDialog}>Cancelar</Button>
        <Button
          variant="contained"
          startIcon={<ContentPasteOutlinedIcon />}
          onClick={importParticipants}
          disabled={parsedParticipants.length === 0}
        >
          Importar {parsedParticipants.length} jogadores
        </Button>
      </DialogActions>
    </Dialog>
  );
}
