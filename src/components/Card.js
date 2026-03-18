import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

const Card = ({ children, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 309,
    height: 190,
    backgroundColor: '#F3F3F3',  
    borderRadius: 34,            
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 15,
    justifyContent: 'center',  
  },
});

export default Card;
