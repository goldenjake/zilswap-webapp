import { Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { CurrencyInput, FancyButton, ProportionSelect } from "app/components";
import { actions } from "app/store";
import { RootState, TokenInfo, TokenState } from "app/store/types";
import { useAsyncTask } from "app/utils";
import { ZIL_TOKEN_NAME } from "app/utils/contants";
import BigNumber from "bignumber.js";
import cls from "classnames";
import { ZilswapConnector } from "core/zilswap";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PoolDetail from "../PoolDetail";
import PoolIcon from "../PoolIcon";

const initialFormState = {
  zilAmount: new BigNumber(0),
  tokenAmount: new BigNumber(0),
};

const useStyles = makeStyles(theme => ({
  root: {
  },
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    padding: theme.spacing(0, 8, 2),
    [theme.breakpoints.down("xs")]: {
      padding: theme.spacing(0, 2, 2),
    },
  },
  proportionSelect: {
    marginTop: 12,
    marginBottom: 20
  },
  input: {
    marginTop: 12,
    marginBottom: 20
  },
  actionButton: {
    marginTop: 45,
    marginBottom: 40,
    height: 46
  },
  svg: {
    alignSelf: "center"
  },
}));
const PoolDeposit: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props: any) => {
  const { className, ...rest } = props;
  const classes = useStyles();
  const [formState, setFormState] = useState<typeof initialFormState>(initialFormState);
  const [runAddLiquidity, loading, error] = useAsyncTask("poolAddLiquidity");
  const dispatch = useDispatch();
  const poolToken = useSelector<RootState, TokenInfo | null>(state => (console.log(state.pool.token) as undefined) || state.pool.token);
  const tokenState = useSelector<RootState, TokenState>(state => state.token);

  const onPercentage = (percentage: number) => {
    const zilToken = tokenState.tokens.zil;
    if (!zilToken) return;

    const balance = new BigNumber(zilToken.balance.toString());
    const amount = balance.times(percentage).decimalPlaces(0);
    onZilChange(amount.shiftedBy(-zilToken.decimals).toString());
  };

  const onPoolChange = (token: TokenInfo) => {
    if (token.symbol === "ZIL") return;
    dispatch(actions.Pool.selectPool({ token }));
  };

  const onZilChange = (amount: string = "0") => {
    const value = new BigNumber(amount);
    if (poolToken) {
      setFormState({
        ...formState,
        zilAmount: value,

        // only update counter currency if exchange rate is available
        ...poolToken.pool && {
          tokenAmount: value.div(poolToken.pool.exchangeRate).decimalPlaces(poolToken.decimals)
        },
      })
    }
  };

  const onTokenChange = (amount: string = "0") => {
    const value = new BigNumber(amount);
    if (poolToken) {
      setFormState({
        ...formState,
        tokenAmount: value,

        // only update counter currency if exchange rate is available
        ...poolToken.pool && {
          zilAmount: value.times(poolToken.pool.exchangeRate).decimalPlaces(poolToken.decimals),
        },
      })
    }
  };

  const onAddLiquidity = () => {
    if (!poolToken) return;
    if (loading) return;

    runAddLiquidity(async () => {
      const tokenAddress = poolToken.address;
      const txReceipt = await ZilswapConnector.addLiquidity({
        tokenAmount: formState.tokenAmount,
        zilAmount: formState.zilAmount,
        tokenID: tokenAddress,
      });

      const updatedPool = ZilswapConnector.getPool(tokenAddress) || undefined;
      dispatch(actions.Token.update({
        address: tokenAddress,
        pool: updatedPool,
      }));
      console.log({ txReceipt });
    });
  };

  return (
    <Box display="flex" flexDirection="column" {...rest} className={cls(classes.root, className)}>
      <Box className={classes.container}>
        <CurrencyInput fixedToZil
          label="Deposit"
          token={tokenState.tokens[ZIL_TOKEN_NAME]}
          amount={formState.zilAmount}
          disabled={!poolToken}
          onAmountChange={onZilChange} />

        <ProportionSelect fullWidth
          color="primary"
          className={classes.proportionSelect}
          onSelectProp={onPercentage} />

        <PoolIcon type="plus" />

        <CurrencyInput
          label="Deposit"
          token={poolToken}
          amount={formState.tokenAmount}
          className={classes.input}
          disabled={!poolToken}
          onAmountChange={onTokenChange}
          onCurrencyChange={onPoolChange} />
        <PoolDetail token={poolToken || undefined} />

        <Typography color="error">{error?.message}</Typography>
        <FancyButton
          loading={loading}
          walletRequired
          className={classes.actionButton}
          variant="contained"
          color="primary"
          fullWidth
          onClick={onAddLiquidity}>
          Add Liquidity
      </FancyButton>
      </Box>
    </Box>
  );
};

export default PoolDeposit;