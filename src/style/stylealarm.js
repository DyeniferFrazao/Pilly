import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1, // Faz o container ocupar toda a altura disponível
    justifyContent: 'center',  // Centraliza os elementos verticalmente
    alignItems: 'center',      // Centraliza os elementos horizontalmente
    backgroundColor: '#F0F0F0', // Cor de fundo da tela
  },
  cardContainer: {
    width: 330,
    height: 572,
    backgroundColor: '#C8EDF2',
    borderRadius: 10, // Bordas arredondadas para o contêiner
    justifyContent: 'center',  // Centraliza os elementos dentro do contêiner
    alignItems: 'center',      // Centraliza os elementos horizontalmente
    padding: 20,
  },
  title: {
    fontSize: 20,
    color: '#1D6B78',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  timeDisplay: {
    backgroundColor: '#4A7A82',
    borderRadius: 10,
    padding: 10,
    marginVertical: 15,
  },
  timeText: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  intervals: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
    width: '100%', // Garante que a área dos botões ocupe toda a largura disponível
  },
  intervalButton: {
    backgroundColor: '#1D6B78',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  selectedButton: {
    backgroundColor: '#1D6B78',
  },
  intervalText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#1D6B78',
    marginTop: 10,
  },
  alarm: {
    fontSize: 16,
    color: '#4A7A82',
  },
  buttonContainer: {
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'column',  // Coloca os botões em coluna
    justifyContent: 'center', // Centraliza os botões verticalmente
    alignItems: 'center',     // Centraliza os botões horizontalmente
    marginTop: 20,            // Espaço acima dos botões
  },
  button: {
    width: 200,
    height: 50,
    backgroundColor: '#1D6B78',
    borderRadius: 10, // Bordas arredondadas no botão
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10, // Espaçamento de 10px entre os botões
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  
});

export default styles;
