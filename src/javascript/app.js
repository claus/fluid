'use strict';

import Fluxible from 'fluxible';

var app = new Fluxible({
    component: require('./components/Routes.jsx')
});

app.registerStore(require('./stores/ApplicationStore'));

export default app;
