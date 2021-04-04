import _ from 'lodash'

import { sessionStorage } from './browser'
import { setValueTo, getValueFrom } from './core'

export const setValueToSessionStorage = _.partial(setValueTo, sessionStorage)
export const getValueFromSessionStorage = _.partial(
  getValueFrom,
  sessionStorage
)
