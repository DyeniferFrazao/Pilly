// notificationstyle.js
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    width: '100%',
    height: 57,
    backgroundColor: '#60A2AE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 30,
  },
  headerText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'System',
  },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  nextAlarmText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    fontFamily: 'System',
  },
  notificationCard: {
    width: 309,
    height: 71,
    backgroundColor: '#F3F3F3',
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardText: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'System',
  },
  switchSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
    marginTop: 0, 
  },
  switchText: {
    fontSize: 18,
    color: '#666',
    fontFamily: 'System',
  },
  bottomBar: {
    width: '100%',
    height: 57,
    backgroundColor: '#afd0d6',
    position: 'absolute',
    bottom: 50, 
  },
});

export default styles;
