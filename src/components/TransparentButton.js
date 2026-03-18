import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const TransparentButton = ({ title, onPress }) => {
  const [isPressed, setIsPressed] = useState(false); 

  return (
    <TouchableOpacity
      style={[styles.button, isPressed && styles.pressedButton]} 
      onPressIn={() => setIsPressed(true)} 
      onPressOut={() => setIsPressed(false)} 
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 286,
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#62A4B0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  pressedButton: {
    backgroundColor: '#62A4B0', 
  },
  buttonText: {
    color: '#62A4B0',
    fontSize: 14,
    fontFamily: 'System',
  },
});

export default TransparentButton;
