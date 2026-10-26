import { render } from '@solidjs/web';
import './assets/main.css';

// import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { initializeExperiment } from './experiments/client';

// Some hosts serve assets before the Worker. Resolve its signed assignment before rendering.
await initializeExperiment();
render(() => <App />, document.getElementById('app')!);

// Register service worker
// registerSW({ onOfflineReady() {} });
