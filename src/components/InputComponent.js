import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

const InputComponent = ({ placeholder, width = 312, height = 47, multiline = false, style, ...props }) => {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#999"
      style={[styles.input, { width, height }, multiline && styles.multiline, style]}
      multiline={multiline}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#F3F3F3',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    fontFamily: 'System',
    color: '#000',
  },
  multiline: {
    textAlignVertical: 'top', 
  },
});

export default InputComponent;
