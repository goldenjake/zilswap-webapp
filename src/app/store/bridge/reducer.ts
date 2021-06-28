import { LocalStorageKeys } from "app/utils/constants";
import { bnOrZero, DataCoder } from "app/utils/strings/strings";
import BigNumber from "bignumber.js";
import { Blockchain } from "tradehub-api-js";
import { BridgeActionTypes } from "./actions";
import { BridgeState, BridgeTx } from "./types";

export const BridgeTxEncoder: DataCoder<BridgeTx> = {
  encode: (tx: BridgeTx): object => {
    return {
      srcChain: tx.srcChain,
      dstChain: tx.dstChain,
      srcAddr: tx.srcAddr,
      dstAddr: tx.dstAddr,
      srcToken: tx.srcToken,
      dstToken: tx.dstToken,
      withdrawFee: tx.withdrawFee.toString(10),
      inputAmount: tx.withdrawFee.toString(10),
      interimAddrMnemonics: tx.interimAddrMnemonics,
      approveTxHash: tx.approveTxHash,
      sourceTxHash: tx.sourceTxHash,
      depositTxConfirmedAt: DataCoder.encodeDayjs(tx.depositTxConfirmedAt),
      withdrawTxHash: tx.withdrawTxHash,
      destinationTxHash: tx.destinationTxHash,
      destinationTxConfirmedAt: DataCoder.encodeDayjs(tx.destinationTxConfirmedAt),
    };
  },

  decode: (data: any): BridgeTx => {
    const object = data;
    return {
      srcChain: object.srcChain,
      dstChain: object.dstChain,
      srcAddr: object.srcAddr,
      dstAddr: object.dstAddr,
      srcToken: object.srcToken,
      dstToken: object.dstToken,
      withdrawFee: bnOrZero(object.withdrawFee),
      inputAmount: bnOrZero(object.withdrawFee),
      interimAddrMnemonics: object.interimAddrMnemonics,
      approveTxHash: object.approveTxHash,
      sourceTxHash: object.sourceTxHash,
      depositTxConfirmedAt: DataCoder.decodeDayjs(object.depositTxConfirmedAt),
      withdrawTxHash: object.withdrawTxHash,
      destinationTxHash: object.destinationTxHash,
      destinationTxConfirmedAt: DataCoder.decodeDayjs(object.destinationTxConfirmedAt),
    }
  }
}


const loadedBridgeTxsData = localStorage.getItem(LocalStorageKeys.BridgeTxs);
let loadedBridgeTxs: BridgeTx[] = [];
try {
  if (loadedBridgeTxsData) {
    const savedTxs: object[] = JSON.parse(loadedBridgeTxsData);
    loadedBridgeTxs = savedTxs.map(BridgeTxEncoder.decode);
  }
} catch (error) {
  loadedBridgeTxs = [];
}

const saveBridgeTxs = (txs: BridgeTx[]) => {
  const encodedTxs = txs.map(BridgeTxEncoder.encode);
  localStorage.setItem(LocalStorageKeys.BridgeTxs, JSON.stringify(encodedTxs));
}

const initial_state: BridgeState = {
  bridgeTxs: loadedBridgeTxs,

  tokens: {
    [Blockchain.Zilliqa]: [
      {
        blockchain: Blockchain.Zilliqa,
        tokenAddress: '5d3ecead6149b264db1ffbc45625e0131ac06d3c',
        denom: 'usdt.z',
        toBlockchain: Blockchain.Ethereum,
        toTokenAddress: '1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        toDenom: 'usdt.e',
      }
    ],
    [Blockchain.Ethereum]: [
      {
        blockchain: Blockchain.Ethereum,
        tokenAddress: '1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        denom: 'usdt.e',
        toBlockchain: Blockchain.Zilliqa,
        toTokenAddress: '5d3ecead6149b264db1ffbc45625e0131ac06d3c',
        toDenom: 'usdt.z',
      }
    ],
  },

  formState: {
    transferAmount: new BigNumber(0),

    isInsufficientReserves: false,
    forNetwork: null,
  }
}

const reducer = (state: BridgeState = initial_state, action: any) => {
  const { payload } = action;

  switch (action.type) {

    case BridgeActionTypes.CLEAR_FORM:
      return {
        ...state,
        formState: {
          sourceAddress: '',
          transferAmount: new BigNumber(0),

          isInsufficientReserves: false,
          forNetwork: null,
        },
      };

    case BridgeActionTypes.SET_TOKENS:
      return {
        ...state,
        formState: {
          ...state.formState,
          tokens: payload,
        },
      };

    case BridgeActionTypes.ADD_BRIDGE_TXS:
      const newBridgeTxs = [
        ...state.bridgeTxs,
        ...payload,
      ];

      saveBridgeTxs(newBridgeTxs);

      return {
        ...state,
        bridgeTxs: newBridgeTxs,
      };

    case BridgeActionTypes.UPDATE_FORM:
      return {
        ...state,
        formState: {
          ...state.formState,
          ...payload,
        }
      };

    default:
      return state;
  }
}

export default reducer;
