import { Box, BoxProps, Button, Card, CircularProgress, ClickAwayListener, Popper } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { HelpInfo, KeyValueDisplay, Text } from "app/components";
import { ReactComponent as NewLinkIcon } from "app/components/new_link.svg";
import { actions } from "app/store";
import { RewardsState, RootState, TokenState, WalletState } from "app/store/types";
import { AppTheme } from "app/theme/types";
import { truncate, useAsyncTask, useNetwork, useValueCalculators } from "app/utils";
import { BIG_ZERO } from "app/utils/constants";
import BigNumber from "bignumber.js";
import cls from "classnames";
import { ZilswapConnector } from "core/zilswap";
import { ZWAPRewards } from "core/zwap";
import React, { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

interface Props extends BoxProps {

}

const useStyles = makeStyles((theme: AppTheme) => ({
  root: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      marginRight: theme.spacing(1),
    },
  },
  backdrop: {
    zIndex: 1101,
  },
  card: {
    minWidth: 320,
    padding: theme.spacing(3),
    boxShadow: theme.palette.mainBoxShadow,
  },
  popper: {
    zIndex: 1102,
  },
  statistic: {
    fontSize: theme.spacing(4),
    lineHeight: `${theme.spacing(4)}px`,
    fontWeight: 500,
  },
  topbarButton: {
    paddingTop: "2px",
    paddingBottom: "2px",
  },
  buttonIcon: {
    marginLeft: theme.spacing(1),
  },
}));

const RewardsInfoButton: React.FC<Props> = (props: Props) => {
  const { children, className, ...rest } = props;
  const classes = useStyles();
  const valueCalculators = useValueCalculators();
  const network = useNetwork();
  const dispatch = useDispatch();
  const walletState = useSelector<RootState, WalletState>(state => state.wallet);
  const tokenState = useSelector<RootState, TokenState>(state => state.token);
  const rewardsState = useSelector<RootState, RewardsState>(state => state.rewards);
  const [active, setActive] = useState(false);
  const [claimResult, setClaimResult] = useState<any>(null);
  const [runClaimRewards, loading, error] = useAsyncTask("claimRewards");
  const buttonRef = useRef();

  const potentialRewards = useMemo(() => {
    return Object.keys(rewardsState.potentialPoolRewards).reduce((accum, poolAddress) => {
      const reward = rewardsState.potentialPoolRewards[poolAddress];
      return accum.plus(reward);
    }, BIG_ZERO);
  }, [rewardsState.potentialPoolRewards]);

  const unclaimedRewards = useMemo(() => {
    const totalDistribution = rewardsState.rewardDistributions.reduce((sum, dist) => {
      return dist.claimed ? sum : sum.plus(dist.info.amount);
    }, BIG_ZERO);

    return totalDistribution;
  }, [rewardsState.rewardDistributions]);

  const zapTokenBalance: BigNumber = useMemo(() => {
    if (!ZilswapConnector.network) return BIG_ZERO;

    const zapContractAddr = ZWAPRewards.TOKEN_CONTRACT[ZilswapConnector.network] ?? "";
    return tokenState.tokens[zapContractAddr]?.balance ?? BIG_ZERO;
  }, [tokenState.tokens]);

  const zapTokenValue: BigNumber = useMemo(() => {
    if (!ZilswapConnector.network || zapTokenBalance.isZero()) return BIG_ZERO;

    const zapContractAddr = ZWAPRewards.TOKEN_CONTRACT[ZilswapConnector.network] ?? "";
    const zapToken = tokenState.tokens[zapContractAddr];
    if (!zapToken) return BIG_ZERO;

    return valueCalculators.amount(tokenState.prices, zapToken, zapTokenBalance);
  }, [tokenState.prices, tokenState.tokens, zapTokenBalance, valueCalculators]);

  const onClaimRewards = () => {
    runClaimRewards(async () => {
      if (unclaimedRewards.isZero() || !walletState.wallet) return;
      for (const distribution of rewardsState.rewardDistributions) {
        if (distribution.claimed) continue;

        // drop [leaf hash, ..., root hash]
        const proof = distribution.info.proof.slice(1, distribution.info.proof.length - 1);

        const claimTx = await ZWAPRewards.claim({
          amount: distribution.info.amount,
          proof,
          epochNumber: distribution.info.epoch_number,
          wallet: walletState.wallet,
        });

        setClaimResult(claimTx);

        setTimeout(() => {
          if (!ZilswapConnector.network) return;

          const zapContractAddr = ZWAPRewards.TOKEN_CONTRACT[ZilswapConnector.network] ?? "";
          dispatch(actions.Token.update({
            address: zapContractAddr,
            dirty: true,
          }));
        }, 5000);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    })
  };

  if (!walletState.wallet) return null;

  const popperModifiers = {
    flip: {
      enabled: true,
    },
    preventOverflow: {
      enabled: true,
      boundariesElement: 'scrollParent',
    },
    arrow: {
      enabled: true,
      element: buttonRef?.current,
    },
  } as const;

  return (
    <Box {...rest} className={cls(classes.root, className)}>
      <span>
        <Button
          size="small"
          buttonRef={buttonRef}
          className={classes.topbarButton}
          variant="outlined"
          onClick={() => setActive(!active)}>
          {zapTokenBalance.shiftedBy(-12).toFormat(2)} ZWAP
        </Button>
      </span>
      <Popper
        open={active}
        placement="bottom-end"
        className={classes.popper}
        anchorEl={buttonRef?.current}
        disablePortal
        modifiers={popperModifiers}>
        <Box marginTop={1}>
          <ClickAwayListener onClickAway={() => setActive(false)}>
            <Card className={classes.card}>
              <Text variant="body1" color="textSecondary">Your ZWAP Balance</Text>
              <Text variant="h1" marginTop={1} className={classes.statistic}>
                {zapTokenBalance.shiftedBy(-12).toFormat(2)} ZWAP
              </Text>
              <Text variant="body1" color="textSecondary">
                ≈${zapTokenValue.toFormat(2)}
              </Text>

              <KeyValueDisplay marginTop={3} emphasizeValue kkey={(
                <span>
                  Potential Rewards Next Epoch
                  <HelpInfo placement="bottom" title="Estimated based on current liquidity and may fluctuate." />
                </span>
              )}>
                {potentialRewards.shiftedBy(-12).toFormat(2)} ZWAP
              </KeyValueDisplay>
              <KeyValueDisplay marginTop={1} emphasizeValue kkey={"Unclaimed Rewards"}>
                {unclaimedRewards.shiftedBy(-12).toFormat(2)} ZWAP
              </KeyValueDisplay>

              {!!error && (
                <Box marginTop={1}>
                  <Text variant="body1" color="error">
                    {error.message ?? "Unknown error"}
                  </Text>
                </Box>
              )}

              {!!claimResult && (
                <Box marginTop={2}>
                  <Text variant="body1">Claim Request TX: 0x{truncate(claimResult?.id, 8, 8)}</Text>
                </Box>
              )}

              <Box marginTop={3} />

              {!claimResult && (
                <Button fullWidth variant="contained" color="primary" disabled={unclaimedRewards.isZero()} onClick={onClaimRewards}>
                  {loading && <CircularProgress size="1em" color="inherit" />}
                  {!loading && "Claim Rewards"}
                </Button>
              )}

              {!!claimResult && (
                <Button fullWidth variant="outlined" color="primary" target="_blank" href={`https://viewblock.io/zilliqa/tx/0x${claimResult?.id}?network=${network}`}>
                  View Claim TX <NewLinkIcon className={classes.buttonIcon} />
                </Button>
              )}
            </Card>
          </ClickAwayListener>
        </Box>
      </Popper>
    </Box>
  );
};

export default RewardsInfoButton;
