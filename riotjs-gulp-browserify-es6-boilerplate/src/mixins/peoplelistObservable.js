import Riot from 'riot';

export default function() {
    // Make this instance an observable
    Riot.observable(this)

    // Store Functions
    let _setCountStore = (countArray) => this.trigger('setCountStore', countArray)

    // Action Listeners
    this.on('setCountAction', _setCountStore)
}
