import { WalletUpdatePayload } from "./types";

export const Types = {
  WALLET_UPDATE: "WALLET_UPDATE",
  WALLET_LOGOUT: "WALLET_LOGOUT",
};

export function update(payload: WalletUpdatePayload) {
  return {
    type: Types.WALLET_UPDATE,
    payload
  }
};

export function logout() {
  return {
    type: Types.WALLET_LOGOUT,
  }
};