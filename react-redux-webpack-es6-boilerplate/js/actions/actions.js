/*
 * Action Types
 */
export const INCREMENT_CLICK_COUNT = 'INCREMENT_COUNTER'
export const INCREMENT_COUNTER = 'INCREMENT_COUNTER'
export const DECREMENT_COUNTER = 'DECREMENT_COUNTER'
export const SET_INCREMENT_BY = 'SET_INCREMENT_BY'

/**
 * Dispatch Increments Counter after a specified amount of time
 * @return { function }
 */
export function incrementAsync() {
    // Invert control!
    // Return a function that accepts `dispatch` so we can dispatch later.
    // Thunk middleware knows how to turn thunk async actions into actions.
    return (dispatch, getState) => {
        setTimeout(() => {
            // Yay! Can invoke sync or async actions with `dispatch`
            dispatch(increment(getState().incrementBy));
        }, 1000);
    };
}

/**
 * Increments Counter by a specified amount
 * @param  { int } incrementBy
 * @return { object }
 */
export function increment(incrementBy) {
    return {
        type: INCREMENT_COUNTER,
        incrementBy
    }
}

/**
 * Sets the amount counter should be incremented by
 * @param  { int } incrementBy
 * @return { object }
 */
export function setIncrementBy(incrementBy) {
    return {
        type: SET_INCREMENT_BY,
        incrementBy
    }
}
