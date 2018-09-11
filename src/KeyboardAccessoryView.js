import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  View,
  Keyboard,
  LayoutAnimation,
  Platform,
  StyleSheet,
  ViewPropTypes
} from 'react-native';

const accessoryAnimation = (duration, easing, animationConfig = null) => {

  if (animationConfig) {
    if (typeof animationConfig === 'function') {
      return animationConfig(duration, easing);
    }
    return animationConfig;
  }

  if (Platform.OS === 'android') {
    return {
      duration: 200,
      create: {
        duration: 200,
        type: LayoutAnimation.Types.linear,
        property: LayoutAnimation.Properties.opacity
      },
      update: {
        type: LayoutAnimation.Types.linear,
      }
    }
  }

  return LayoutAnimation.create(
    duration,
    LayoutAnimation.Types[easing],
    LayoutAnimation.Properties.opacity,
  )
}

class KeyboardAccessoryView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      keyboardHeight: 0,
      accessoryHeight: 50,
      visibleAccessoryHeight: 50,
      isKeyboardVisible: false,
    }
  }

  componentDidMount () {
    const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    this.keyboardShowEventListener = Keyboard.addListener(keyboardShowEvent, this.handleKeyboardShow);
    this.keyboardHideEventListener = Keyboard.addListener(keyboardHideEvent, this.handleKeyboardHide);
  }

  componentWillUnmount() {
    this.keyboardShowEventListener.remove();
    this.keyboardHideEventListener.remove();
  }

  handleChildrenLayout = (layoutEvent) => {
    this.setState({
      visibleAccessoryHeight: layoutEvent.nativeEvent.layout.height,
      accessoryHeight: this.props.alwaysVisible ? layoutEvent.nativeEvent.layout.height : 0,
    });
  }

  handleKeyboardShow = (keyboardEvent) => {
    if (!keyboardEvent.endCoordinates) {
      return;
    }

    const keyboardHeight = Platform.select({
      ios: keyboardEvent.endCoordinates.height,
      android: this.props.androidAdjustResize
        ? 0
        : keyboardEvent.endCoordinates.height
    });

    const keyboardAnimate = () => {
      const { animationConfig, animateOn } = this.props;

      if (animateOn === 'all' || Platform.OS === animateOn) {
        LayoutAnimation.configureNext(
          accessoryAnimation(keyboardEvent.duration, keyboardEvent.easing, animationConfig)
        );
      }

      this.setState({
        isKeyboardVisible: true,
        keyboardHeight: keyboardHeight
      })
    };

    if (Platform.OS === 'ios' || typeof this.props.onKeyboardShowDelay !== 'number') {
      keyboardAnimate();
    } else {
      setTimeout(() => {
        keyboardAnimate()
      }, this.props.onKeyboardShowDelay);
    }

    this.setState({
      isKeyboardVisible: true,
      keyboardHeight: keyboardHeight,
      accessoryHeight: this.state.visibleAccessoryHeight,
    })
  }

  hide = ()=>{
    this.setState({
      isKeyboardVisible: false,
      keyboardHeight: 0,
      accessoryHeight: this.props.alwaysVisible ? this.state.visibleAccessoryHeight : 0,
    })
  }

  handleKeyboardHide = (keyboardEvent) => {
    const { animateOn, animationConfig } = this.props;

    if (animateOn === 'all' || Platform.OS === animateOn) {
      LayoutAnimation.configureNext(
        animationConfig || accessoryAnimation(keyboardEvent.duration, keyboardEvent.easing, animationConfig)
      );
    }

    this.hide();
  }

  render() {
    const {
      isKeyboardVisible,
      accessoryHeight,
      keyboardHeight,
    } = this.state;

    const {
      bumperHeight,
      adjustableHeight,
      alwaysVisible,
      visibleOpacity,
      hiddenOpacity,
      hideBorder,
      style,
      inSafeAreaView,
      safeAreaBumper,
      ref,
    } = this.props;

    return (
      <View ref={(r)=>{ref&&ref(r)}} style={{ height: (isKeyboardVisible || alwaysVisible ? accessoryHeight : 0) }}>
        <View style={[
          styles.accessory,
          !hideBorder && styles.accessoryBorder,
          style,
          {
            opacity: (isKeyboardVisible || alwaysVisible ? visibleOpacity : hiddenOpacity),
            bottom: keyboardHeight - bumperHeight - (inSafeAreaView ? 20 : 0) + adjustableHeight,
            height: accessoryHeight + bumperHeight + (inSafeAreaView ? (!isKeyboardVisible ? 20 : -10) : 0) + adjustableHeight,
          }
        ]}>
          <View onLayout={this.handleChildrenLayout}>
            { this.props.children }
          </View>
        </View>
      </View>
    );
  }
}

KeyboardAccessoryView.propTypes = {
  style: (View.propTypes||ViewPropTypes).style,
  animateOn: PropTypes.oneOf(['ios', 'android', 'all', 'none']),
  animationConfig: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.func
  ]),
  bumperHeight: PropTypes.number,
  adjustableHeight: PropTypes.number,
  visibleOpacity: PropTypes.number,
  hiddenOpacity: PropTypes.number,
  onKeyboardShowDelay: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.bool
  ]),
  androidAdjustResize: PropTypes.bool,
  alwaysVisible: PropTypes.bool,
  hideBorder: PropTypes.bool,
  inSafeAreaView: PropTypes.bool,
  ref: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.func
  ]),
}

KeyboardAccessoryView.defaultProps = {
  animateOn: 'ios',
  bumperHeight: 15,
  adjustableHeight: 0,
  visibleOpacity: 1,
  hiddenOpacity: 0,
  androidAdjustResize: false,
  alwaysVisible: false,
  hideBorder: false,
  inSafeAreaView: false,
}

const styles = StyleSheet.create({
  accessory: {
    position: 'absolute',
    right: 0,
    left: 0,
    backgroundColor: '#EFF0F1',
  },
  accessoryBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.2)',
  }
})

export default KeyboardAccessoryView;
