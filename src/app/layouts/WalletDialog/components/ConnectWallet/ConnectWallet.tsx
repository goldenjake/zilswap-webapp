import { Box, DialogContent, Link, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import cls from "classnames";
import { ConnectOptionType } from "core/wallet/types";
import React from "react";
import { ConnectWalletOption } from "./components";
import { ReactComponent as MoonletIcon } from "./moonlet.svg";
import { ReactComponent as PrivateKeyIcon } from "./private-key.svg";

export interface ConnectWalletProps {
  onSelectConnectOption: (option: ConnectOptionType) => void;
}

const useStyles = makeStyles(theme => ({
  root: {
  },
  extraSpacious: {
    marginTop: theme.spacing(5),
    marginBottom: theme.spacing(5),
    [theme.breakpoints.down("sm")]: {
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(2),
    }
  },
}));

const ConnectWallet: React.FC<ConnectWalletProps & React.HTMLAttributes<HTMLDivElement>> = (props: any) => {
  const { children, className, onSelectConnectOption, ...rest } = props;
  const classes = useStyles();

  return (
    <Box {...rest} className={cls(classes.root, className)}>
      <DialogContent>
        <ConnectWalletOption label="Moonlet Wallet" icon={MoonletIcon} secureLevel={4} buttonText="Connect Moonlet" onSelect={() => onSelectConnectOption("moonlet")} />
        <ConnectWalletOption label="Private Key" icon={PrivateKeyIcon} secureLevel={1} buttonText="Enter Private Key" onSelect={() => onSelectConnectOption("privateKey")} />
      </DialogContent>
      <DialogContent className={classes.extraSpacious}>
        <Typography color="textPrimary" variant="body2" align="center">
          New to Moonlet? Download <Link href="#">here</Link> or <Link href="#">contact us</Link>.
        </Typography>
      </DialogContent>
    </Box>
  );
};

export default ConnectWallet;