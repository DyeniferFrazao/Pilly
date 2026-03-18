import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center', // Centraliza o conteúdo horizontalmente
  },
  header: {
    width: '100%',
    height: 57,
    backgroundColor: '#60A2AE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    position: 'absolute',
    top: 30,
  },
  headerText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'System',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    width: 316,
    height: 491,
    backgroundColor: '#F3F3F3',
    borderRadius: 34,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 120, 
  },
  formContainer: {
    width: '100%',
    alignItems: 'center', // Centraliza os itens horizontalmente
    marginTop: 80, // Adicione esta linha para ajustar a posição vertical
  },
  
  input: {
    width: 280, // Nova largura ajustada
    height: 47,
    backgroundColor: '#F3F3F3',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 20, // Espaçamento entre inputs ajustado
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    fontFamily: 'System',
    color: '#000',
  },
  saveButton: {
    width: 300,
    height: 45,
    backgroundColor: '#62A4B0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginTop: 80,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  cancelButton: {
    width: 300,
    height: 45,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#62A4B0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginTop: 10,
  },
  cancelButtonText: {
    color:  '#62A4B0',
    fontSize: 16,
  },
  deleteButton: {
    width: 200,
    height: 75,
    backgroundColor: '#62A4B0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    marginTop: 50, // Espaçamento para separá-lo do card
  },
  
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default styles;
