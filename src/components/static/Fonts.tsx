import React from 'react';
import { Global } from '@emotion/react';
import {
  Roboto700,
  Roboto500,
  Roboto400,
  RobotoMono400,
  CooperHewitt700,
  CooperHewitt500,
  CooperHewitt400,
} from '../../public/fonts';

export const Fonts = () => (
  <Global
    styles={`
      /* latin-ext */
      @font-face {
        font-family: 'Cooper Hewitt';
        font-style: normal;
        font-weight: 700;
        src: url(${CooperHewitt700});
      }
      /* latin-ext */
      @font-face {
        font-family: 'Cooper Hewitt';
        font-style: normal;
        font-weight: 500;
        src: url(${CooperHewitt500});
      }
      /* latin-ext */
      @font-face {
        font-family: 'Cooper Hewitt';
        font-style: normal;
        font-weight: 400;
        src: url(${CooperHewitt400});
      }
      /* latin-ext */
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-weight: 700;
        src: url(${Roboto700});
      }
      /* latin-ext */
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-weight: 500;
        src: url(${Roboto500});
      }
      /* latin-ext */
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-weight: 400;
        src: url(${Roboto400});
      }

      /* latin-ext */
      @font-face {
        font-family: 'Roboto Mono';
        font-style: normal;
        font-weight: 400;
        src: url(${RobotoMono400});
      }
      `}
  />
);
