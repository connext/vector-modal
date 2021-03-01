import { CacheProvider, ThemeProvider } from '@emotion/react';
import React, { ReactNode } from 'react';
import createCache from '@emotion/cache';
// @ts-ignore
import createExtraScopePlugin from 'stylis-plugin-extra-scope';
import { theme, Fonts, GlobalStyle } from './Style';

const CACHE_KEY = 'connext-modal';
const cache = createCache({
  key: CACHE_KEY,
  stylisPlugins: [createExtraScopePlugin(`#${CACHE_KEY}`)],
});

/**
 * Renders a <ThemeWrapper> component to wrap other elements of the library and provide
 * them the default library theme
 * @param  props
 * @param  props.children - The elements to render inside the theme provider
 */

interface ThemeWrapperProps {
  children: ReactNode;
}

const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children }) => (
  <CacheProvider value={cache}>
    <div id={CACHE_KEY}>
      <ThemeProvider theme={theme}>
        {/* <CSSReset /> */}
        <GlobalStyle />
        <Fonts />
        {children}
      </ThemeProvider>
    </div>
  </CacheProvider>
);

export default ThemeWrapper;
