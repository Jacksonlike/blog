import _ from 'lodash'

import { localStorage } from './browser'
import { setValueTo, getValueFrom } from './core'

export const setValueToLocalStorage = _.partial(setValueTo, localStorage)
export const getValueFromLocalStorage = _.partial(getValueFrom, localStorage)
