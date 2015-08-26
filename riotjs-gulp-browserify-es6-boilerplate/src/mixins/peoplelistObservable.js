import Riot from 'riot';

export default function() {
    Riot.observable(this)

    this.on('setCountAction', (countArray) => {
        this.trigger('setCountStore', countArray)
    })
}
