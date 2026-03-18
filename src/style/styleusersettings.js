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
  card: {
    width: 316,
    height: 400,
    backgroundColor: '#F3F3F3',
    alignSelf: 'center',
    marginTop: 80,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 20,
    justifyContent: 'space-between', // Distribui o conteúdo verticalmente
  },
  cameraContainer: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    
  },
  textContainer: {
    alignItems: 'center', // Centraliza os textos no eixo horizontal
    marginTop:-80,
    
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000',
    fontFamily: 'System',
    fontSize:16,
    marginTop:30,
  },
  
  bottomBar: {
    width: '100%',
    height: 57,
    backgroundColor: '#afd0d6',
    position: 'absolute',
    bottom: 0,  // Fixa a barra no final da tela
  },
  logoutContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    left: 30, // Alinha o botão à esquerda
    bottom: 70, // Distância da parte inferior (ajustado para visibilidade)
    backgroundColor: 'transparent', // Fundo transparente
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  logoutText: {
    color: '#62A4B0', // Cor do texto em preto
    fontSize: 20,
    marginLeft: 10, // Deu certo tudoooooo 
  },
  deleteText: {
    color: '#62A4B0', // Cor do texto em preto
    fontSize: 14,
    marginLeft: 39, // Deu certo tudoooooo 
    marginTop:-23,
  },
  uploadButtonInsideCard: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#62A4B0',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginTop:15,
  },
  uploadButtonText: {
    fontWeight: 'bold', // Negrito
    fontFamily: 'System', // Fonte padrão
    color: '#fff', // Cor preta
    fontSize: 14, // Tamanho da fonte ajustável
  },
});

export default styles;
