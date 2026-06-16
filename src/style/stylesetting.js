import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  header: {
    width: '100%',  
    height: 57,  
    backgroundColor: '#1D6B78',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerText: {
    flex: 1,  
    fontSize: 16,  
    color: '#FFFFFF',
    fontFamily: 'System',
    fontWeight: 'bold', 
    textAlign: 'center',  
  },
  button: {
    width: 341,
    height: 60,
    backgroundColor: '#1D6B78',
    borderRadius: 10,
    flexDirection: 'row',  
    alignItems: 'center',  
    paddingHorizontal: 15,
    marginHorizontal: 20,  
    marginTop: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 15,  
    fontFamily: 'System',
    
  },
  bottomBar: {
    width: '100%',  
    height: 57,
    backgroundColor: '#C8EDF2',
    position: 'absolute',
    bottom: 50,  
  },
});
