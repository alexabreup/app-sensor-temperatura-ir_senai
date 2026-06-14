# Relatório de Entregáveis do Projeto

Este relatório reúne, de forma simples e direta, os entregáveis desenvolvidos no projeto, com foco no que o professor precisa identificar como parte da entrega final.

## 1. Resumo do Projeto

O projeto consiste em uma solução de automação e monitoramento para uma amassadeira industrial, com leitura térmica não invasiva por infravermelho, integração com ESP32, comunicação MQTT e interface web para supervisão e demonstração.

## 2. Entregáveis Realizados

### 01. Levantamento e análise do problema
- Identificação do gargalo térmico no batimento da massa.
- Justificativa técnica para evitar sensores invasivos.
- Definição da oportunidade de inovação com leitura remota por infravermelho.

### 02. Planilha de requisitos, materiais e equipamentos
- Lista de componentes principais do protótipo.
- Definição da infraestrutura elétrica.
- Relação de ferramentas de medição e EPIs usados no projeto.

### 03. Desenhos técnicos e esquemas elétricos
- Esquema do condicionamento de saída com transistor BC547.
- Diagrama unifilar do painel elétrico.
- Organização física básica do painel de comando.

### 04. Programas e lógica de programação
- Arquitetura baseada em MQTT.
- Uso de Protocol Buffers para serialização dos dados.
- Firmware embarcado em C/C++ no ESP32.
- Backend para decodificação e tratamento das mensagens.

### 05. Memorial do protótipo funcional
- Estrutura mecânica de fixação do sensor.
- Posicionamento do sensor IR sobre a amassadeira.
- Explicação do campo de visão e da área de leitura.

### 06. Integração entre campo, comunicação e supervisão
- Fluxo de dados do sensor até a interface web.
- Arquitetura de supervisão em tempo real.
- Modo de calibração e ajuste de offset pela interface.

### 07. Documentação de operação
- Procedimentos básicos de uso.
- Lógica de alertas térmicos.
- Rotina de limpeza e cuidados operacionais.

### 08. Entrega técnica e validação
- Protocolo de comissionamento.
- Testes de conformidade e estabilidade.
- Modo de simulação digital para demonstração.

### 09. Pitch de construção
- Roteiro de apresentação do projeto.
- Estrutura de slides para demonstração acadêmica.

### 10. Pitch de operação
- Roteiro curto para demonstração ao vivo.
- Sequência prática de calibração, segurança e simulação.

### 11. Post de divulgação profissional
- Texto institucional para LinkedIn.
- Síntese do valor técnico e acadêmico do projeto.

### 12. Artigo científico
- Texto acadêmico completo do trabalho.
- Fundamentação teórica.
- Metodologia.
- Resultados.
- Discussão normativa.
- Conclusão.

## 3. Código-Fonte Aberto

Os códigos do projeto foram disponibilizados publicamente em GitHub:

- Interface web / IHM: [https://github.com/alexabreup/app-sensor-temperatura-ir_senai](https://github.com/alexabreup/app-sensor-temperatura-ir_senai)
- Firmware embarcado / ESP32: [https://github.com/alexabreup/sensor-temperatura-ir_senai](https://github.com/alexabreup/sensor-temperatura-ir_senai)

## 4. Materiais de Demonstração

Além dos textos principais, o projeto também inclui materiais de apresentação e validação, como:

- Pitch de construção.
- Pitch de operação.
- Demonstração da landing page.
- Publicação de divulgação profissional.
- Artigo científico final.

## 5. Conclusão

Entregamos um conjunto completo de documentação, protótipo, software e materiais de apresentação, cobrindo desde a definição do problema até a validação técnica e a divulgação pública da solução.

