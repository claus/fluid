'use strict';

import React from 'react';
import ApplicationStore from '../stores/ApplicationStore';
import {RouteHandler} from 'react-router';
import {connectToStores, provideContext}  from 'fluxible-addons-react';

class Application extends React.Component {

    render () {
        return (
            <RouteHandler />
        );
    }

}

Application = connectToStores(Application, [ApplicationStore], (context, props) => (
    context.getStore(ApplicationStore).getState()
));

Application = provideContext(Application);

export default Application;

