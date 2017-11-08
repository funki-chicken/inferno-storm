import weather_patterns from './weather-patterns.js';

//EDIT HERE. add any scripts that need to run with access to storm:app_store's state
const BACKGROUND_SCRIPTS = [
    weather_patterns
];

//This is an implementation detail. You don't need to know what it's up to. 
export default (initBackgroundScripts, { context, store }) => {
    context.componentWillUpdate = (nextProps, nextState) => {
        store = nextProps.store;
    };
    const getStore = (stormspace) => {
        return store.expose_storm(stormspace, store)
    };
    initBackgroundScripts(
        'app_base',
        store,
        getStore,
        BACKGROUND_SCRIPTS
    );
}