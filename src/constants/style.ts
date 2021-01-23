import {
  makeStyles,
  createStyles,
  Theme,
  createMuiTheme,
} from '@material-ui/core/styles';
import { purple, blue, green } from '@material-ui/core/colors';

export const theme = createMuiTheme({
  palette: {
    mode: 'light',
    primary: {
      main: purple[500],
    },
    secondary: {
      main: blue[500],
    },
    success: {
      main: green[500],
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  spacing: 2,
});

export const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    spacing: {
      margin: theme.spacing(3, 2),
    },
    card: {
      height: 'auto',
      minWidth: '390px',
    },
    success: { color: green[500] },
    dialog: {},
    header: {},
    networkBar: { paddingBottom: '1.5rem' },
    body: { padding: '1rem' },
    steps: { paddingBottom: '1rem' },
    status: { paddingBottom: '1rem' },
    qrcode: {
      paddingBottom: '1rem',
      filter: 'drop-shadow(0px 0px 4px rgba(0, 0, 0, 0.25))',
      borderRadius: '5px',
    },
    ethereumAddress: { paddingBottom: '1rem' },
    completeState: { paddingBottom: '1rem' },
    errorState: { paddingBottom: '1rem' },
    footer: {},
  })
);
