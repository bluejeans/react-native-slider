import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { View, TouchableWithoutFeedback } from 'react-native'
import ViewPropTypes from 'react-native/Libraries/Components/View/ViewPropTypes'
import createFocusableComponent from '@bluejeans/react-native-windows/Libraries/Components/FocusableWindows/FocusableWindows.windows'

const FocusableTouchableWithoutFeedback = createFocusableComponent(TouchableWithoutFeedback)
const KEY_CODE_ENTER = FocusableTouchableWithoutFeedback.keys.Enter
const KEY_CODE_SPACE = FocusableTouchableWithoutFeedback.keys.Space
const KEY_CODE_ESC = FocusableTouchableWithoutFeedback.keys.Escape

export default class Touchable extends Component {
  static propTypes = {
    /**
     * Content property
     */
    children: PropTypes.node,
    /**
     * Width property
     * Priority is higher than the same in style.
     */
    width: PropTypes.number,
    /**
     * Height property
     * Priority is higher than the same in style.
     */
    height: PropTypes.number,
    /**
     * Border Radius property
     * Priority is higher than the same in style.
     */
    borderRadius: PropTypes.number,
    /**
     * General style
     */
    style: ViewPropTypes.style,

    /**
     * Pressed state style
     */
    pressedStyle: ViewPropTypes.style,

    /**
     * Hover state style
     */
    hoverStyle: ViewPropTypes.style,

    /**
     * Disabled state style
     */
    disabledStyle: ViewPropTypes.style,
    /**
     * Text to display for blindness accessibility features
     */
    accessibilityLabel: PropTypes.string,
    /**
     * Sets control type name. Used in AutomationPeer creation
     */
    controlTypeName: PropTypes.oneOf([
      'button',
      'calendar',
      'checkBox',
      'comboBox',
      'edit',
      'hyperlink',
      'image',
      'listItem',
      'list',
      'menu',
      'menuBar',
      'menuItem',
      'progressBar',
      'radioButton',
      'scrollBar',
      'slider',
      'spinner',
      'statusBar',
      'tab',
      'tabItem',
      'text',
      'toolBar',
      'toolTip',
      'tree',
      'treeItem',
      'custom',
      'group',
      'thumb',
      'dataGrid',
      'dataItem',
      'document',
      'splitButton',
      'window',
      'pane',
      'header',
      'headerItem',
      'table',
      'titleBar',
      'separator'
    ]),
    /**
     * If true, disable all interactions for this component.
     */
    disabled: PropTypes.bool,
    /**
     * Handler to be called when the user taps the button
     */
    onPress: PropTypes.func.isRequired,
    /**
     * Handler to be called when left mouse button down
     */
    onPressIn: PropTypes.func,
    /**
     * Handler to be called when left mouse button up
     */
    onPressOut: PropTypes.func,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: PropTypes.string,
    /**
     * tabIndex:
     * -1: Control is not keyboard focusable in any way
     * 0 (default): Control is keyboard focusable in the normal order
     * >0: Control is keyboard focusable in a priority order (starting with 1)
     */
    tabIndex: PropTypes.number,
    /**
     * Controls whether control should be auto focused
     */
    autoFocus: PropTypes.bool,
    /**
     * Controls whether control should be focusable
     */
    isTabStop: PropTypes.bool,
    /**
     * Callback that is called when the focus was lost
     */
    onLostFocus: PropTypes.func,
    /**
     * Callback that is called when the element got focus
     */
    onGotFocus: PropTypes.func,

    /**
     * Callback that is called when Enter key was pressed
     */
    onEnterKeyDown: PropTypes.func,

    /**
     * Callback that is called when Enter key was released
     */
    onEnterKeyUp: PropTypes.func,

    /**
     * Callback that is called when Space key was pressed
     */
    onSpaceKeyDown: PropTypes.func,

    /**
     * Callback that is called when Space key was released
     */
    onSpaceKeyUp: PropTypes.func,

    /**
     * Callback that is called when Escape key was pressed
     */
    onEscKeyDown: PropTypes.func,

    /**
     * Callback that is called when Escape key was released
     */
    onEscKeyUp: PropTypes.func,

    /**
     * Callback that is called when mouse enters element
     */
    onMouseEnter: PropTypes.func,

    /**
     * Callback that is called when mouse leaves element
     */
    onMouseLeave: PropTypes.func
  };

  constructor (props) {
    super(props)
    this.state = {
      hover: false,
      pressed: false
    }
  }

  /**
   * Handles base onKeyDown and filters by keyCode
   */
  handleKeyDown = (eventArgs) => {
    const { disabled, onEnterKeyDown, onSpaceKeyDown, onEscKeyDown, onPress } = this.props
    if (!disabled) {
      const key = eventArgs.nativeEvent.keyCode
      switch (key) {
        case KEY_CODE_ENTER:
          if (onEnterKeyDown) {
            onEnterKeyDown()
            break
          }

          // Default mapping (onEnterKeyDown -> onPress)
          if (onPress) {
            onPress()
          }

          break
        case KEY_CODE_SPACE:
          if (onSpaceKeyDown) {
            onSpaceKeyDown()
          }
          break
        case KEY_CODE_ESC:
          if (onEscKeyDown) {
            onEscKeyDown()
          }
          break
      }
    }
  }

  /**
   * Handles base onKeyUp and filters by keyCode
   */
  handleKeyUp = (eventArgs) => {
    const { disabled, onEnterKeyUp, onSpaceKeyUp, onEscKeyUp } = this.props
    if (!disabled) {
      const key = eventArgs.nativeEvent.keyCode
      switch (key) {
        case KEY_CODE_ENTER:
          if (onEnterKeyUp) {
            onEnterKeyUp()
          }
          break
        case KEY_CODE_SPACE:
          if (onSpaceKeyUp) {
            onSpaceKeyUp()
          }
          break
        case KEY_CODE_ESC:
          if (onEscKeyUp) {
            onEscKeyUp()
          }
          break
      }
    }
  }

  /**
   * Handles base onMouseEnter and raises onMouseEnter
   * from props if element not disabled
   */
  handleMouseEnter = () => {
    const { disabled, onMouseEnter } = this.props
    if (!disabled) {
      this.setState({ hover: true })
    }
    if (onMouseEnter) {
      onMouseEnter()
    }
  }

  /**
   * Handles base onMouseLeave and raises onMouseLeave
   * from props if element not disabled
   */
  handleMouseLeave = (event) => {
    const { disabled, onMouseLeave } = this.props
    if (!disabled) {
      this.setState({ hover: false })
    }
    if (onMouseLeave) {
      onMouseLeave()
    }
  }

  /**
   * Sets component state to pressed
   */
  setPressedState = () => {
    const { disabled, onPressIn } = this.props
    this.setState({ pressed: true })

    if (!disabled && onPressIn) {
      onPressIn()
    }
  }

  /**
   * Sets component state to passive
   */
  setPassiveState = () => {
    const { disabled, onPressOut } = this.props
    this.setState({ pressed: false })

    if (!disabled && onPressOut) {
      onPressOut()
    }
  }

  /**
   * Returns actual style depending on component state
   */
  calculateCurrentStyle = () => {
    const { style, pressedStyle, hoverStyle, disabledStyle, disabled, width, height, borderRadius } = this.props
    const { pressed, hover } = this.state

    let actualStyle = [style]

    // Check for disabled state and disabledStyle availability
    if (disabled && disabledStyle) {
      actualStyle = [disabledStyle]
    }
    // Check for pressed state and pressedStyle availability
    if (pressed && pressedStyle) {
      actualStyle = [pressedStyle]
    }
    // Check for hover state and hoverStyle availability
    if (hover && hoverStyle) {
      actualStyle = [hoverStyle]
    }
    if (width) {
      actualStyle.push({ width: width })
    }
    if (height) {
      actualStyle.push({ height: height })
    }
    if (borderRadius) {
      actualStyle.push({ borderRadius: borderRadius })
    }
    return actualStyle
  }

  componentDidMount () {
    if (this.props.autoFocus && this.refs.touchable && this.refs.touchable.focus) {
      this.refs.touchable.focus()
    }
  }

  render () {
    const {
      children,
      accessibilityLabel,
      controlTypeName,
      disabled,
      onPress,
      testID,
      tabIndex,
      isTabStop,
      onLostFocus,
      onGotFocus
    } = this.props

    const currentStyle = this.calculateCurrentStyle()

    return (
      <FocusableTouchableWithoutFeedback
        ref='touchable'
        style={currentStyle}
        accessibilityLabel={accessibilityLabel}
        controlTypeName={controlTypeName}
        disabled={disabled}
        onPress={onPress}
        onPressIn={this.setPressedState}
        onPressOut={this.setPassiveState}
        testID={testID}
        isTabStop={isTabStop === undefined ? !disabled : isTabStop}
        tabIndex={tabIndex || 0}
        onBlur={onLostFocus}
        onFocus={onGotFocus}
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp}
        importantForAccessibility={'yes'}
      >
        <View style={currentStyle} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
          {children}
        </View>
      </FocusableTouchableWithoutFeedback>

    )
  }
}
