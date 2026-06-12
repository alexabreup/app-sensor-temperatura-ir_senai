# SENAI IR HMI - G.Paniz AE25G2

Aplicativo hibrido responsivo para desktop, tablets e celulares, baseado no design Stitch SENAI Industrial HMI Dashboard.

## Como executar

```powershell
npm install
npm run dev
```

Servidor local padrao:

- Local: `http://localhost:5173/`
- Rede: use o endereco exibido pelo Vite, por exemplo `http://192.168.x.x:5173/`

## Integração com o firmware ESP32-S3

O app assina os topicos publicados pelo projeto `sensor-temperatura-ir_senai`:

- Telemetria: `amassadeira/{device_id}/telemetry`
- Status: `amassadeira/{device_id}/status`

Payload atual esperado pelo firmware:

```json
{"temp":24.82,"state":1,"time_remaining":421,"msg":"Temperatura OK"}
```

O dashboard tambem aceita campos futuros/expandidos como `amb_temp`, `obj_temp_raw`, `obj_temp_corrected`, `elapsed_time_s` e `is_valid`.

## MQTT via navegador

Navegadores precisam de MQTT sobre WebSocket. Configure o broker para expor uma porta WebSocket, por exemplo:

- Mosquitto TCP firmware: `mqtt://192.168.1.100`
- Mosquitto WebSocket app: `ws://192.168.1.100:9001`

Enquanto o broker nao estiver acessivel, use o modo `Simulador local` no painel `Conexao IoT`.

## Publicacao no Netlify

O projeto ja esta preparado para deploy estatico no Netlify.

- Build command: `npm run build`
- Publish directory: `dist`

O arquivo `netlify.toml` tambem inclui um fallback para `index.html`, caso o app seja acessado por uma rota direta.
