import React, {
  Component,
  PropTypes
} from "react" 

import {
  Animated,
  StyleSheet,
  PanResponder,
  View,
  Easing,
  TouchableOpacity
} from "react-native" 

const shallowCompare = require('react-addons-shallow-compare'),
styleEqual = require('style-equal') 

const TRACK_SIZE = 6 
const THUMB_SIZE = 24 

function Rect(x, y, width, height) {
  this.x = x 
  this.y = y 
  this.width = width 
  this.height = height 
}

Rect.prototype.containsPoint = function(x, y) {
  return (x >= this.x
          && y >= this.y
          && x <= this.x + this.width
          && y <= this.y + this.height) 
} 

const DEFAULT_ANIMATION_CONFIGS = {
  spring : {
    friction : 7,
    tension  : 100
  },
  timing : {
    duration : 150,
    easing   : Easing.inOut(Easing.ease),
    delay    : 0
  },
  // decay : { // This has a serious bug
  //   velocity     : 1,
  //   deceleration : 0.997
  // }
} 

export class Slider extends Component {
  static propTypes = {
    /**
     * Initial value of the slider. The value should be between minimumValue
     * and maximumValue, which default to 0 and 1 respectively.
     * Default value is 0.
     *
     * *This is not a controlled component*, e.g. if you don't update
     * the value, the component won't be reset to its inital value.
     */
    value: PropTypes.number,

    /**
     * If true the user won't be able to move the slider.
     * Default value is false.
     */
    disabled: PropTypes.bool,

    /**
     * Initial minimum value of the slider. Default value is 0.
     */
    minimumValue: PropTypes.number,

    /**
     * Initial maximum value of the slider. Default value is 1.
     */
    maximumValue: PropTypes.number,

    /**
     * Step value of the slider. The value should be between 0 and
     * (maximumValue - minimumValue). Default value is 0.
     */
    step: PropTypes.number,

    /**
     * The color used for the track to the left of the button. Overrides the
     * default blue gradient image.
     */
    minimumTrackTintColor: PropTypes.string,

    /**
     * The color used for the track to the right of the button. Overrides the
     * default blue gradient image.
     */
    maximumTrackTintColor: PropTypes.string,

    /**
     * The color used for the thumb.
     */
    thumbTintColor: PropTypes.string,

    /**
     * The size of the touch area that allows moving the thumb.
     * The touch area has the same center has the visible thumb.
     * This allows to have a visually small thumb while still allowing the user
     * to move it easily.
     * The default is {width: 40, height: 40}.
     */
    thumbTouchSize: PropTypes.shape(
      {width: PropTypes.number, height: PropTypes.number}
    ),

    /**
     * Callback continuously called while the user is dragging the slider.
     */
    onValueChange: PropTypes.func,

    /**
     * Callback called when the user starts changing the value (e.g. when
     * the slider is pressed).
     */
    onSlidingStart: PropTypes.func,

    /**
     * Callback called when the user finishes changing the value (e.g. when
     * the slider is released).
     */
    onSlidingComplete: PropTypes.func,

    /**
     * The style applied to the slider container.
     */
    style: View.propTypes.style,

    /**
     * The style applied to the track.
     */
    trackStyle: View.propTypes.style,

    /**
     * The style applied to the thumb.
     */
    thumbStyle: View.propTypes.style,

    /**
     * Set this to true to visually see the thumb touch rect in green.
     */
    debugTouchArea: PropTypes.bool,

    /**
    * Set to true to animate values with default 'timing' animation type
    */
    animateTransitions : PropTypes.bool,

    /**
    * Custom Animation type. 'spring' or 'timing'.
    */
    animationType : PropTypes.oneOf(['spring', 'timing']),

    /**
    * Used to configure the animation parameters.  These are the same parameters in the Animated library.
    */
    animationConfig : PropTypes.object,
  }

  state = {
    containerSize: {width: 0, height: 0},
    trackSize: {width: 0, height: 0},
    thumbSize: {width: 0, height: 0},
    allMeasured: false,
    value: new Animated.Value(this.props.value)
  }

  static defaultProps = {
    value: 0,
    minimumValue: 0,
    maximumValue: 1,
    step: 0,
    minimumTrackTintColor: '#3f3f3f',
    maximumTrackTintColor: '#b3b3b3',
    thumbTintColor: '#343434',
    thumbTouchSize: {width: 24, height: 24},
    debugTouchArea: false,
    animationType: 'timing'
  }

  componentWillMount() {
    this._previousLeft = 0
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => false,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminationRequest: (evt, gestureState) => false,
      onPanResponderTerminate: this._handlePanResponderEnd
    })
  }

  componentWillReceiveProps(nextProps) {
    const newValue = nextProps.value

    if (this.props.value !== newValue) {
      if (this.props.animateTransitions) {
        this._setCurrentValueAnimated(newValue) 
      }
      else {
        this._setCurrentValue(newValue) 
      }
    }
  }

  onTrackPress = (event) => {
    const value = this._getValue({dx: event.nativeEvent.locationX}, true)
    let finalValue = value
    switch(true) {
      case (value < 0.167):
        finalValue = 0
        break
      case (value >= 0.167 && value < 0.5):
        finalValue = 0.334
        break 
      case (value >= 0.5 && value < 0.835):
        finalValue = .668
        break
      default:
        finalValue = 1
    }
    this._setCurrentValue(finalValue) 
    this._fireChangeEvent('onValueChange')
  }

  onPointPress = (value) => {
    this._setCurrentValue(value) 
    this._fireChangeEvent('onValueChange')
  }

  render() {
    const {
      minimumValue,
      maximumValue,
      minimumTrackTintColor,
      maximumTrackTintColor,
      thumbTintColor,
      styles,
      style,
      trackStyle,
      thumbStyle,
      ...other
    } = this.props 
    const { value, containerSize, trackSize, thumbSize, allMeasured } = this.state 
    const mainStyles = styles || defaultStyles 
    const thumbLeft = value.interpolate({
        inputRange: [minimumValue, maximumValue],
        outputRange: [0, containerSize.width - thumbSize.width],
        //extrapolate: 'clamp',
      }) 
    const valueVisibleStyle = {} 
    if (!allMeasured) {
      valueVisibleStyle.opacity = 0 
    }

    const minimumTrackStyle = {
      position: 'absolute',
      width: Animated.add(thumbLeft, thumbSize.width / 2),
      backgroundColor: minimumTrackTintColor,
      ...valueVisibleStyle
    } 
    
    const currentValue =  this._getCurrentValue()

    return (
      <View {...other} style={[mainStyles.container, style]} onLayout={this._measureContainer}>
        <TouchableOpacity
          style={[{backgroundColor: maximumTrackTintColor}, mainStyles.track, trackStyle]}
          activeOpacity={1}
          onLayout={this._measureTrack}
          onPress={this.onTrackPress}
        >
          <Animated.View
            renderToHardwareTextureAndroid
            style={[mainStyles.track, trackStyle, minimumTrackStyle]}
          />
          <TouchableOpacity onPress={() => this.onPointPress(0)} style={defaultStyles.firstPoint} activeOpacity={1}/>
          <TouchableOpacity onPress={() => this.onPointPress(0.334)} style={[defaultStyles.secondPoint, (currentValue > 0.334) && defaultStyles.whiteBackground]} activeOpacity={1}/>
          <TouchableOpacity onPress={() => this.onPointPress(0.668)} style={[defaultStyles.thirdPoint, (currentValue > 0.668) && defaultStyles.whiteBackground]} activeOpacity={1}/>
          <TouchableOpacity onPress={() => this.onPointPress(1)} style={defaultStyles.fourthPoint} activeOpacity={1}/>
        </TouchableOpacity>
        <Animated.View
          onLayout={this._measureThumb}
          style={[
            {backgroundColor: thumbTintColor},
            mainStyles.thumb, thumbStyle,
            {
              transform: [
                { translateX: thumbLeft },
                { translateY: 0 }
              ],
              ...valueVisibleStyle
            }
          ]}
        />
        {this._renderThumbTouchRect(thumbLeft)}
      </View>
    )
  }

  _getPropsForComponentUpdate(props) {
    const {
      value,
      onValueChange,
      onSlidingStart,
      onSlidingComplete,
      style,
      trackStyle,
      thumbStyle,
      ...otherProps,
    } = props 

    return otherProps
  }

  _handlePanResponderGrant = (/*e: Object, gestureState: Object*/) => {
    this._previousLeft = this._getThumbLeft(this._getCurrentValue()) 
    this._fireChangeEvent('onSlidingStart') 
  }

  _handlePanResponderMove = (e: Object, gestureState: Object) => {
    if (this.props.disabled) {
      return
    }

    this._setCurrentValue(this._getValue(gestureState)) 
    this._fireChangeEvent('onValueChange')
  }

  _handlePanResponderEnd = (e: Object, gestureState: Object) => {
    if (this.props.disabled) {
      return
    }

    const value = this._getValue(gestureState)
    let finalValue = value

    switch(true) {
      case (value < 0.167):
        finalValue = 0
        break
      case (value >= 0.167 && value < 0.5):
        finalValue = 0.334
        break 
      case (value >= 0.5 && value < 0.835):
        finalValue = .668
        break
      default:
        finalValue = 1
    }


    this._setCurrentValue(finalValue) 
    this._fireChangeEvent('onValueChange')
    this._fireChangeEvent('onSlidingComplete')
  }

  _measureContainer = (x: Object) => {
    this._handleMeasure('containerSize', x)
  }

  _measureTrack = (x: Object) => {
    this._handleMeasure('trackSize', x)
  }
  _measureThumb = (x: Object) => {
    this._handleMeasure('thumbSize', x)
  }

  _handleMeasure = (name: string, x: Object) => {
    const {width, height} = x.nativeEvent.layout
    const size = {width: width, height: height}

    const storeName = `_${name}` 
    const currentSize = this[storeName] 
    if (currentSize && width === currentSize.width && height === currentSize.height) {
      return
    }
    this[storeName] = size 

    if (this._containerSize && this._trackSize && this._thumbSize) {
      this.setState({
        containerSize: this._containerSize,
        trackSize: this._trackSize,
        thumbSize: this._thumbSize,
        allMeasured: true
      })
    }
  }

  _getRatio = (value: number) => {
    return (value - this.props.minimumValue) / (this.props.maximumValue - this.props.minimumValue) 
  }

  _getThumbLeft = (value: number) => {
    const ratio = this._getRatio(value) 
    return ratio * (this.state.containerSize.width - this.state.thumbSize.width) 
  }

  _getValue = (gestureState: Object, trackPressed) => {
    let length = this.state.containerSize.width
    let thumbLeft = gestureState.dx 
    if (!trackPressed) {
      length = this.state.containerSize.width - this.state.thumbSize.width 
      thumbLeft = this._previousLeft + gestureState.dx 
    }

    const ratio = thumbLeft / length 

    if (this.props.step) {
      return Math.max(this.props.minimumValue,
        Math.min(this.props.maximumValue,
          this.props.minimumValue + Math.round(ratio * (this.props.maximumValue - this.props.minimumValue) / this.props.step) * this.props.step
        )
      ) 
    } else {
      return Math.max(this.props.minimumValue,
        Math.min(this.props.maximumValue,
          ratio * (this.props.maximumValue - this.props.minimumValue) + this.props.minimumValue
        )
      ) 
    }
  }

  _getCurrentValue = () => {
    return this.state.value.__getValue() 
  }

  _setCurrentValue = (value: number) => {
    this.state.value.setValue(value) 
  }

  _setCurrentValueAnimated= (value: number) => {
    const animationType   = this.props.animationType 
    const animationConfig = Object.assign(
          {},
          DEFAULT_ANIMATION_CONFIGS[animationType],
          this.props.animationConfig,
          {toValue : value}
        ) 

    Animated[animationType](this.state.value, animationConfig).start() 
  }

  _fireChangeEvent = (event) => {
    if (this.props[event]) {
      this.props[event](this._getCurrentValue()) 
    }
  }

  _getTouchOverflowSize = () => {
    const state = this.state 
    const props = this.props 

    const size = {} 
    if (state.allMeasured === true) {
      size.width = Math.max(0, props.thumbTouchSize.width - state.thumbSize.width) 
      size.height = Math.max(0, props.thumbTouchSize.height - state.containerSize.height) 
    }

    return size 
  }

  _getThumbTouchRect = () => {
    const state = this.state 
    const props = this.props 
    const touchOverflowSize = this._getTouchOverflowSize() 

    return new Rect(
      touchOverflowSize.width / 2 + this._getThumbLeft(this._getCurrentValue()) + (state.thumbSize.width - props.thumbTouchSize.width) / 2,
      touchOverflowSize.height / 2 + (state.containerSize.height - props.thumbTouchSize.height) / 2,
      props.thumbTouchSize.width,
      props.thumbTouchSize.height
    )
  }

  _renderThumbTouchRect = (thumbLeft) => {
    const thumbTouchRect = this._getThumbTouchRect() 
    const positionStyle = {
      position: 'absolute',
      left: thumbLeft,
      top: thumbTouchRect.y,
      width: thumbTouchRect.width,
      height: thumbTouchRect.height,
    } 

    return (
      <Animated.View
        {...this._panResponder.panHandlers}
        onMouseLeave={() => this.props.onHover(false)}
        onMouseEnter={() => this.props.onHover(true)}
        style={[defaultStyles.debugThumbTouchArea, positionStyle]}
      />
    )
  }
}


const defaultStyles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    width: 130
  },
  whiteBackground: {
    backgroundColor: 'white'
  },
  track: {
    height: TRACK_SIZE,
    borderRadius: TRACK_SIZE / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
  },
  touchArea: {
    position: 'absolute',
    backgroundColor: 'transparent',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  debugThumbTouchArea: {
    backgroundColor: 'transparent',
    opacity: 0.5,
  },
  firstPoint: {
    position: 'absolute',
    backgroundColor: 'white',
    left: '1%',
    height: 4,
    width: 4,
    borderRadius: 4,
    marginTop: 1,
    marginBottom: 1
  },
  secondPoint: {
    position: 'absolute',
    backgroundColor: '#00A7F4',
    left: '33%',
    height: 4,
    width: 4,
    borderRadius: 4,
    marginTop: 1,
    marginBottom: 1
  },
  thirdPoint: {
    position: 'absolute',
    backgroundColor: '#00A7F4',
    left: '65%',
    height: 4,
    width: 4,
    borderRadius: 4,
    marginTop: 1,
    marginBottom: 1
  },
  fourthPoint: {
    position: 'absolute',
    backgroundColor: '#00A7F4',
    left: '95%',
    height: 4,
    width: 4,
    borderRadius: 4,
    marginTop: 1,
    marginBottom: 1
  }
})
