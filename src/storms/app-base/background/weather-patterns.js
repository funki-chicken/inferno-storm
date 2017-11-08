export default (transitions, getStore, storm) => {
    //what's storm? just a ref to our store's parent component. aka the 'this' in this.state
    storm.componentWillUnmount = () => {
        //destroy any lingering setIntervals when this storm unmounts.
        //or leave it running. you do you
    };
    setTimeout(() => {
        const { heat_wave } = transitions;
        heat_wave();
        setTimeout(() => {        
            console.log(getStore());
        }, 1000);
    }, 4000)
}