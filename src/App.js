import { version } from 'inferno';
import Component from 'inferno-component';
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
        return (
            <Storm
                namespace='app_base' //required: must be unique
                spec={app_base_spec} //required
                params={{}}          //optional
                onError={(field, error) => console.log("ERROR: ", field, error)} //required
                onInitialRender={() => this.environment()} //optional
                >
                {(store) => {
                    console.log('Yo spec is working: ', store);
                    const {
                        temperature
                    } = store;
                    const { 
                        heat_wave 
                    } = this.state.storm_transitions('app_base');
                    return(
                        <p style={{ margin: 20 }}>
                            {'No more spaghetti state! The following are the props contained in the storm under the namespace, "app_base", in src/App.js:'}
                            <br />
                            <br />
                            <button style={{ margin: 0, backgroundColor: "#f44336", borderWidth: 0 }} onClick={() => heat_wave()}>Start a heat wave, baby!</button>
                            <br />
                            <br />
                            {JSON.stringify(store, null, 2)}
                            <br />
                            <br />
                            {"In lue of more official docs, given the simplicity of the code, I suggest starting with App.js, then jumping into storms/app-base/spec.js"}
                            <br />
                            {"This file should give you the information needed to create a decent mental model of what is happening."}
                            <br />
                            <br />
                            {"This starter project uses "}<a href='https://milligram.io/' target="_blank">milligram.css</a>{" via a cdn. "}
                            <br />
                            {"To remove this, just remove lines 13-15 in index.html within /public"}
                            <br />
                            <br />
                            {"As of writing this, when running 'npm run build' the bundle after gzip is 17kb"}
                            <br />
                            <br />
                            {'Happy hacking!'}
                            <br />
                            <br />
                            {"P.S. The secret sauce is in modules/storm/lib.js"}
                            <br />
                            {"It's kinda messy. If you have suggestions or ideas for modifications please reach out to me at funky_chicken@protonmail.com!"}
                        </p>
                    )
                }}
            </Storm>
        );
    }
}
