import React from "react";
import { Global } from "@emotion/react";

export const Fonts = () => (
  <Global
    styles={`
      /* latin-ext */
      @font-face {
        font-family: 'Cooper Hewitt';
        font-style: normal;
        font-weight: 700;
        src: url(https://cdn.connext.network/fonts/cooper-hewitt/CooperHewitt-Semibold.otf);
      }
      /* latin-ext */
      @font-face {
        font-family: 'Cooper Hewitt';
        font-style: normal;
        font-weight: 500;
        src: url(https://cdn.connext.network/fonts/cooper-hewitt/CooperHewitt-Medium.otf);
      }
      /* latin-ext */
      @font-face {
        font-family: 'Cooper Hewitt';
        font-style: normal;
        font-weight: 400;
        src: url(https://cdn.connext.network/fonts/cooper-hewitt/CooperHewitt-Book.otf);
      }
      /* latin-ext */
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-weight: 700;
        src: url(https://cdn.connext.network/fonts/roboto/Roboto-Bold.ttf);
      }
      /* latin-ext */
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-weight: 500;
        src: url(https://cdn.connext.network/fonts/roboto/Roboto-Medium.ttf);
      }
      /* latin-ext */
      @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-weight: 400;
        src: url(https://cdn.connext.network/fonts/roboto/Roboto-Regular.ttf);
      }

      /* latin-ext */
      @font-face {
        font-family: 'Roboto Mono';
        font-style: normal;
        font-weight: 400;
        src: url(https://cdn.connext.network/fonts/roboto_mono/RobotoMono-Regular.ttf);
      }
      `}
  />
);
