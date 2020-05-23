import { Contract } from '@zilliqa-js/contract';
import { Zilliqa } from "@zilliqa-js/zilliqa";
import { ConnectedWallet, WalletConnectType } from "core/wallet/ConnectedWallet";
import { Zilswap } from "zilswap-sdk";
import { Network, TOKENS } from "zilswap-sdk/lib/constants";
import BigNumber from 'bignumber.js';


export interface ConnectProps {
  wallet: ConnectedWallet;
  network: Network;
};

export interface AddLiquidityProps {
  tokenID: string;
  zilAmount: string;
  tokenAmount: string;
  maxExchangeRateChange?: number;
}

export interface RemoveLiquidityProps {
  tokenID: string;
  contributionAmount: string;
  maxExchangeRateChange?: number;
}

/**
 * Filler for unexported type from zilswap-sdk
 */
type TokenDetails = {
  contract: Contract;
  address: string;
  hash: string;
  symbol: string;
  decimals: number;
};

/**
 * Filler for unexported type from zilswap-sdk
 */
type Pool = {
  zilReserve: BigNumber;
  tokenReserve: BigNumber;
  exchangeRate: BigNumber;
  totalContribution: BigNumber;
  userContribution: BigNumber;
  contributionPercentage: BigNumber;
};

type ConnectorState = {
  zilswap: Zilswap;
  wallet: ConnectedWallet;
};

let connectorState: ConnectorState | null = null;

const getState = (): ConnectorState => {
  if (connectorState === null)
    throw new Error("not connected");
  return connectorState!;
};

/**
 * Constructor for Zilswap SDK wrapper. Must populate connectorState if executed, 
 * throws error otherwise. 
 * 
 * @param wallet 
 */
const initializeForWallet = async (wallet: ConnectedWallet): Promise<Zilswap> => {
  switch (wallet.type) {
    case WalletConnectType.PrivateKey:
      const zilswap = new Zilswap(wallet.network, wallet.addressInfo.privateKey!);
      connectorState = { zilswap, wallet };
      return zilswap;
    case WalletConnectType.Moonlet:
      throw new Error("moonlet support under development");
    default:
      throw new Error("unknown wallet connector");
  }
};

export namespace ZilswapConnector {
  export const connect = async (props: ConnectProps) => {
    await initializeForWallet(props.wallet);
    await getState().zilswap.initialize();

    console.log("zilswap connection established");
  };

  export const getTokens = (): TokenDetails[] => {
    const { zilswap } = getState();
    const { tokens } = zilswap.getAppState();
    const tokensArray = Object.keys(tokens).map(hash => tokens[hash]);
    return <TokenDetails[]><unknown>tokensArray!;
  };

  export const getPool = (tokenID: string): Pool | null => {
    const { zilswap } = getState();
    return zilswap.getPool(tokenID);
  };

  export const addLiquidity = async (props: AddLiquidityProps) => {
    const { zilswap } = getState();

    const txReceipt = await zilswap.addLiquidity(
      props.tokenID,
      props.zilAmount,
      props.tokenAmount,
      props.maxExchangeRateChange);

    return txReceipt;
  };

  export const removeLiquidity = async (props: RemoveLiquidityProps) => {
    const { zilswap } = getState();

    const txReceipt = await zilswap.removeLiquidity(
      props.tokenID,
      props.contributionAmount,
      props.maxExchangeRateChange);

    return txReceipt;
  };

  export const disconnect = async (): Promise<void> => {
    const { zilswap } = getState();
    await zilswap.teardown();
  };
}



(async () => {
  const privateKey = "0x0eb38fce6e3f05b10b75d7e54d16aee9ed113d9c308b863c565648e5d826186b";
  const zilswap = new Zilswap(Network.TestNet, privateKey);
  const zilliqa = new Zilliqa(Network.TestNet);
  const addByPrivateKey = zilliqa.wallet.addByPrivateKey(privateKey);
  const account = zilliqa.wallet.defaultAccount!;
  console.log("addByPrivateKey", addByPrivateKey);
  console.log("account", account);

  await zilswap.initialize();



  const appState = zilswap.getAppState();
  const pool = zilswap.getPool(TOKENS.TestNet.ITN);

  console.log("appState", appState);
  console.log("pool", pool);

  await zilswap.teardown();
  console.log("teardown complete");
})();