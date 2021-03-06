import { ADDRESS_TYPES } from 'blockchain-wallet-v4/src/redux/payment/btc/utils'
import { equals, filter, head, lift, nth, prop, propOr } from 'ramda'
import { formValueSelector } from 'redux-form'
import { Remote } from 'blockchain-wallet-v4/src'
import { selectors } from 'data'
import Bitcoin from 'bitcoinjs-lib'

const extractAddress = (walletSelector, lockboxSelector, value) =>
  value
    ? value.address && value.type !== ADDRESS_TYPES.LOCKBOX
      ? Remote.of(value.address)
      : value.index !== undefined
      ? walletSelector(value.index)
      : lockboxSelector(value.xpub)
    : Remote.NotAsked

const extractAddressIdx = (walletSelector, lockboxSelector, value) =>
  value
    ? value.address && value.type !== ADDRESS_TYPES.LOCKBOX
      ? Remote.of(value.address)
      : value.index !== undefined
      ? walletSelector(value.index)
      : lockboxSelector(value.xpub)
    : Remote.NotAsked

const extractAccountIdx = value =>
  value
    ? value.address && value.type !== ADDRESS_TYPES.LOCKBOX
      ? Remote.of(value.address)
      : value.index !== undefined
      ? Remote.of(value.index)
      : Remote.of(value.xpub)
    : Remote.NotAsked

export const getData = state => {
  const networkR = selectors.core.walletOptions.getBtcNetwork(state)
  const network = networkR.getOrElse('bitcoin')
  const availability = selectors.core.walletOptions.getCoinAvailability(
    state,
    'BTC'
  )
  const excludeLockbox = !availability
    .map(propOr(true, 'lockbox'))
    .getOrElse(true)

  const getReceiveAddressWallet = index =>
    selectors.core.common.btc.getNextAvailableReceiveAddress(
      Bitcoin.networks[network],
      index,
      state
    )
  const getReceiveIdxWallet = index =>
    selectors.core.common.btc.getNextAvailableReceiveIndex(
      Bitcoin.networks[network],
      index,
      state
    )
  const getReceiveAddressLockbox = xpub =>
    selectors.core.common.btc.getNextAvailableReceiveAddressLockbox(
      Bitcoin.networks[network],
      xpub,
      state
    )
  const getReceiveIdxLockbox = xpub =>
    selectors.core.common.btc.getNextAvailableReceiveIndexLockbox(
      Bitcoin.networks[network],
      xpub,
      state
    )

  const message = formValueSelector('requestBtc')(state, 'message')
  const amount = formValueSelector('requestBtc')(state, 'amount')
  const coin = formValueSelector('requestBtc')(state, 'coin')
  const to = formValueSelector('requestBtc')(state, 'to')
  const type = prop('type', to)
  const accountIdxR = extractAccountIdx(to)
  const receiveAddressIdxR = extractAddressIdx(
    getReceiveIdxWallet,
    getReceiveIdxLockbox,
    to
  )
  const receiveAddressR = extractAddress(
    getReceiveAddressWallet,
    getReceiveAddressLockbox,
    to
  )

  const transform = (receiveAddress, accountIdx, addressIdx) => ({
    type,
    coin,
    amount,
    message,
    excludeLockbox,
    accountIdx,
    addressIdx,
    receiveAddress
  })
  return lift(transform)(receiveAddressR, accountIdxR, receiveAddressIdxR)
}

export const getInitialValues = (state, ownProps) => {
  const to = to => ({ to, coin: 'BTC' })
  if (ownProps.lockboxIndex != null) {
    return selectors.core.common.btc
      .getLockboxBtcBalances(state)
      .map(nth(ownProps.lockboxIndex))
      .map(to)
  }
  const balancesR = selectors.core.common.btc.getAccountsBalances(state)
  const xpub = selectors.core.wallet.getDefaultAccountXpub(state)
  return balancesR.map(x => head(filter(x => equals(x.xpub, xpub), x))).map(to)
}

export const getImportedAddresses = state => {
  const balances = selectors.core.common.btc.getAddressesBalances(state)
  return balances.getOrElse([])
}
