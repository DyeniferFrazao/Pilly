import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import StackNavigator from './src/routes/StackNavigator';
import { configurarNotificacoes, adiarDose } from './src/services/alarmService';
import { registrarDose } from './src/services/medicService';
import MedicacaoAlertModal from './src/components/MedicacaoAlertModal';

// Handler de notificações em foreground
// Banner suprimido (o modal in-app substitui), mas som e badge ficam ativos
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,   // modal in-app é mais bonito que o banner nativo
    shouldShowList:   true,    // aparece na central de notificações
    shouldPlaySound:  true,    // som sempre toca
    shouldSetBadge:   true,    // atualiza contador no ícone do app
  }),
});

const App = () => {
  const navigationRef    = useRef(null);
  const responseListener = useRef(null);
  const notifListener    = useRef(null);

  // Estado do modal in-app
  const [modalVisible, setModalVisible]   = useState(false);
  const [modalData,    setModalData]      = useState(null);

  const fecharModal = () => {
    setModalVisible(false);
    setModalData(null);
  };

  const handleTomei = async () => {
    fecharModal();
    if (!modalData) return;
    const { medicationId, userId, perfilId, horarioPrevisto } = modalData;
    try {
      await registrarDose(medicationId, userId, 'tomado', perfilId, horarioPrevisto);
    } catch (e) {
      console.warn('[Pilly] Erro ao registrar dose via modal:', e.message);
    }
  };

  const handleAdiar = async () => {
    fecharModal();
    if (!modalData) return;
    const { medicationId, medicationName, perfilId, userId } = modalData;
    try {
      await adiarDose(medicationName, medicationId, perfilId, userId, 10);
    } catch (e) {
      console.warn('[Pilly] Erro ao adiar dose:', e.message);
    }
  };

  useEffect(() => {
    // 1. Configura permissões, canal Android e categoria de ações
    configurarNotificacoes().catch(console.error);

    // 2. Notificação RECEBIDA com app em foreground → mostra modal in-app
    notifListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data ?? {};
        if (data.medicationId) {
          setModalData(data);
          setModalVisible(true);
        }
      }
    );

    // 3. Resposta às ações dos botões da notificação (app em background/fechado)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const { actionIdentifier, notification } = response;
        const data = notification.request.content.data ?? {};
        const {
          medicationId,
          medicationName,
          perfilId,
          userId,
          horarioPrevisto,
        } = data;

        if (actionIdentifier === 'TOMEI') {
          try {
            await registrarDose(medicationId, userId, 'tomado', perfilId, horarioPrevisto);
          } catch (e) {
            console.warn('[Pilly] Erro ao registrar dose via notificação:', e.message);
          }
        } else if (actionIdentifier === 'ADIAR') {
          try {
            await adiarDose(medicationName, medicationId, perfilId, userId, 10);
          } catch (e) {
            console.warn('[Pilly] Erro ao adiar dose:', e.message);
          }
        } else {
          // Toque padrão na notificação → abre modal se tiver dados de medicamento
          if (data.medicationId) {
            setModalData(data);
            setModalVisible(true);
          } else if (navigationRef.current?.isReady()) {
            navigationRef.current.navigate('Home');
          }
        }
      }
    );

    return () => {
      notifListener.current?.remove?.();
      responseListener.current?.remove?.();
    };
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <StackNavigator />
      </NavigationContainer>

      {/* Modal in-app de alerta de medicação */}
      <MedicacaoAlertModal
        visible={modalVisible}
        medicationName={modalData?.medicationName ?? ''}
        onTomei={handleTomei}
        onAdiar={handleAdiar}
        onDismiss={fecharModal}
      />
    </AuthProvider>
  );
};

export default App;
