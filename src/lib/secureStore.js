import * as SecureStore from 'expo-secure-store';

// Salva token ou credencial com criptografia nativa do dispositivo
export async function salvarSeguro(chave: string, valor: string) {
  await SecureStore.setItemAsync(chave, valor);
}

export async function lerSeguro(chave: string): Promise<string | null> {
  return await SecureStore.getItemAsync(chave);
}

export async function removerSeguro(chave: string) {
  await SecureStore.deleteItemAsync(chave);
}
