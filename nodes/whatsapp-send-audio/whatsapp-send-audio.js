module.exports = function(RED) {
    "use strict";
    const fetch = require('node-fetch');

    function WhatsappSendAudioNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.from     = config.from;
        node.apiKey   = config.apiKey;
        node.token    = config.token;
        node.to       = config.to;
        node.audioUrl = config.audioUrl;
        node.caption  = config.caption;

        node.on('input', function(msg) {
            const to = msg.payload.to || node.to;
            if (!to) {
                node.error("Destinatário não definido", msg);
                return;
            }
            const audioUrl = msg.payload.audioUrl || node.audioUrl;
            if (!audioUrl) {
                node.error("URL do áudio não definida", msg);
                return;
            }
            const payload = {
                from: node.from,
                to: to,
                message: {
                    type: "audio",
                    audio: {
                        url: audioUrl,
                        caption: msg.payload.caption || node.caption || ""
                    }
                }
            };

            const url = "https://api.nexmo.com/v0.1/messages";
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + node.token
                },
                body: JSON.stringify(payload)
            };

            fetch(url, options)
                .then(res => res.json())
                .then(data => {
                    msg.payload = data;
                    node.send(msg);
                })
                .catch(err => {
                    node.error("Erro ao enviar mensagem de áudio: " + err, msg);
                });
        });
    }
    RED.nodes.registerType("whatsapp-send-audio", WhatsappSendAudioNode);
};
