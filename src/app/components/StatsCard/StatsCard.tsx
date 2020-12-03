import { Card, CardContent, CardProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { AppTheme } from "app/theme/types";
import cls from "classnames";
import React from "react";
import Text from "../Text";

interface Props extends CardProps {
  heading?: string;
}

const useStyles = makeStyles((theme: AppTheme) => ({
  root: {
    borderRadius: theme.spacing(.5),
    boxShadow: theme.palette.cardBoxShadow,
    ...theme.palette.type === "dark" && {
      background: "#474747",
    },
  },
  content: {
    padding: theme.spacing(3, 4),
    "&:last-child": {
      paddingBottom: theme.spacing(3),
    },
  },
}));
const StatsCard: React.FC<Props> = (props: Props) => {
  const { children, className, heading = " ", ...rest } = props;
  const classes = useStyles();
  return (
    <Card {...rest} className={cls(classes.root, className)}>
      <CardContent className={classes.content}>
        <Text variant="subtitle2" marginBottom={1.5}>{heading}</Text>
        {children}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
