import { actions } from '../../data'
import { bindActionCreators } from 'redux'
import { compose } from 'ramda'
import { connect } from 'react-redux'
import FirstStep from './FirstStep'
import React from 'react'
import SecondStep from './SecondStep'
import ThirdStep from './ThirdStep'
import wizardProvider from 'providers/WizardProvider'

class Reset2FAContainer extends React.PureComponent {
  componentDidMount () {
    this.props.resetStep()
  }

  componentWillUnmount () {
    this.props.formActions.destroy('reset2FA')
  }

  render () {
    const { step, ...rest } = this.props

    switch (step) {
      case 1:
        return <FirstStep {...rest} />
      case 2:
        return <SecondStep {...rest} />
      case 3:
        return <ThirdStep {...rest} />
      default:
        return <FirstStep {...rest} />
    }
  }
}

const mapDispatchToProps = dispatch => ({
  formActions: bindActionCreators(actions.form, dispatch)
})

const enhance = compose(
  connect(null, mapDispatchToProps),
  wizardProvider('reset2FA', 3)
)

export default enhance(Reset2FAContainer)
