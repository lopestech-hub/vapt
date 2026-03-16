import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { api } from '../services/api';
import { iniciarEnvioLocalizacao, pararEnvioLocalizacao } from '../services/localizacaoSocket';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cores, espacamento, raio, fonte, corStatus, labelStatus } from '../theme';
import { RootStackParamList } from '../navigation';

type Rota = RouteProp<RootStackParamList, 'DetalheEntrega'>;

interface Entrega {
  id: string;
  destinatario: string;
  endereco_entrega: string;
  status: string;
  descricao: string | null;
  foto_url: string | null;
  latitude: number | null;
  longitude: number | null;
  distancia_km: number | null;
  iniciada_em: string | null;
  concluida_em: string | null;
  criado_em: string;
}

export function DetalheEntregaScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rota>();
  const { usuario } = useAuthStore();
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const buscar = useCallback(async () => {
    try {
      const { data } = await api.get(`/entregas/${params.id}`);
      setEntrega(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a entrega.');
      navigation.goBack();
    } finally {
      setCarregando(false);
    }
  }, [params.id, navigation]);

  useEffect(() => { buscar(); }, [buscar]);

  async function iniciarEntrega() {
    // Captura GPS no momento de iniciar para calcular distância depois
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos da localização para registrar o início da entrega.');
      return;
    }

    try {
      setEnviando(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await api.put(`/entregas/${params.id}/iniciar`, {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      // Inicia envio de localização em tempo real para o gestor
      if (usuario?.motoboy_id) {
        const token = await AsyncStorage.getItem('access_token');
        if (token) iniciarEnvioLocalizacao(usuario.motoboy_id, params.id, token);
      }

      await buscar();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao iniciar entrega.');
    } finally {
      setEnviando(false);
    }
  }

  async function concluirComFoto() {
    // Solicitar permissões
    const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (camStatus !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à câmera para registrar a entrega.');
      return;
    }
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    if (locStatus !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à localização para registrar a entrega.');
      return;
    }

    // Abrir câmera
    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });

    if (resultado.canceled || !resultado.assets[0]) return;

    Alert.alert(
      'Confirmar entrega',
      'A foto será enviada com a localização atual. Confirmar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setEnviando(true);
              // Capturar GPS no momento da confirmação
              const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

              const formData = new FormData();
              formData.append('foto', {
                uri: resultado.assets[0].uri,
                name: 'prova.jpg',
                type: 'image/jpeg',
              } as any);
              formData.append('latitude', String(loc.coords.latitude));
              formData.append('longitude', String(loc.coords.longitude));

              await api.post(`/entregas/${params.id}/concluir`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });

              // Para o rastreamento ao concluir
              pararEnvioLocalizacao();

              await buscar();
              Alert.alert('Sucesso', 'Entrega concluída com sucesso!');
            } catch (err: any) {
              Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao concluir entrega.');
            } finally {
              setEnviando(false);
            }
          },
        },
      ],
    );
  }

  if (carregando || !entrega) {
    return (
      <View style={s.centro}>
        <ActivityIndicator color={cores.acento} size="large" />
      </View>
    );
  }

  const { cor, fundo } = corStatus(entrega.status);
  const isPendente = entrega.status === 'pendente';
  const isEmRota = entrega.status === 'em_rota';
  const isFinalizado = entrega.status === 'concluida' || entrega.status === 'cancelada';

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.voltarBtn} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={22} color={cores.texto} />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Entrega</Text>
        <View style={[s.badge, { backgroundColor: fundo }]}>
          <Text style={[s.badgeTexto, { color: cor }]}>{labelStatus(entrega.status)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Informações */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Destinatário</Text>
          <Text style={s.valor}>{entrega.destinatario}</Text>
        </View>

        <View style={s.divider} />

        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Endereço de Entrega</Text>
          <View style={s.enderecoRow}>
            <Ionicons name="location-outline" size={16} color={cores.acento} />
            <Text style={s.valor}>{entrega.endereco_entrega}</Text>
          </View>
        </View>

        {entrega.descricao ? (
          <>
            <View style={s.divider} />
            <View style={s.secao}>
              <Text style={s.secaoTitulo}>Observações</Text>
              <Text style={s.valor}>{entrega.descricao}</Text>
            </View>
          </>
        ) : null}

        {/* Foto de prova */}
        {entrega.foto_url ? (
          <>
            <View style={s.divider} />
            <View style={s.secao}>
              <Text style={s.secaoTitulo}>Foto de Comprovante</Text>
              <Image source={{ uri: entrega.foto_url }} style={s.foto} resizeMode="cover" />
              {entrega.latitude && entrega.longitude ? (
                <View style={s.gpsRow}>
                  <Ionicons name="navigate-outline" size={14} color={cores.textoMudo} />
                  <Text style={s.gpsTexto}>
                    {entrega.latitude.toFixed(6)}, {entrega.longitude.toFixed(6)}
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        {/* Registro de horários e distância */}
        {(entrega.iniciada_em || entrega.concluida_em || entrega.distancia_km) ? (
          <>
            <View style={s.divider} />
            <View style={s.secao}>
              <Text style={s.secaoTitulo}>Registro da Entrega</Text>
              {entrega.iniciada_em ? (
                <View style={s.infoRow}>
                  <Ionicons name="time-outline" size={15} color={cores.textoMudo} />
                  <Text style={s.infoLabel}>Iniciada em</Text>
                  <Text style={s.infoValor}>
                    {new Date(entrega.iniciada_em).toLocaleString('pt-BR')}
                  </Text>
                </View>
              ) : null}
              {entrega.concluida_em ? (
                <View style={s.infoRow}>
                  <Ionicons name="checkmark-circle-outline" size={15} color={cores.textoMudo} />
                  <Text style={s.infoLabel}>Concluída em</Text>
                  <Text style={s.infoValor}>
                    {new Date(entrega.concluida_em).toLocaleString('pt-BR')}
                  </Text>
                </View>
              ) : null}
              {entrega.distancia_km ? (
                <View style={s.infoRow}>
                  <Ionicons name="speedometer-outline" size={15} color={cores.textoMudo} />
                  <Text style={s.infoLabel}>Distância</Text>
                  <Text style={s.infoValor}>{entrega.distancia_km.toFixed(2)} km</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Botões de ação */}
      {!isFinalizado && (
        <View style={s.acoes}>
          {isPendente && (
            <TouchableOpacity
              style={[s.botao, s.botaoSecundario, enviando && { opacity: 0.6 }]}
              onPress={iniciarEntrega}
              activeOpacity={0.85}
              disabled={enviando}
            >
              {enviando
                ? <ActivityIndicator color={cores.acento} />
                : <>
                    <Ionicons name="bicycle-outline" size={20} color={cores.acento} />
                    <Text style={s.botaoTextoSec}>Iniciar Entrega</Text>
                  </>
              }
            </TouchableOpacity>
          )}
          {isEmRota && (
            <TouchableOpacity
              style={[s.botao, enviando && { opacity: 0.6 }]}
              onPress={concluirComFoto}
              activeOpacity={0.85}
              disabled={enviando}
            >
              {enviando
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="camera-outline" size={20} color="#fff" />
                    <Text style={s.botaoTexto}>Fotografar e Concluir</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: espacamento.base, paddingVertical: espacamento.md, borderBottomWidth: 1, borderBottomColor: cores.borda, gap: espacamento.sm },
  voltarBtn: { padding: 4 },
  headerTitulo: { flex: 1, fontSize: fonte.tamanhos.lg, fontWeight: fonte.pesos.bold, color: cores.texto },
  badge: { paddingHorizontal: espacamento.sm, paddingVertical: 3, borderRadius: raio.full },
  badgeTexto: { fontSize: fonte.tamanhos.xs, fontWeight: fonte.pesos.semibold },
  scroll: { padding: espacamento.base },
  secao: { gap: espacamento.sm },
  secaoTitulo: { fontSize: fonte.tamanhos.xs, fontWeight: fonte.pesos.semibold, color: cores.textoSecundario, textTransform: 'uppercase', letterSpacing: 1 },
  valor: { fontSize: fonte.tamanhos.base, color: cores.texto },
  enderecoRow: { flexDirection: 'row', gap: espacamento.sm, alignItems: 'flex-start' },
  divider: { height: 1, backgroundColor: cores.borda, marginVertical: espacamento.base },
  foto: { width: '100%', height: 220, borderRadius: raio.md, backgroundColor: cores.superficie },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: espacamento.sm },
  gpsTexto: { fontSize: 11, color: cores.textoMudo, fontVariant: ['tabular-nums'] },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: espacamento.sm },
  infoLabel: { flex: 1, fontSize: fonte.tamanhos.sm, color: cores.textoSecundario },
  infoValor: { fontSize: fonte.tamanhos.sm, color: cores.texto, fontWeight: fonte.pesos.semibold },
  acoes: { padding: espacamento.base, borderTopWidth: 1, borderTopColor: cores.borda, gap: espacamento.sm },
  botao: { height: 52, backgroundColor: cores.acento, borderRadius: raio.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espacamento.sm },
  botaoTexto: { color: '#fff', fontSize: fonte.tamanhos.base, fontWeight: fonte.pesos.semibold },
  botaoSecundario: { backgroundColor: 'transparent', borderWidth: 1, borderColor: cores.acento },
  botaoTextoSec: { color: cores.acento, fontSize: fonte.tamanhos.base, fontWeight: fonte.pesos.semibold },
});
