import React from 'react';
import { Global, css } from '@emotion/react';
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

export const GlobalStyle = () => (
  <Global
    styles={css`
      .global-style {
        html {
          line-height: 1.5;
          -webkit-text-size-adjust: 100%;
          font-family: system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          -moz-osx-font-smoothing: grayscale;
          touch-action: manipulation;
        }
        body {
          position: relative;
          min-height: 100%;
          font-feature-settings: 'kern';
        }
        *,
        *::before,
        *::after {
          border-width: 0;
          border-style: solid;
          box-sizing: border-box;
        }
        main {
          display: block;
        }
        hr {
          border-top-width: 1px;
          box-sizing: content-box;
          height: 0;
          overflow: visible;
        }
        pre,
        code,
        kbd,
        samp {
          font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 1em;
        }
        a {
          background-color: transparent;
          color: inherit;
          text-decoration: inherit;
        }
        abbr[title] {
          border-bottom: none;
          text-decoration: underline;
          -webkit-text-decoration: underline dotted;
          text-decoration: underline dotted;
        }
        b,
        strong {
          font-weight: bold;
        }
        small {
          font-size: 80%;
        }
        sub,
        sup {
          font-size: 75%;
          line-height: 0;
          position: relative;
          vertical-align: baseline;
        }
        sub {
          bottom: -0.25em;
        }
        sup {
          top: -0.5em;
        }
        img {
          border-style: none;
        }
        input,
        optgroup,
        select,
        textarea {
          font-family: inherit;
          line-height: 1.15;
        }
        button,
        input {
          overflow: visible;
          box-shadow: none !important;
        }
        button::-moz-focus-inner,
        [type='button']::-moz-focus-inner,
        [type='reset']::-moz-focus-inner,
        [type='submit']::-moz-focus-inner {
          border-style: none;
          padding: 0;
        }
        fieldset {
          padding: 0.35em 0.75em 0.625em;
        }
        legend {
          box-sizing: border-box;
          color: inherit;
          display: table;
          max-width: 100%;
          padding: 0;
          white-space: normal;
        }
        progress {
          vertical-align: baseline;
        }
        textarea {
          overflow: auto;
        }
        [type='checkbox'],
        [type='radio'] {
          box-sizing: border-box;
          padding: 0;
        }
        [type='number']::-webkit-inner-spin-button,
        [type='number']::-webkit-outer-spin-button {
          -webkit-appearance: none !important;
        }
        input[type='number'] {
          -moz-appearance: textfield;
        }
        [type='search'] {
          -webkit-appearance: textfield;
          outline-offset: -2px;
        }
        [type='search']::-webkit-search-decoration {
          -webkit-appearance: none !important;
        }
        ::-webkit-file-upload-button {
          -webkit-appearance: button;
          font: inherit;
        }
        details {
          display: block;
        }
        summary {
          display: list-item;
        }
        template {
          display: none;
        }
        [hidden] {
          display: none !important;
        }
        body,
        blockquote,
        dl,
        dd,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        hr,
        figure,
        p,
        pre {
          margin: 0;
        }
        fieldset {
          margin: 0;
          padding: 0;
        }
        ol,
        ul {
          margin: 0;
          padding: 0;
        }
        textarea {
          resize: vertical;
        }
        button,
        [role='button'] {
          cursor: pointer;
        }
        button::-moz-focus-inner {
          border: 0 !important;
        }
        table {
          border-collapse: collapse;
        }
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          font-size: inherit;
          font-weight: inherit;
        }
        button,
        input,
        optgroup,
        select,
        textarea {
          line-height: inherit;
          color: inherit;
        }
        img,
        svg,
        video,
        canvas,
        audio,
        iframe,
        embed,
        object {
          display: block;
        }
        img,
        video {
          max-width: 100%;
          height: auto;
        }
        [data-js-focus-visible] :focus:not([data-focus-visible-added]) {
          outline: none;
          box-shadow: none;
        }
        select::-ms-expand {
          display: none;
        }
      }
    `}
  />
);
