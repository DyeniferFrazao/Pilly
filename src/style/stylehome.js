// stylehome.js
// Mantido para compatibilidade com imports existentes.
// Os estilos principais da nova HomeScreen estão inline no HomeScreen.js
// usando StyleSheet.create() local — padrão mais sustentável para
// componentes que têm muitas variantes de estilo.

import { StyleSheet } from 'react-native';

const stylehome = StyleSheet.create({
  // Legado — não usado pela nova HomeScreen,
  // mas mantido para evitar erro caso outro arquivo importe este módulo.
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
});

export default stylehome;
