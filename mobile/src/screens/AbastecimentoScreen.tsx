import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { cores, espacamento, raio, fonte } from '../theme';

export function AbastecimentoScreen() {
  const [litros, setLitros] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [kmAtual, setKmAtual] = useState('');
  const [posto, setPosto] = useState('');
  const [enviando, setEnviando] = useState(false);

  function formatarMoeda(texto: string) {
    // Remove tudo que não é dígito
    const numerico = texto.replace(/\D/g, '');
    if (!numerico) return '';
    const valor = parseInt(numerico, 10) / 100;
    return valor.toFixed(2).replace('.', ',');
  }

  function onChangeValor(texto: string) {
    const numerico = texto.replace(/\D/g, '');
    if (!numerico) { setValorTotal(''); return; }
    const valor = parseInt(numerico, 10) / 100;
    setValorTotal(valor.toFixed(2).replace('.', ','));
  }

  function valorParaNumero(texto: string): number {
    return parseFloat(texto.replace(',', '.')) || 0;
  }

  function calcularPrecoLitro(): string {
    const l = parseFloat(litros.replace(',', '.'));
    const v = valorParaNumero(valorTotal);
    if (!l || !v) return '—';
    return `R$ ${(v / l).toFixed(3).replace('.', ',')}`;
  }

  async function handleEnviar() {
    const litrosNum = parseFloat(litros.replace(',', '.'));
    const valorNum = valorParaNumero(valorTotal);
    const kmNum = parseInt(kmAtual, 10);

    if (!litros || isNaN(litrosNum) || litrosNum <= 0) { Alert.alert('Atenção', 'Informe os litros abastecidos.'); return; }
    if (!valorTotal || isNaN(valorNum) || valorNum <= 0) { Alert.alert('Atenção', 'Informe o valor total.'); return; }
    if (!kmAtual || isNaN(kmNum) || kmNum <= 0) { Alert.alert('Atenção', 'Informe a quilometragem atual.'); return; }

    try {
      setEnviando(true);
      await api.post('/abastecimentos', {
        litros: litrosNum,
        valor_total: valorNum,
        km_atual: kmNum,
        posto: posto.trim() || null,
      });
      Alert.alert('Registrado!', 'Abastecimento registrado com sucesso.', [
        { text: 'OK', onPress: () => { setLitros(''); setValorTotal(''); setKmAtual(''); setPosto(''); } },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao registrar abastecimento.');
    } finally {
      setEnviando(false);
    }
  }

  const precoLitro = calcularPrecoLitro();

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.titulo}>Abastecimento</Text>
        <Text style={s.subtitulo}>Registre o abastecimento da moto</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Litros */}
          <View style={s.campo}>
            <Text style={s.label}>Litros Abastecidos</Text>
            <View style={s.inputBox}>
              <Ionicons name="water-outline" size={18} color={cores.textoMudo} style={{ marginRight: 8 }} />
              <TextInput
                style={s.input}
                placeholder="Ex: 8,5"
                placeholderTextColor={cores.textoMudo}
                value={litros}
                onChangeText={setLitros}
                keyboardType="decimal-pad"
              />
              <Text style={s.unidade}>L</Text>
            </View>
          </View>

          {/* Valor Total */}
          <View style={s.campo}>
            <Text style={s.label}>Valor Total Pago</Text>
            <View style={s.inputBox}>
              <Text style={s.prefix}>R$</Text>
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="0,00"
                placeholderTextColor={cores.textoMudo}
                value={valorTotal}
                onChangeText={onChangeValor}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* KM Atual */}
          <View style={s.campo}>
            <Text style={s.label}>Quilometragem Atual</Text>
            <View style={s.inputBox}>
              <Ionicons name="speedometer-outline" size={18} color={cores.textoMudo} style={{ marginRight: 8 }} />
              <TextInput
                style={s.input}
                placeholder="Ex: 12500"
                placeholderTextColor={cores.textoMudo}
                value={kmAtual}
                onChangeText={(t) => setKmAtual(t.replace(/\D/g, ''))}
                keyboardType="numeric"
              />
              <Text style={s.unidade}>km</Text>
            </View>
          </View>

          {/* Posto (opcional) */}
          <View style={s.campo}>
            <Text style={s.label}>Nome do Posto <Text style={s.opcional}>(opcional)</Text></Text>
            <View style={s.inputBox}>
              <Ionicons name="location-outline" size={18} color={cores.textoMudo} style={{ marginRight: 8 }} />
              <TextInput
                style={s.input}
                placeholder="Ex: Shell Av. Paulista"
                placeholderTextColor={cores.textoMudo}
                value={posto}
                onChangeText={setPosto}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Resumo */}
          {litros && valorTotal ? (
            <View style={s.resumo}>
              <View style={s.resumoItem}>
                <Text style={s.resumoLabel}>Preço / Litro</Text>
                <Text style={s.resumoValor}>{precoLitro}</Text>
              </View>
              <View style={s.resumoDiv} />
              <View style={s.resumoItem}>
                <Text style={s.resumoLabel}>Litros</Text>
                <Text style={s.resumoValor}>{litros || '—'} L</Text>
              </View>
              <View style={s.resumoDiv} />
              <View style={s.resumoItem}>
                <Text style={s.resumoLabel}>Total</Text>
                <Text style={[s.resumoValor, { color: cores.acento }]}>R$ {valorTotal || '—'}</Text>
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.botao, enviando && { opacity: 0.6 }]}
            onPress={handleEnviar}
            activeOpacity={0.85}
            disabled={enviando}
          >
            {enviando
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={s.botaoTexto}>Registrar Abastecimento</Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  header: { paddingHorizontal: espacamento.base, paddingVertical: espacamento.md, borderBottomWidth: 1, borderBottomColor: cores.borda },
  titulo: { fontSize: fonte.tamanhos.lg, fontWeight: fonte.pesos.bold, color: cores.texto },
  subtitulo: { fontSize: fonte.tamanhos.sm, color: cores.textoSecundario, marginTop: 2 },
  scroll: { padding: espacamento.base, gap: espacamento.base },
  campo: { gap: espacamento.sm },
  label: { fontSize: fonte.tamanhos.sm, fontWeight: fonte.pesos.medio, color: cores.textoSecundario },
  opcional: { fontWeight: fonte.pesos.regular, color: cores.textoMudo },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda, borderRadius: raio.md, height: 52, paddingHorizontal: espacamento.base },
  input: { flex: 1, fontSize: fonte.tamanhos.base, color: cores.texto },
  unidade: { fontSize: fonte.tamanhos.sm, color: cores.textoMudo, marginLeft: 8 },
  prefix: { fontSize: fonte.tamanhos.base, color: cores.textoMudo, marginRight: 8, fontWeight: fonte.pesos.medio },
  resumo: { flexDirection: 'row', backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda, borderRadius: raio.md, padding: espacamento.base, alignItems: 'center' },
  resumoItem: { flex: 1, alignItems: 'center', gap: 4 },
  resumoLabel: { fontSize: fonte.tamanhos.xs, color: cores.textoMudo },
  resumoValor: { fontSize: fonte.tamanhos.base, fontWeight: fonte.pesos.semibold, color: cores.texto },
  resumoDiv: { width: 1, height: 32, backgroundColor: cores.borda },
  botao: { height: 52, backgroundColor: cores.acento, borderRadius: raio.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espacamento.sm, marginTop: espacamento.sm },
  botaoTexto: { color: '#fff', fontSize: fonte.tamanhos.base, fontWeight: fonte.pesos.semibold },
});
