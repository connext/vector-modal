import ConnextModal from './components/Modal';
// Add shims and polyfills
import '@webcomponents/webcomponentsjs/webcomponents-bundle.js';

import { define } from 'hybrids';
import WebModal from './components/WebModal';
import Counter from './components/Counter';

// Enable HMR for development
// if (process.env.NODE_ENV !== "production") module.hot.accept();

// Define imported web component
define('web-modal', WebModal);
define('react-counter', Counter);

export { ConnextModal };
