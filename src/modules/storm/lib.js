import Inferno, { version } from 'inferno';
import Component from 'inferno-component';
import createElement from 'inferno-create-element';
import async_parallel from 'async/parallel';

const sys_namespace = 'storm:';

let setStore = () => null;
let getStore = () => {};
let lock = true;

const exposedNamespacedProps = (namespace) => {
    const store = getStore();
    return Object.keys(store).reduce((accum, val, i, array) => {
        return Object.assign(
            {}, 
            accum, 
            val.includes(namespace) && !val.includes('transitions') ? {[val.split(namespace)[1]]: store[val]} : null)
    }, {})
};

const composeStoreState = (loaders, namespace, additionalProps, transitions) => Object.assign(
    {},
    //helper props
    _padKeys(namespace, additionalProps),
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
            (state) => _padKeys(
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

const _padKeys = (pad, obj) => Object.keys(obj).reduce((accum, val, i, array) => Object.assign({}, accum, {[pad + val]: obj[val]}), {});

const _setDefaults = (obj, defaultEmpty) => {
    const keys = Object.keys(defaultEmpty);
    for (var i = 0; i < keys.length; i++) {
        if (typeof obj[keys[i]] === 'undefined') {
            obj[keys[i]] = defaultEmpty[keys[i]];
        }
    }
    return obj
}

export const InitStorm = (context) => new Promise((resolve, reject) => {
    setStore = context.setState.bind(context);
    getStore = () => context.state;
    lock = false;
    setStore({
        storm_transitions: (stormName) => {
            const store = getStore();
            const ns = sys_namespace + stormName + ':transitions';
            return typeof store[ns] === 'undefined' ? {} : store[ns]
        },
        expose_storm: (stormName) => exposedNamespacedProps(sys_namespace + stormName + ':')
    }, () => resolve());
});

const BackgroundStorms = (namespace, scripts, context) => {
    const store = getStore();
    const getNamespacedStore = () => store.expose_storm(namespace);
    const transitions = store.storm_transitions(namespace);
    scripts.forEach(script => script(transitions, () => getNamespacedStore(), context));
}; 

export const Storm = class extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        if (lock) {
            return null
        }
        return <RunStorm {...this.props}/>
    }
}

const RunStorm = class extends Component {
    constructor(props) {
        super(props);
        this.state = Object.assign(
            {},
            {
                baseSet: false,
                namespace: sys_namespace + this.props.namespace + ':'
            },
            _setDefaults(this.props.spec(
                initSetScope(
                    sys_namespace + this.props.namespace + ':', setStore, getStore()
                )
            ), {
                'loaders': () => [],
                'addProps': () => ({}),
                'transitions': {},
                'scripts': [],
                'api': {}
            })
        )
    }
    _setState(obj) {
        return new Promise((resolve, reject) => this.setState(obj, () => resolve()))
    }
    componentDidMount() {
        this._composeScopedState()
            .then(() => this._setState({ baseSet: true }))
            .then(() => this._runLoaders())
            .then(() => this._startBackgroundScripts())
            .catch(err => console.log(err))
    }
    render() {
        if (this.state.baseSet) {
            return this.renderWithProps(
                exposedNamespacedProps(this.state.namespace)
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
            const loaders = this.state.loaders(this.state.api, this.props.params);
            setStore(
                composeStoreState(
                    loaders, 
                    this.state.namespace, 
                    this.state.addProps(this.state.api), 
                    this.state.transitions
                ),
                () => {
                    if (typeof this.props.onInitialRender === 'function') {
                        this.props.onInitialRender(getStore())
                    }
                    resolve()
                }
            )
        })
    }
    _runLoaders() {
        return new Promise((resolve, reject) => {
            const loaders = this.state.loaders(this.state.api, this.props.params)
            if (loaders.length === 0) {
                resolve()
            } else {
                async_parallel(
                    loaders.map(([loadKeys, { fetcher, bases }]) => (callback) => {
                        this._loadDataAtKey(
                            fetcher, 
                            loadKeys, 
                            loadKeys.map(loadKey => this.state.namespace + loadKey), 
                            () => callback()
                        )    
                    })  
                    , (err) => err ? reject(err) : resolve())
            }
        })
    }
    _startBackgroundScripts() {
        const _this = this;
        if (this.state.scripts.length === 0) {
            return
        }
        BackgroundStorms(this.props.namespace, this.state.scripts, _this)
    }
    _loadDataAtKey(fetcher, load_keys, scoped_keys, cb) {
        if (typeof fetcher === 'function') {
            fetcher()
                .then(data => scoped_keys.length === 1 ?
                    setStore({ [scoped_keys[0]]: data }, () => typeof cb === 'function' ? cb() : null)
                    :
                    setStore(
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
