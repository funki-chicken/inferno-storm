import Inferno, { version } from 'inferno';
import Component from 'inferno-component';
import createElement from 'inferno-create-element';

const sys_namespace = 'storm:';

export const InitStorm = (setStore, getStore) => new Promise((resolve, reject) => {
    setStore({
        storm_transitions: (stormName) => {
            const store = getStore();
            const ns = sys_namespace + stormName + ':transitions';
            return typeof store[ns] === 'undefined' ? {} : store[ns]
        },
        expose_storm: (stormName) => exposedNamespacedProps(getStore(), sys_namespace + stormName + ':')
    }, () => resolve());
});

const BackgroundStorms = (namespace, scripts, context, store) => {
    context.componentWillUpdate = (nextProps, nextState) => {
        store = nextProps.store;
    };
    const getStore = () => store.expose_storm(namespace, store);
    const transitions = store.storm_transitions(namespace);
    scripts.forEach(script => script(transitions, () => getStore(), context));
}; 

export const Storm = class extends Component {
    constructor(props) {
        super(props);
        this.state = Object.assign(
            {},
            {
                baseSet: false,
                namespace: sys_namespace + this.props.namespace + ':'
            },
            this.props.spec(
                initSetScope(
                    sys_namespace + this.props.namespace + ':', this.props.setStore, this.props.store
                )
            )
        )
    }
    componentDidMount() {
        this._composeScopedState()
            .then(() => this._runLoaders())
            .then(() => this._startBackgroundScripts())
            .catch(err => console.log(err))
    }
    render() {
        if (this.state.baseSet) {
            return this.renderWithProps(
                exposedNamespacedProps(this.props.store, this.state.namespace)
            )
        } else {
            return <div style={{display: "none"}}/>
        }
    }
    renderWithProps(scopeStore) {
        return createElement(this.props.children, scopeStore)
    }
    _composeScopedState() {
        return new Promise((resolve, reject) => {
            const loaders = this.state.loaders(this.state.api, this.props.params)
            this.props.setStore(
                composeStoreState(
                    loaders, 
                    this.state.namespace, 
                    this.state.addProps(this.state.api), 
                    this.state.transitions
                ),
                () => {
                    this.setState({
                        baseSet: true
                    })
                    if (typeof this.props.onInitialRender === 'function') {
                        this.props.onInitialRender(this.props.store)
                    }
                    resolve()
                }
            )
        })
    }
    _runLoaders() {
        return new Promise((resolve, reject) => {
            const loaders = this.state.loaders(this.state.api, this.props.params)
            loaders.forEach(
                ([loadKeys, { fetcher, bases }]) => {
                    this._loadDataAtKey(
                        fetcher, 
                        loadKeys, 
                        loadKeys.map(loadKey => this.state.namespace + loadKey), 
                        () => resolve()
                    )
                }
            )
        })
    }
    _startBackgroundScripts() {
        const _this = this;
        BackgroundStorms(this.props.namespace, this.state.scripts, _this, this.props.store)
    }
    _loadDataAtKey(fetcher, load_keys, scoped_keys, cb) {
        if (typeof fetcher === 'function') {
            fetcher()
                .then(data => scoped_keys.length === 1 ?
                    this.props.setStore({ [scoped_keys[0]]: data }, () => typeof cb === 'function' ? cb() : null)
                    :
                    this.props.setStore(
                        Object.assign(
                            {},
                            ...scoped_keys.map((scoped_key, i) => ({ [scoped_key]: data[load_keys[i]] }))
                        ),
                        () => typeof cb === 'function' ? cb() : null
                    )
                )
                .catch(err => this.props.onError(scoped_keys, err))
        }
    }
};

const exposedNamespacedProps = (store, namespace) => {
    return Object.keys(store).reduce((accum, val, i, array) => {
        return Object.assign(
            {}, 
            accum, 
            val.includes(namespace) && !val.includes('transitions') ? {[val.split(namespace)[1]]: store[val]} : null)
    }, {})
};

const nullifyKeys = (obj) => Object.keys(obj).reduce((accum, key, i, array) => {
    accum[key] = null;
    return accum
}, {});

const composeStoreState = (loaders, namespace, additionalProps, transitions) => Object.assign(
    {},
    //helper props
    padKeys(namespace, additionalProps),
    //hacky persistence for transition functions
    { [namespace +'transitions']: transitions },
    //base case for each loader field
    ...loaders.map(([loadKeys, { fetcher, bases }]) => Object.assign({},
        ...loadKeys.map((loadKey, i) => ({ [namespace + loadKey]: bases[i] }))
    ))
);

const initSetScope = (namespace, setState, store) => {
    return (transition, cb) => {
        setState(
            (state) => padKeys(
                namespace,
                transition(
                    extractByNamespace(namespace, state)
                )
            ),
            () => typeof cb === 'function' ? cb() : null
        )
    }
};

const extractByNamespace = (namespace, state) => Object.keys(state).reduce((accum, key, i, array) => {
    if (key.includes(namespace)) {
        const field = key.split(namespace)[1];
        accum[field] = state[key];
    } 
    return accum
}, {});

const padKeys = (pad, obj) => Object.keys(obj).reduce((accum, val, i, array) => Object.assign({}, accum, {[pad + val]: obj[val]}), {});
