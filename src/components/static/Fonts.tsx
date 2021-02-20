import React from 'react';
import { Global } from '@emotion/react';

import Roboto700 from '../../assets/fonts/roboto/Roboto-Bold.ttf';
import Roboto500 from '../../assets/fonts/roboto/Roboto-Medium.ttf';
import Roboto400 from '../../assets/fonts/roboto/Roboto-Regular.ttf';

import RobotoMono400 from '../../assets/fonts/roboto_mono/RobotoMono-Regular.ttf';

import CooperHewitt700 from '../../assets/fonts/cooper-hewitt/CooperHewitt-Semibold.otf';
import CooperHewitt500 from '../../assets/fonts/cooper-hewitt/CooperHewitt-Medium.otf';
import CooperHewitt400 from '../../assets/fonts/cooper-hewitt/CooperHewitt-Book.otf';

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
