import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { cores, espacamento, raio, fonte } from '../theme';

const TIPOS = [
  { valor: 'pneu', label: 'Pneu', icone: 'ellipse-outline' as const },
  { valor: 'freio', label: 'Freio', icone: 'disc-outline' as const },
  { valor: 'motor', label: 'Motor', icone: 'settings-outline' as const },
  { valor: 'eletrica', label: 'Elétrica', icone: 'flash-outline' as const },
  { valor: 'revisao', label: 'Revisão', icone: 'build-outline' as const },
  { valor: 'outro', label: 'Outro', icone: 'construct-outline' as const },
];

export function ManutencaoScreen() {
  const [tipo, setTipo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [urgente, setUrgente] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function handleEnviar() {
    if (!tipo) { Alert.alert('Atenção', 'Selecione o tipo de manutenção.'); return; }
    if (!descricao.trim()) { Alert.alert('Atenção', 'Descreva o problema.'); return; }

    try {
      setEnviando(true);
      await api.post('/manutencoes', { tipo, descricao: descricao.trim(), urgente });
      Alert.alert('Solicitação enviada', 'Seu gestor será notificado sobre o problema.', [
        { text: 'OK', onPress: () => { setTipo(''); setDescricao(''); setUrgente(false); } },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao enviar solicitação.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.titulo}>Manutenção</Text>
        <Text style={s.subtitulo}>Solicite reparo para sua moto</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Tipo */}
        <View style={s.secao}>
          <Text style={s.label}>Tipo de Problema</Text>
          <View style={s.grid}>
            {TIPOS.map((t) => {
              const ativo = tipo === t.valor;
              return (
                <TouchableOpacity
                  key={t.valor}
                  style={[s.tipoBtn, ativo && s.tipoBtnAtivo]}
                  onPress={() => setTipo(t.valor)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={t.icone} size={22} color={ativo ? cores.acento : cores.textoMudo} />
                  <Text style={[s.tipoLabel, ativo && s.tipoLabelAtivo]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Descrição */}
        <View style={s.secao}>
          <Text style={s.label}>Descrição do Problema</Text>
          <TextInput
            style={s.textarea}
            placeholder="Descreva o problema com detalhes..."
            placeholderTextColor={cores.textoMudo}
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Urgente */}
        <View style={s.urgenteRow}>
          <View style={s.urgenteInfo}>
            <Ionicons name="warning-outline" size={20} color={cores.aviso} />
            <View>
              <Text style={s.urgenteLabel}>Urgente</Text>
              <Text style={s.urgenteDesc}>Moto impossibilitada de trabalhar</Text>
            </View>
          </View>
          <Switch
            value={urgente}
            onValueChange={setUrgente}
            trackColor={{ false: cores.borda, true: cores.acento + '60' }}
            thumbColor={urgente ? cores.acento : cores.textoMudo}
          />
        </View>

        {urgente && (
          <View style={s.avisoUrgente}>
            <Ionicons name="alert-circle-outline" size={16} color={cores.aviso} />
            <Text style={s.avisoUrgenteTexto}>O gestor será notificado imediatamente.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.botao, enviando && { opacity: 0.6 }]}
          onPress={handleEnviar}
          activeOpacity={0.85}
          disabled={enviando}
        >
          {enviando
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="send-outline" size={20} color="#fff" />
                <Text style={s.botaoTexto}>Enviar Solicitação</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  header: { paddingHorizontal: espacamento.base, paddingVertical: espacamento.md, borderBottomWidth: 1, borderBottomColor: cores.borda },
  titulo: { fontSize: fonte.tamanhos.lg, fontWeight: fonte.pesos.bold, color: cores.texto },
  subtitulo: { fontSize: fonte.tamanhos.sm, color: cores.textoSecundario, marginTop: 2 },
  scroll: { padding: espacamento.base, gap: espacamento.lg },
  secao: { gap: espacamento.sm },
  label: { fontSize: fonte.tamanhos.sm, fontWeight: fonte.pesos.medio, color: cores.textoSecundario },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: espacamento.sm },
  tipoBtn: { flexBasis: '30%', flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: espacamento.xs, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda, borderRadius: raio.md, paddingVertical: espacamento.md },
  tipoBtnAtivo: { borderColor: cores.acento, backgroundColor: cores.acento + '15' },
  tipoLabel: { fontSize: fonte.tamanhos.sm, color: cores.textoMudo },
  tipoLabelAtivo: { color: cores.acento, fontWeight: fonte.pesos.medio },
  textarea: { backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda, borderRadius: raio.md, paddingHorizontal: espacamento.base, paddingVertical: espacamento.md, minHeight: 100, fontSize: fonte.tamanhos.base, color: cores.texto },
  urgenteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda, borderRadius: raio.md, paddingHorizontal: espacamento.base, paddingVertical: espacamento.md },
  urgenteInfo: { flexDirection: 'row', alignItems: 'center', gap: espacamento.sm },
  urgenteLabel: { fontSize: fonte.tamanhos.base, fontWeight: fonte.pesos.medio, color: cores.texto },
  urgenteDesc: { fontSize: fonte.tamanhos.xs, color: cores.textoMudo },
  avisoUrgente: { flexDirection: 'row', alignItems: 'center', gap: espacamento.sm, backgroundColor: cores.aviso + '15', borderRadius: raio.md, padding: espacamento.md },
  avisoUrgenteTexto: { fontSize: fonte.tamanhos.sm, color: cores.aviso, flex: 1 },
  botao: { height: 52, backgroundColor: cores.acento, borderRadius: raio.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espacamento.sm, marginTop: espacamento.sm },
  botaoTexto: { color: '#fff', fontSize: fonte.tamanhos.base, fontWeight: fonte.pesos.semibold },
});
