# Conexão IoT

O aplicativo pode operar em dois cenários.

## Modo Simulador

- É o modo padrão.
- Gera dados fictícios de temperatura.
- Não exige hardware conectado.
- Ideal para treinamento e testes.

## Modo MQTT

- Recebe dados reais via rede WiFi.
- Exige ESP32-S3 e broker MQTT configurados.
- É o modo usado na operação real.

## Configuração

Campos do painel:

- `Modo`: Simulador local ou MQTT WebSocket.
- `Broker WebSocket`: endereço do servidor MQTT.
- `Filtro do dispositivo`: aceita qualquer dispositivo com `+` ou filtra um ID específico.

## Exemplo

- `ws://192.168.1.100:9001`

## Observação

Em uso normal, a configuração de conexão deve ser feita pelo responsável técnico.
