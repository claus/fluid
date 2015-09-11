'use strict';

import React from 'react';
import {Route, DefaultRoute, NotFoundRoute} from 'react-router';
import Application from './Application';
import Home from './Home';
import NotFound from './NotFound';

export default (
    <Route name="app" path="/" handler={Application}>
        <DefaultRoute name="home" handler={Home} />
        <NotFoundRoute handler={NotFound} />
    </Route>
)
