import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { useAuthStore } from '../store/authStore';
import { cores } from '../theme';
import { registrarPushToken } from '../services/notificacoes';

import { LoginScreen } from '../screens/LoginScreen';
import { EntregasScreen } from '../screens/EntregasScreen';
import { DetalheEntregaScreen } from '../screens/DetalheEntregaScreen';
import { ManutencaoScreen } from '../screens/ManutencaoScreen';
import { AbastecimentoScreen } from '../screens/AbastecimentoScreen';

// Tipos das rotas
export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  DetalheEntrega: { id: string };
};

type TabParamList = {
  Entregas: undefined;
  Abastecimento: undefined;
  Manutencao: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabsApp() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: cores.superficie,
          borderTopColor: cores.borda,
          borderTopWidth: 1,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarActiveTintColor: cores.acento,
        tabBarInactiveTintColor: cores.textoMudo,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="Entregas"
        component={EntregasScreen}
        options={{
          tabBarLabel: 'Entregas',
          tabBarIcon: ({ color, size }) => <Ionicons name="bicycle-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Abastecimento"
        component={AbastecimentoScreen}
        options={{
          tabBarLabel: 'Combustível',
          tabBarIcon: ({ color, size }) => <Ionicons name="water-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Manutencao"
        component={ManutencaoScreen}
        options={{
          tabBarLabel: 'Manutenção',
          tabBarIcon: ({ color, size }) => <Ionicons name="construct-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function Navegacao() {
  const usuario = useAuthStore((s) => s.usuario);
  const carregando = useAuthStore((s) => s.carregando);
  const carregarSessao = useAuthStore((s) => s.carregarSessao);
  const listenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => { carregarSessao(); }, [carregarSessao]);

  // Registra push token e listener ao fazer login
  useEffect(() => {
    if (!usuario) {
      listenerRef.current?.remove();
      listenerRef.current = null;
      return;
    }

    registrarPushToken();

    // Ouve notificações com app em foreground
    listenerRef.current = Notifications.addNotificationReceivedListener(() => {
      // A notificação já aparece automaticamente via setNotificationHandler
      // Aqui podemos futuramente atualizar a lista de entregas
    });

    return () => {
      listenerRef.current?.remove();
      listenerRef.current = null;
    };
  }, [usuario]);

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo }}>
        <ActivityIndicator color={cores.acento} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {usuario ? (
          <>
            <Stack.Screen name="MainTabs" component={TabsApp} />
            <Stack.Screen
              name="DetalheEntrega"
              component={DetalheEntregaScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
