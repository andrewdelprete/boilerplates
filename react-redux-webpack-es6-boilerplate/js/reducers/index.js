import { combineReducers } from 'redux';

import { SET_INCREMENT_BY, INCREMENT_COUNTER } from '../actions/actions';

/**
 * The combineReducers helper function turns an object
 * whose values are different reducing functions into
 * a single reducing function you can pass to createStore.
 *
 * The resulting reducer calls every child reducer, and gather
 * their results into a single state object. The shape of the
 * state object matches the keys of the passed reducers.
 *
 * Returns a reducer that invokes every reducer inside the
 * reducers object, and constructs a state object
 * with the same shape.
 *
 * https://github.com/rackt/redux/blob/master/docs/api/combineReducers.md
 */
export default combineReducers({
    counter: (state = 0, action) => {
        switch (action.type) {
            case INCREMENT_COUNTER:
                return state + action.incrementBy
            default:
                return state
        }
    },
    clickCount: (state = 0, action) => {
        switch (action.type) {
            case INCREMENT_COUNTER:
                return state + 1
            default:
                return state
        }
    },
    incrementBy: (state = 1, action) => {
        switch (action.type) {
            case SET_INCREMENT_BY:
                return action.incrementBy
            default:
                return state
        }
    },
});
