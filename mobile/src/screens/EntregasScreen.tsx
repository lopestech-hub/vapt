import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { cores, espacamento, raio, fonte, corStatus, labelStatus } from '../theme';
import { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

interface Entrega {
  id: string;
  destinatario: string;
  endereco_entrega: string;
  status: string;
  descricao: string | null;
  criado_em: string;
}

export function EntregasScreen() {
  const navigation = useNavigation<Nav>();
  const logout = useAuthStore((s) => s.logout);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const buscarEntregas = useCallback(async () => {
    try {
      const { data } = await api.get('/entregas/minhas');
      setEntregas(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as entregas.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => { buscarEntregas(); }, [buscarEntregas]);

  function onRefresh() {
    setAtualizando(true);
    buscarEntregas();
  }

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  }

  function renderItem({ item }: { item: Entrega }) {
    const { cor, fundo } = corStatus(item.status);
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.navigate('DetalheEntrega', { id: item.id })}
        activeOpacity={0.8}
      >
        <View style={s.cardTopo}>
          <Text style={s.destinatario} numberOfLines={1}>{item.destinatario}</Text>
          <View style={[s.badge, { backgroundColor: fundo }]}>
            <Text style={[s.badgeTexto, { color: cor }]}>{labelStatus(item.status)}</Text>
          </View>
        </View>
        <View style={s.cardRodape}>
          <Ionicons name="location-outline" size={14} color={cores.textoMudo} />
          <Text style={s.endereco} numberOfLines={1}>{item.endereco_entrega}</Text>
        </View>
        {item.descricao ? (
          <Text style={s.descricao} numberOfLines={2}>{item.descricao}</Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  if (carregando) {
    return (
      <View style={s.centro}>
        <ActivityIndicator color={cores.acento} size="large" />
      </View>
    );
  }

  const ativas = entregas.filter((e) => e.status !== 'concluida' && e.status !== 'cancelada');
  const historico = entregas.filter((e) => e.status === 'concluida' || e.status === 'cancelada');

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.titulo}>Minhas Entregas</Text>
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.75} style={s.sairBtn}>
          <Ionicons name="log-out-outline" size={22} color={cores.textoMudo} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...ativas, ...historico]}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.lista}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={cores.acento} />}
        ListHeaderComponent={
          entregas.length > 0 ? (
            <View style={s.resumo}>
              <View style={s.resumoItem}>
                <Text style={s.resumoNum}>{ativas.length}</Text>
                <Text style={s.resumoLabel}>Ativas</Text>
              </View>
              <View style={s.resumoDiv} />
              <View style={s.resumoItem}>
                <Text style={s.resumoNum}>{historico.length}</Text>
                <Text style={s.resumoLabel}>Concluídas</Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={s.vazio}>
            <Ionicons name="bicycle-outline" size={48} color={cores.textoMudo} />
            <Text style={s.vazioTexto}>Nenhuma entrega encontrada</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: espacamento.base, paddingVertical: espacamento.md, borderBottomWidth: 1, borderBottomColor: cores.borda },
  titulo: { fontSize: fonte.tamanhos.lg, fontWeight: fonte.pesos.bold, color: cores.texto },
  sairBtn: { padding: espacamento.sm },
  resumo: { flexDirection: 'row', backgroundColor: cores.superficie, borderRadius: raio.md, borderWidth: 1, borderColor: cores.borda, marginBottom: espacamento.base, padding: espacamento.base, alignItems: 'center', justifyContent: 'center' },
  resumoItem: { flex: 1, alignItems: 'center' },
  resumoNum: { fontSize: fonte.tamanhos.xl, fontWeight: fonte.pesos.bold, color: cores.acento },
  resumoLabel: { fontSize: fonte.tamanhos.xs, color: cores.textoSecundario, marginTop: 2 },
  resumoDiv: { width: 1, height: 36, backgroundColor: cores.borda },
  lista: { padding: espacamento.base, gap: espacamento.sm, flexGrow: 1 },
  card: { backgroundColor: cores.superficie, borderRadius: raio.md, borderWidth: 1, borderColor: cores.borda, padding: espacamento.base, gap: espacamento.sm },
  cardTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espacamento.sm },
  destinatario: { flex: 1, fontSize: fonte.tamanhos.base, fontWeight: fonte.pesos.semibold, color: cores.texto },
  badge: { paddingHorizontal: espacamento.sm, paddingVertical: 3, borderRadius: raio.full },
  badgeTexto: { fontSize: fonte.tamanhos.xs, fontWeight: fonte.pesos.semibold },
  cardRodape: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  endereco: { flex: 1, fontSize: fonte.tamanhos.sm, color: cores.textoSecundario },
  descricao: { fontSize: fonte.tamanhos.sm, color: cores.textoMudo },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espacamento.sm, paddingTop: espacamento.xxl },
  vazioTexto: { fontSize: fonte.tamanhos.base, color: cores.textoMudo },
});
