# 📘 Manual do Usuário — SENAI IR HMI (G.Paniz AE25G2)

**Aplicativo de Monitoramento de Temperatura para Amassadeiras Industriais**

> Este manual foi escrito para operadores e usuários sem conhecimento técnico.
> Ele explica, passo a passo, como usar todas as telas e funções do aplicativo.

---

## 📋 Índice

1. [O que é este aplicativo?](#1--o-que-é-este-aplicativo)
2. [Como acessar o aplicativo](#2--como-acessar-o-aplicativo)
3. [Visão geral da tela](#3--visão-geral-da-tela)
4. [Tela de Monitoramento](#4--tela-de-monitoramento)
5. [Tela de Programação](#5--tela-de-programação)
6. [Tela de Modos](#6--tela-de-modos)
7. [Tela de Receitas](#7--tela-de-receitas)
8. [Conexão IoT (Simulador e MQTT)](#8--conexão-iot-simulador-e-mqtt)
9. [Calibração de Campo](#9--calibração-de-campo)
10. [Perguntas Frequentes (FAQ)](#10--perguntas-frequentes-faq)
11. [Glossário de Termos](#11--glossário-de-termos)

---

## 1. 🔍 O que é este aplicativo?

Este aplicativo é um **painel de controle digital** (também chamado de HMI — Interface Homem-Máquina) para monitorar e gerenciar a temperatura da massa durante o processo de mistura em **amassadeiras industriais G.Paniz AE25G2**.

### O que ele faz:

- 🌡️ **Mostra a temperatura da massa** em tempo real, medida por um sensor infravermelho (MLX90614) conectado a um microcontrolador ESP32-S3
- ⏱️ **Controla o tempo do ciclo de mistura** — mostrando quanto tempo falta para terminar
- ⚠️ **Alerta quando a temperatura sobe demais** — para que o operador possa agir (ex.: adicionar água gelada)
- 🔴 **Permite parada de emergência** — para segurança da operação
- 📖 **Gerencia receitas** — cada tipo de massa tem tempos e temperaturas diferentes

### Onde funciona:

O aplicativo funciona em qualquer dispositivo com navegador de internet:
- ✅ Computador (Windows, Mac, Linux)
- ✅ Tablet
- ✅ Celular (Android, iPhone)

Basta abrir o endereço do aplicativo no navegador — **não precisa instalar nada**.

---

## 2. 🌐 Como acessar o aplicativo

### Acesso pela rede local (WiFi da fábrica/laboratório):

1. Verifique se seu dispositivo está conectado à **mesma rede WiFi** que o computador onde o aplicativo está rodando
2. Abra o navegador (Google Chrome, Firefox, Edge, Safari)
3. Na barra de endereço, digite o endereço fornecido pelo responsável técnico. Exemplos:
   - `http://localhost:5173/` (se estiver no mesmo computador)
   - `http://192.168.1.xxx:5173/` (se estiver em outro dispositivo na mesma rede)
4. Pressione **Enter** — a tela principal do aplicativo será exibida

### Acesso online (Netlify):

Se o aplicativo foi publicado na internet, acesse o link fornecido pelo responsável do projeto diretamente no navegador.

> 💡 **Dica:** Salve o endereço nos "Favoritos" do seu navegador para acessar mais rápido da próxima vez.

---

## 3. 🖥️ Visão geral da tela

Ao abrir o aplicativo, você verá as seguintes áreas:

```
┌──────────────────────────────────────────────┐
│  G.PANIZ AE25G2   SENAI IR HMI    [WiFi] [⚙]│  ← Barra superior
├────────┬─────────────────────────────────────┤
│        │                                     │
│ Menu   │      Área de conteúdo principal     │
│ Lateral│      (muda conforme a tela          │
│        │       selecionada)                  │
│        │                                     │
│ Tempe- │                                     │
│ ratura │                                     │
│ atual  │                                     │
└────────┴─────────────────────────────────────┘
```

### Barra superior (topo):

| Elemento | O que faz |
|----------|-----------|
| **G.PANIZ AE25G2 / SENAI IR HMI** | Nome do equipamento — clique para voltar à tela principal |
| **Indicador WiFi** | Mostra se a conexão está ativa (verde = conectado) |
| **Ícone de engrenagem ⚙** | Abre as configurações de conexão |

### Menu lateral (lado esquerdo):

O menu possui **4 páginas**. Clique em qualquer uma para navegar:

| Ícone | Nome | Função |
|-------|------|--------|
| 📊 | **Monitoramento** | Tela principal — veja temperatura, gráfico e controle o ciclo |
| 🎛️ | **Programação** | Edite os parâmetros da receita ativa (tempos e temperaturas) |
| 📡 | **Modos** | Escolha o modo de operação do aplicativo |
| 📖 | **Receitas** | Gerencie a biblioteca de receitas (criar, editar, importar, exportar) |

Na parte inferior do menu lateral, você verá a **temperatura atual** da massa e o **estado atual** do processo.

---

## 4. 📊 Tela de Monitoramento

Esta é a **tela principal** e a mais importante durante a operação. Ela mostra tudo o que você precisa saber em tempo real.

### 4.1 Painel do Processo (parte superior)

Este é o painel grande no topo da tela. Ele mostra:

- **Nome da receita ativa** — ex.: "Pão de Batata 25kg"
- **Código da receita** — ex.: PF-025
- **Estado atual** — pode ser:
  - 🟢 **Aguardando** — o ciclo ainda não começou
  - 🟢 **Temperatura OK** — a massa está na faixa ideal de temperatura
  - 🟡 **Adicionar água** — a temperatura subiu, é preciso adicionar água gelada
  - 🔴 **Crítico** — a temperatura ultrapassou o limite seguro, ação imediata necessária!
  - ✅ **Finalizado** — o ciclo de mistura terminou
  - ⏸️ **Pausado** — o ciclo foi pausado pelo operador
- **Tempo restante** — quanto tempo falta para o ciclo acabar (formato MM:SS)
- **Barra de progresso** — mostra visualmente quanto do ciclo já foi completado (0% a 100%)

### 4.2 Botões de controle

Abaixo do painel de processo, há botões para controlar o ciclo:

| Botão | Cor | O que faz |
|-------|-----|-----------|
| ▶️ **INICIAR** | Verde | Inicia o ciclo de mistura. O cronômetro começa a contar |
| ⏸️ **PAUSAR** | Amarelo | Pausa o ciclo temporariamente (aparece quando está rodando) |
| ⏹️ **PARAR** | Cinza | Para o ciclo completamente |
| 🔄 **RECARREGAR** | Azul | Reinicia o ciclo do zero com a receita atual |
| 🔴 **PARADA EMERGÊNCIA** | Vermelho | **Uso em emergência!** Para tudo imediatamente |

> ⚠️ **IMPORTANTE:** O botão **PARADA EMERGÊNCIA** deve ser usado apenas em situações de risco. Ele interrompe toda a operação imediatamente.

### 4.3 Cartões de métricas

Logo abaixo dos botões, existem 4 cartões informativos:

| Cartão | Informação |
|--------|------------|
| 🌡️ **Temperatura da massa** | Temperatura atual medida pelo sensor (em °C) |
| 📡 **Ambiente MLX90614** | Temperatura ambiente medida pelo mesmo sensor |
| 📈 **Média 30 amostras** | Média das últimas 30 leituras (mais estável que a leitura instantânea) |
| ⚠️ **Pico recente** | A maior temperatura registrada recentemente — fica vermelho se passou do limite crítico |

### 4.4 Gráfico de Curva Térmica

O gráfico grande mostra a **evolução da temperatura ao longo do tempo**:

- A **linha vermelha contínua** mostra a temperatura da massa
- A **linha tracejada com o texto "CRÍTICO"** mostra o limite de temperatura crítica
- O **ponto no final da linha** indica a leitura mais recente
- Se a temperatura subir acima da linha crítica, há um problema que precisa ser resolvido

> 💡 **Como ler o gráfico:** O eixo vertical (lado esquerdo) mostra a temperatura em °C. O gráfico se move da esquerda para a direita conforme o tempo passa. Se a linha subir rapidamente, a massa está aquecendo.

### 4.5 Log de Eventos

No canto inferior direito, o painel **"Eventos do operador"** mostra um histórico das ações realizadas:

- Quando o ciclo foi iniciado, pausado ou parado
- Quando uma receita foi carregada
- Alertas e informações do sistema

---

## 5. 🎛️ Tela de Programação

Nesta tela, você pode **visualizar e editar os parâmetros da receita ativa** sem precisar ir à biblioteca de receitas.

### O que você pode editar:

| Campo | O que significa | Exemplo |
|-------|----------------|---------|
| **Nome da receita** | Nome descritivo da receita | Pão de Batata 25kg |
| **Tempo de mistura** | Duração total do ciclo em segundos | 480 (= 8 minutos) |
| **Temperatura mínima** | Limite inferior da faixa ideal (°C) | 22 |
| **Temperatura máxima** | Limite superior da faixa ideal (°C) | 26 |
| **Temperatura crítica** | Limite de segurança — acima disso = alarme (°C) | 28 |

### Painel "Intervenções por temperatura":

Este painel resume as **ações automáticas** do sistema baseadas na temperatura:

- **Adicionar água gelada (TH-MAX)** — quando a temperatura atinge o máximo, o sistema avisa para adicionar água
- **Faixa ideal (WINDOW)** — mostra a faixa de temperatura considerada segura
- **Alarme crítico (LIMIT)** — quando a temperatura atinge o nível crítico, um alarme sonoro (buzzer) é acionado

### Como salvar as alterações:

1. Modifique os valores desejados nos campos
2. Clique no botão **SALVAR PROGRAMA**
3. As alterações são aplicadas imediatamente à receita ativa

> ⚠️ **Atenção:** As alterações feitas aqui afetam apenas a receita que está ativa no momento.

---

## 6. 📡 Tela de Modos

O aplicativo possui **4 modos de operação**. Cada modo altera o comportamento da interface para diferentes situações.

### Modos disponíveis:

| Modo | Quando usar | O que faz |
|------|-------------|-----------|
| 🟢 **Automático** | Operação normal do dia a dia | Executa a receita com alertas automáticos por temperatura e progresso |
| 🟡 **Manual assistido** | Quando o operador quer controle total | O operador confirma cada etapa manualmente (resfriamento, intervenções) |
| 🔵 **Calibração** | Quando precisa ajustar o sensor | Prioriza leitura estabilizada e permite enviar correções ao sensor |
| ⚪ **Diagnóstico** | Quando há problemas técnicos | Mostra informações detalhadas sobre sensor, conexão MQTT e estabilidade |

### Como trocar de modo:

1. Acesse a tela **Modos** pelo menu lateral
2. Clique no cartão do modo desejado
3. O cartão selecionado mostrará a indicação **"ATIVO"**

> 💡 **Para operação normal, mantenha o modo "Automático" selecionado.** Os outros modos são para manutenção, calibração ou diagnóstico de problemas.

---

## 7. 📖 Tela de Receitas

A tela de Receitas é a **biblioteca** onde você gerencia todas as receitas de massas cadastradas.

### 7.1 O que é uma receita?

Uma **receita** é um conjunto de parâmetros que definem:
- O tempo de mistura
- As temperaturas mínima, máxima e crítica
- A quantidade de água a ser adicionada quando necessário

Cada tipo de massa (pão de batata, pizza, pão francês, etc.) tem sua própria receita.

### 7.2 Lista de receitas

Cada receita na lista mostra:
- **Nome** e **código** da receita
- **Faixa de temperatura** (mín–máx)
- **Temperatura crítica**

### 7.3 Botões de ação em cada receita:

| Botão | Ícone | O que faz |
|-------|-------|-----------|
| **Editar** | 🎛️ | Abre um formulário para alterar os dados da receita |
| **Baixar JSON** | ⬇️ | Salva a receita como arquivo `.json` no seu computador/celular |
| **Baixar TXT** | 📄 | Salva a receita como arquivo `.txt` legível |
| **Excluir** | 🗑️ | Remove a receita (pede confirmação antes) |
| **CARREGAR / ATIVA** | ▶️ / ✅ | Ativa a receita para uso no ciclo de mistura |

### 7.4 Criar uma nova receita

1. Clique no botão **NOVA RECEITA** no topo da página
2. Preencha os campos no formulário que aparecerá:
   - **Código** — ex.: `PC-020` (identificador único, letras maiúsculas)
   - **Nome** — ex.: "Pão de Centeio 20kg"
   - **Tempo de mistura** — em segundos (ex.: 360 = 6 minutos)
   - **Temperatura mínima** — em °C (ex.: 20)
   - **Temperatura máxima** — em °C (ex.: 24)
   - **Temperatura crítica** — em °C (ex.: 27)
   - **Volume de água** — em mililitros (ex.: 280)
3. Clique em **SALVAR**
4. A nova receita aparecerá na lista

### 7.5 Editar uma receita existente

1. Na lista de receitas, clique no botão de **editar** (ícone 🎛️) da receita desejada
2. Modifique os campos que deseja alterar
3. Clique em **SALVAR**

> ⚠️ **Nota:** O código da receita não pode ser alterado durante a edição. Se precisar mudar o código, exclua a receita e crie uma nova.

### 7.6 Importar receitas

Você pode importar receitas de arquivos salvos anteriormente:

1. Clique no botão **IMPORTAR RECEITA (.JSON / .TXT)**
2. Selecione o arquivo no seu dispositivo
3. A receita importada será adicionada à biblioteca automaticamente

**Formatos aceitos:**
- `.json` — formato estruturado (pode conter uma ou várias receitas)
- `.txt` — formato de texto simples com campos como:
  ```
  CÓDIGO: PF-025
  NOME: Pão de Batata 25kg
  TEMPO_MISTURA: 480
  TEMP_MIN: 22
  TEMP_MAX: 26
  TEMP_CRITICA: 28
  AGUA_ML: 300
  ```

### 7.7 Exportar receitas (backup)

Para salvar uma cópia de segurança de uma receita:

1. Na lista de receitas, clique no botão **Baixar JSON** (⬇️) ou **Baixar TXT** (📄) da receita desejada
2. O arquivo será salvo na pasta de downloads do seu dispositivo

> 💡 **Dica:** É recomendável exportar suas receitas regularmente como backup, pois os dados são armazenados localmente no navegador.

---

## 8. 🔌 Conexão IoT (Simulador e MQTT)

O aplicativo pode funcionar de duas formas:

### Modo Simulador (padrão):

- O aplicativo gera dados fictícios de temperatura para demonstração
- **Não precisa de nenhum equipamento conectado**
- Ideal para aprender a usar o aplicativo, fazer treinamentos ou testes

### Modo MQTT (produção):

- O aplicativo recebe dados reais do sensor de temperatura via rede WiFi
- Requer que o sensor ESP32-S3 e o broker MQTT estejam configurados e funcionando
- Este é o modo usado na operação real da amassadeira

### Como configurar a conexão:

1. Na tela de **Monitoramento**, procure o painel **"Conexão IoT"** (parte inferior)
2. Altere os campos:

| Campo | O que preencher |
|-------|-----------------|
| **Modo** | Selecione "Simulador local" ou "MQTT WebSocket" |
| **Broker WebSocket** | Endereço do servidor MQTT (ex.: `ws://192.168.1.100:9001`) — só precisa preencher no modo MQTT |
| **Filtro do dispositivo** | Use `+` para aceitar qualquer dispositivo, ou digite o ID específico do equipamento |

> 💡 **Para uso normal, o responsável técnico irá configurar a conexão.** Se estiver apenas aprendendo, use o modo **Simulador local**.

---

## 9. 🔧 Calibração de Campo

O painel de calibração permite **ajustar a precisão do sensor de temperatura** quando ele estiver mostrando valores ligeiramente diferentes do real.

### Quando usar a calibração:

- Quando você possui um **termômetro de referência** (ex.: termômetro digital calibrado)
- Quando a temperatura mostrada no aplicativo é diferente da temperatura real medida pelo termômetro de referência

### Como calibrar:

1. Na tela de **Monitoramento**, procure o painel **"Calibração de campo"**
2. No campo **"Temperatura referência"**, digite a temperatura real medida pelo termômetro de referência
3. O sistema calcula automaticamente o **offset** (diferença entre o valor do sensor e o real)
4. Se o offset estiver entre **-5°C e +5°C**, clique em **ENVIAR OFFSET MQTT**
5. O sensor será atualizado com a correção

> ⚠️ **Atenção:** Se o offset calculado for maior que 5°C (para mais ou para menos), o botão ficará desabilitado. Neste caso, pode haver um problema com o sensor e é necessário chamar o responsável técnico.

---

## 10. ❓ Perguntas Frequentes (FAQ)

### "A temperatura não aparece / mostra zero"
- Verifique se o modo de conexão está correto (MQTT para uso real, Simulador para testes)
- No modo MQTT, verifique se o sensor ESP32-S3 está ligado e conectado à mesma rede WiFi
- Verifique se o endereço do broker está correto no painel "Conexão IoT"

### "O gráfico não se move"
- Se estiver no modo Simulador, o gráfico atualiza automaticamente a cada poucos segundos
- Se estiver no modo MQTT, verifique a conexão com o sensor (veja o indicador WiFi na barra superior)

### "Perdi minhas receitas"
- As receitas são salvas no armazenamento local do navegador. Se limpar os dados de navegação, elas serão perdidas
- Use a função **Exportar** (Baixar JSON) regularmente para fazer backup das receitas
- Receitas importadas de arquivo `.json` ou `.txt` podem ser recarregadas a qualquer momento

### "O que significa 'Crítico' no estado?"
- Significa que a temperatura da massa ultrapassou o limite de segurança definido na receita
- **Ação necessária:** Adicione água gelada imediatamente ou pare a amassadeira conforme orientação do supervisor

### "Posso usar o aplicativo no celular?"
- Sim! O aplicativo é responsivo e funciona em celulares, tablets e computadores
- Basta acessar o endereço do aplicativo pelo navegador do celular

### "O que é o botão PARADA EMERGÊNCIA?"
- É um botão de segurança que interrompe o ciclo de mistura imediatamente
- Use **apenas em emergências** — por exemplo, se a temperatura estiver subindo de forma descontrolada
- Após acionar a parada de emergência, use o botão **RECARREGAR** para reiniciar o ciclo quando for seguro

### "O aplicativo funciona sem internet?"
- **Sim**, na rede local. O aplicativo precisa apenas estar acessível pela rede WiFi local
- Não precisa de internet para funcionar com o sensor ESP32-S3 local
- Se publicado no Netlify, precisa de internet para o primeiro acesso, mas pode funcionar offline após carregado (PWA)

---

## 11. 📚 Glossário de Termos

| Termo | Significado |
|-------|-------------|
| **HMI** | Interface Homem-Máquina — é o "painel digital" que o operador usa |
| **ESP32-S3** | Microcontrolador (plaquinha eletrônica) que lê o sensor de temperatura e envia os dados |
| **MLX90614** | Sensor de temperatura infravermelho — mede a temperatura sem tocar na massa |
| **MQTT** | Protocolo de comunicação usado para enviar dados do sensor ao aplicativo pela rede WiFi |
| **Broker** | Servidor intermediário que distribui as mensagens MQTT entre sensor e aplicativo |
| **WebSocket** | Tecnologia que permite ao navegador receber dados em tempo real do broker MQTT |
| **Offset** | Valor de correção aplicado ao sensor para ajustar a precisão da leitura de temperatura |
| **Receita** | Conjunto de parâmetros (tempo, temperaturas, quantidade de água) para um tipo específico de massa |
| **Ciclo** | Período completo de mistura da massa, do início ao fim |
| **Telemetria** | Dados enviados automaticamente pelo sensor ao aplicativo (temperatura, estado, tempo restante) |
| **PWA** | Progressive Web App — tecnologia que permite o aplicativo funcionar como um app instalado |
| **Simulador** | Modo de teste que gera dados fictícios de temperatura sem precisar do sensor real |

---

> 📝 **Versão do manual:** 1.0  
> **Data:** Junho de 2025  
> **Projeto:** SENAI IR HMI — Sensor de Temperatura IR para Amassadeiras  
> **Equipamento:** G.Paniz AE25G2
