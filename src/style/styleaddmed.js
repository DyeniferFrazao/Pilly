import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',  // Centraliza horizontalmente todos os itens no container
    marginTop:-30,
  },
  header: {
    width: '100%',
    height: 57,
    backgroundColor: '#60A2AE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    marginBottom: 70,
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
    marginLeft: 10,
    flex: 1,
    textAlign: 'center',
  },
  closeIcon: {
    position: 'absolute',
    left: 10,
  },
  input: {
    width: 312,
    height: 47,
    backgroundColor: '#F3F3F3',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 10,
    fontFamily: 'System',
    color: '#000',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 0,
    alignSelf: 'center',  // Centraliza horizontalmente o input individualmente
  },
  pickerContainer: {
    marginBottom: 20,
    width: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignSelf: 'center',  // Centraliza o picker individualmente
  },
  picker: {
    width: '10%',
    height: 417,
    borderRadius: 25,
    backgroundColor: '#F3F3F3',
    paddingHorizontal: 20,
    fontFamily: 'System',
    marginBottom: 9,
    
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,  // Ajustado para controle manual do espaçamento entre os elementos
    paddingHorizontal: 80, // Ajusta o espaçamento à esquerda/direita
    marginTop :-10,
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: 'System',
    color: '#333',
    textAlign: 'center',
    flex: 1,
    marginRight: 10,
    marginTop :-10,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  frequencyButton: {
    width: 312,
    height: 57,
    backgroundColor: '#62A4B0',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20,
    marginBottom:35,  // Alterado para 9px de espaçamento abaixo do botão Frequência
    alignSelf: 'center',  // Centraliza o botão de frequência individualmente
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'System',
    fontSize: 20,
    marginRight: 10,
  },
  frequencyIcon: {
    marginLeft: 0,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10, // Ajuste do footer
  },
  secondaryButtonsContainer: {
  flexDirection: 'row',
  justifyContent: 'center', // Centraliza os botões horizontalmente
  alignItems: 'center', // Garante que os itens fiquem alinhados verticalmente no centro
  width: '100%',
  paddingHorizontal: 30,
  paddingVertical: 5,
  marginTop: 20, // Move o container para cima (ajuste o valor conforme necessário)
},
});

export default styles;
