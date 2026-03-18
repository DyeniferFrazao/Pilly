import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import styles from '../style/stylesingup';

const ButtonComponent = ({ onPress, title, buttonStyle, textStyle }) => {
  const isGreenButton = buttonStyle && buttonStyle.backgroundColor === '#62A4B0';
  
  return (
    <TouchableOpacity
      style={[styles.defaultButton, buttonStyle]}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={[styles.buttonText, isGreenButton && styles.createButtonText, textStyle]}>
        {title}
      </Text> 
    </TouchableOpacity>
  );
};

export default ButtonComponent;
