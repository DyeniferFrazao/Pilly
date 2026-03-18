import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  icon: {
    width: 150,
    height: 150,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  switchLabelText: {
    color: '#000',
    fontFamily: 'System',
    fontSize: 14,
  },
  primaryButtonContainer: {
    marginBottom: 0,
  },
  transparentButtonContainer: {
    marginTop: 15,
  },
});

export default styles;
