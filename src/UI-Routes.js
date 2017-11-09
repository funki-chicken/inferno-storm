import Inferno from 'inferno';
import Component from 'inferno-component';
import createElement from 'inferno-create-element';
import { Router, Route, IndexRoute } from 'inferno-router';
import { Storm } from './modules/storm/lib.js';
import StormBase from './Storm-Base.js';

import createBrowserHistory from 'history/createBrowserHistory';

const browserHistory = createBrowserHistory();
 
const Home = class extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    render() {
        return(
            <Storm
                namespace='home_page' //required: must be unique
                spec={(setScope) => ({
                    'addProps': (api) => ({ another: 'test' })
                })} //required
                params={{}}          //optional
                onError={(field, error) => console.log("ERROR: ", field, error)} //required
                onInitialRender={() => console.log('Rendered')} //optional
                >
                {(store) => {
                    return(
                        <p style={{ margin: 20 }}>
                            {'No more spaghetti state! The following are the props contained in the storm under the namespace, "app_base", in src/App.js:'}
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
        )
    }
}
 
export const Routes = class extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    render() {
        return(
            <Router history={browserHistory}>
              <Route component={StormBase}>
                <IndexRoute component={Home}/>
              </Route>
            </Router>
        )
    }
}
