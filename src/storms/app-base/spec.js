import app_base from './background/entry.js';

export default (setScope) => ({
    api: {
        
    },
    loaders: (api, params) => ([
        [
            ['weather_data'],
            {
                fetcher: () => new Promise((resolve, reject) => resolve([])), //request must be a promise!
                bases: [null]
            }
        ]
    ]),
    addProps: (api) => ({
        //some additional properties to track
        temperature: 75
    }),
    transitions: {
        'heat_wave': () => setScope(
            (state) => ({
                temperature: state.temperature + 20
            })
        )
    },
    background: app_base
});