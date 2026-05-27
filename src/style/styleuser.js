import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,  // O conteúdo vai ocupar o restante do espaço
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 30,
    justifyContent: 'flex-start', // O conteúdo vai se alinhar no topo
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
    marginTop :-30,
  },
  headerText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'System',
    fontWeight: 'bold',
  },
  subHeader: {
    width: 80,
    height: 23,
    backgroundColor: '#2E7D8A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
    marginTop: 20,
  },
  subHeaderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardContainer: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  card: {
    marginVertical: 10,
    width: '90%',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cardSpacing: {
    marginBottom: 20,
  },
  profileImage: {
    width: 63,
    height: 63,
    resizeMode: 'contain',
    marginRight: 20,
  },
  // Nome do perfil — destaque principal
  usernameText: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
    marginLeft: 4,
  },
  // Bio do perfil — informação secundária
  bioText: {
    fontSize: 13,
    color: '#2E7D8A',
    marginTop: 6,
    marginLeft: 4,
  },
  medicationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 30,
  },
  medicationText: {
    width: 85,
    height: 20,
    borderWidth: 1,
    borderColor: '#62A4B0',
    color: '#8D989C',
    textAlign: 'center',
    borderRadius: 50,
    marginBottom: 5,
    marginRight: 3,
    marginLeft: 3,
    fontSize: 12,
  },
  addButton: {
    width: 200,
    height: 57,
    backgroundColor: '#62A4B0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 20,  // Ajusta o espaçamento vertical entre o conteúdo e o botão
    marginTop: 20, // Ajuste a margem superior para evitar que o botão suba demais
    position: 'absolute', // Faz o botão ficar fixo na parte inferior
    bottom: 90, // Distância do botão do fundo da tela
  },
  
  
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
 
});

export default styles;
