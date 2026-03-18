import { StyleSheet } from 'react-native';

const stylehome = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    width: '100%',
    height: 57,
    backgroundColor: '#60A2AE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'System',
    fontWeight: 'bold',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  cardSpacing: {
    marginBottom: 9,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardImage: {
    width: 83,
    height: 83,
    resizeMode: 'contain',
    marginRight: 15,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: 'System',
    color: '#000',
    lineHeight: 20,
  },
  cardDetails: {
    fontSize: 14,
    fontFamily: 'System',
    color: '#000',
    lineHeight: 20,
    marginBottom: 5,
  },
  highlight: {
    color: '#C25B8C',
    fontWeight: 'bold',
  },
 
});

export default stylehome;
