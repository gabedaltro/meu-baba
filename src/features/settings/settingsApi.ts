import { apiClient } from "../../services/apiClient";

export type PlayerGroupSetting = {
  playerIds: string[];
};

export type Settings = {
  maxGuestsPerTeam: number;
  outfieldPlayersPerTeam: number;
  playerGroups: PlayerGroupSetting[];
};

export type SettingsPayload = Settings;

export async function fetchSettings() {
  const response = await apiClient.get<Settings>("/settings");

  return response.data;
}

export async function saveSettings(payload: SettingsPayload) {
  const response = await apiClient.put<Settings>("/settings", payload);

  return response.data;
}
