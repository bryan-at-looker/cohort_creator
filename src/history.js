// src/history.js

import { createBrowserHistory } from 'history';

export default createBrowserHistory({
  basename: '/applications/'+window.lookerMetadata.app.id
});