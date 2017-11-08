import Inferno, { version } from 'inferno';
import Component from 'inferno-component';
import createElement from 'inferno-create-element';

const sys_namespace = 'storm:';

export const InitStorm = (setStore) => {
    setStore({
        storm_transitions: (stormName, store) => {
            const ns = sys_namespace + stormName + ':transitions';
            return typeof store[ns] === 'undefined' ? {} : store[ns]
        },
        expose_storm: (stormName, store) => exposedNamespacedProps(store, sys_namespace + stormName + ':')
    })
};
export const stormBackground = (context) => (userspace, store, getStore, scripts) => {
    const transitions = store.storm_transitions(userspace, store);
    scripts.forEach(script => script(transitions, () => getStore(userspace), context))
} 
export const Storm = class extends Component {
    constructor(props) {
        super(props);
        this.state = Object.assign(
            {},
            {
                baseSet: false,
                namespace: sys_namespace + this.props.namespace + ':'
            },
            typeof this.props.loadersOnly != 'undefined' ?
                {
                    loaders: this.props.loadersOnly,
                    addProps: () => ({}),
                    transitions: {},
                    background: () => null
                }
                :
                this.props.spec(initSetScope(sys_namespace + this.props.namespace + ':', this.props.setStore, this.props.store)))
    }
    componentWillUnmount() {
        
        // const loaders = this.state.loaders(this.state.api, this.props.params || {});
        //
        // //garbage collect unused storm props
        // this.props.setStore(
        //     nullifyKeys(
        //         composeStoreState(loaders, this.state.namespace, this.state.addProps(this.state.api), this.state.transitions)
        //     )
        // )
    }
    componentDidMount() {
        const loaders = this.state.loaders(this.state.api, this.props.params);
        const _this = this;
        if (loaders.length === 0) {
            this.setState({baseSet: true})
            return
        }
        this.props.setStore(
            composeStoreState(loaders, this.state.namespace, this.state.addProps(this.state.api), this.state.transitions),
            () => this.setState({ baseSet: true },
                () => {
                    if (typeof this.props.onInitialRender === 'function') {
                        this.props.onInitialRender(this.props.store)
                    }
                    loaders.forEach(
                        ([loadKeys, { fetcher, bases }]) => {
                            this.loadDataAtKey(
                                fetcher, 
                                loadKeys, 
                                loadKeys.map(loadKey => this.state.namespace + loadKey), 
                                () => this.state.background(stormBackground(_this), { context: _this, store: this.props.store })
                            )
                        }
                    )
                }
            )
        )
    }
    loadDataAtKey(fetcher, load_keys, scoped_keys, cb) {
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
    render() {
        if (this.state.baseSet) {
            return this.renderReactiveChild(
                exposedNamespacedProps(this.props.store, this.state.namespace)
            )
        } else {
            return <div style={{display: "none"}}/>
        }
    }
    renderReactiveChild(scopeStore) {
        return createElement(this.props.children, scopeStore)
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