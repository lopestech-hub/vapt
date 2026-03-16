const fs = require('fs');
const path = require('path');

const content = `import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { cores, espacamento, raio, fonte } from '../theme';

const TECLAS = ['1','2','3','4','5','6','7','8','9','','0','DEL'];

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [etapa, setEtapa] = useState<'email' | 'pin'>('email');
  const [carregando, setCarregando] = useState(false);
  const login = useAuthStore((s) => s.login);

  function pressionarTecla(tecla: string) {
    if (carregando) return;
    if (tecla === 'DEL') { setPin((p) => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    const novoPin = pin + tecla;
    setPin(novoPin);
    if (novoPin.length === 4) entrar(novoPin);
  }

  async function entrar(pinDigitado: string) {
    setCarregando(true);
    try {
      await login(email.trim().toLowerCase(), pinDigitado);
    } catch {
      Alert.alert('PIN incorreto', 'Verifique o PIN e tente novamente.', [
        { text: 'OK', onPress: () => setPin('') },
      ]);
    } finally {
      setCarregando(false);
    }
  }

  function avancarParaPin() {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Atencao', 'Digite um e-mail valido.');
      return;
    }
    setEtapa('pin');
  }

  const Cabecalho = () => (
    <View style={s.cabecalho}>
      <View style={s.logo}>
        <Ionicons name="bicycle" size={40} color={cores.acento} />
      </View>
      <Text style={s.titulo}>MotoTrack</Text>
    </View>
  );

  if (etapa === 'email') {
    return (
      <SafeAreaView style={s.container}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.conteudo}>
            <Cabecalho />
            <Text style={s.subtitulo}>Area do Motoboy</Text>
            <View style={s.form}>
              <Text style={s.label}>Seu e-mail</Text>
              <View style={s.inputBox}>
                <Ionicons name="mail-outline" size={18} color={cores.textoMudo} style={{ marginRight: 8 }} />
                <TextInput
                  style={s.input}
                  placeholder="seu@email.com"
                  placeholderTextColor={cores.textoMudo}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={avancarParaPin}
                />
              </View>
              <TouchableOpacity style={s.botao} onPress={avancarParaPin} activeOpacity={0.85}>
                <Text style={s.botaoTexto}>Continuar</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={s.rodape}>Problemas para acessar? Fale com seu gestor.</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.conteudo}>
        <TouchableOpacity style={s.voltarBtn} onPress={() => { setEtapa('email'); setPin(''); }} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={20} color={cores.textoSecundario} />
          <Text style={s.voltarTexto}>{email}</Text>
        </TouchableOpacity>

        <Cabecalho />
        <Text style={s.subtitulo}>Digite seu PIN</Text>

        <View style={s.pinDots}>
          {[0,1,2,3].map((i) => (
            <View key={i} style={[s.dot, pin.length > i && s.dotAtivo]} />
          ))}
        </View>

        {carregando
          ? <View style={s.loadingPin}><ActivityIndicator color={cores.acento} size="large" /></View>
          : (
            <View style={s.teclado}>
              {TECLAS.map((tecla, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.tecla, tecla === '' && s.teclaVazia]}
                  onPress={() => pressionarTecla(tecla)}
                  activeOpacity={tecla ? 0.65 : 1}
                  disabled={!tecla}
                >
                  {tecla === 'DEL'
                    ? <Ionicons name="backspace-outline" size={24} color={cores.texto} />
                    : <Text style={s.teclaTexto}>{tecla}</Text>
                  }
                </TouchableOpacity>
              ))}
            </View>
          )
        }

        <Text style={s.rodape}>Problemas para acessar? Fale com seu gestor.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { flex: 1, paddingHorizontal: espacamento.base, paddingTop: espacamento.md, paddingBottom: espacamento.base },
  voltarBtn: { flexDirection: 'row', alignItems: 'center', gap: espacamento.sm, paddingVertical: espacamento.sm, marginBottom: espacamento.sm },
  voltarTexto: { fontSize: fonte.tamanhos.sm, color: cores.textoSecundario },
  cabecalho: { alignItems: 'center', marginTop: espacamento.xl, marginBottom: espacamento.sm },
  logo: { width: 72, height: 72, borderRadius: raio.lg, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda, alignItems: 'center', justifyContent: 'center', marginBottom: espacamento.base },
  titulo: { fontSize: fonte.tamanhos.xxl, fontWeight: fonte.pesos.bold, color: cores.texto, letterSpacing: -0.5 },
  subtitulo: { fontSize: 11, color: cores.textoSecundario, textAlign: 'center', fontWeight: fonte.pesos.medio, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: espacamento.xl },
  form: { gap: espacamento.base },
  label: { fontSize: fonte.tamanhos.sm, fontWeight: fonte.pesos.medio, color: cores.textoSecundario },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda, borderRadius: raio.md, height: 52, paddingHorizontal: espacamento.base },
  input: { flex: 1, fontSize: fonte.tamanhos.base, color: cores.texto },
  botao: { height: 56, backgroundColor: cores.acento, borderRadius: raio.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espacamento.sm, marginTop: espacamento.sm },
  botaoTexto: { color: '#fff', fontSize: fonte.tamanhos.base, fontWeight: fonte.pesos.semibold },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: espacamento.xl },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: cores.borda },
  dotAtivo: { backgroundColor: cores.acento, borderColor: cores.acento },
  loadingPin: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  teclado: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, paddingHorizontal: espacamento.xl },
  tecla: { width: 76, height: 76, borderRadius: 38, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda, alignItems: 'center', justifyContent: 'center' },
  teclaVazia: { backgroundColor: 'transparent', borderColor: 'transparent' },
  teclaTexto: { fontSize: 28, fontWeight: fonte.pesos.semibold, color: cores.texto },
  rodape: { textAlign: 'center', color: cores.textoMudo, fontSize: fonte.tamanhos.xs, marginTop: 'auto', paddingTop: espacamento.base },
});
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'screens', 'LoginScreen.tsx'), content, 'utf8');
console.log('LoginScreen.tsx escrito com sucesso!');
