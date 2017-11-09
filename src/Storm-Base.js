import { version } from 'inferno';
import Component from 'inferno-component';
import createElement from 'inferno-create-element';
import { InitStorm, Storm } from './modules/storm/lib.js';
import app_base_spec from './storms/app-base/spec.js';

export default class extends Component {
    constructor(props) {
        super(props);
    }
    environment() {
        //Maybe do some stuff specific to the browser environment, set listeners, etc
    }
    componentDidMount() {
        const _this = this;
        InitStorm(_this); 
    }
    render() {
        const state = this.state;
        const setState = this.setState.bind(this);
        return(
            <Storm
                namespace='im_unique' //required: must be unique
                spec={app_base_spec} //required
                params={{}}          //optional
                onError={(field, error) => console.log("ERROR: ", field, error)} //required
                onInitialRender={() => this.environment()} //optional
                >
                {(store) => {
                    console.log(store);
                    const {
                        temperature
                    } = store;
                    const { heat_wave } = this.state.storm_transitions('im_unique');
                    return this.props.children
                }}
            </Storm>
        )
    }
}
