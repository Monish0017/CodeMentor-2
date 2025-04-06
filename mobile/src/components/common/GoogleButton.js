import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

const GoogleButton = ({ onPress, title = 'Continue with Google', disabled = false }) => {
  return (
    <TouchableOpacity 
      style={[styles.googleButton, disabled && styles.disabledButton]} 
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.googleIconContainer}>
        <Text style={styles.googleIconText}>G</Text>
      </View>
      <Text style={styles.googleButtonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    flexDirection: 'row',
  },
  disabledButton: {
    opacity: 0.7,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  googleIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GoogleButton;
