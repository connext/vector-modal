import ConnextModal from './components/Modal';
// Add shims and polyfills
import '@webcomponents/webcomponentsjs/webcomponents-bundle.js';

import { define } from 'hybrids';
import WebModal from './components/WebModal';

// Enable HMR for development
// if (process.env.NODE_ENV !== "production") module.hot.accept();

// Define imported web component
define('connext-modal', WebModal);

export { ConnextModal };
