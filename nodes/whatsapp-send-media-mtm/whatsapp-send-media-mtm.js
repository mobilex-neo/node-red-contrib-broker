module.exports = function(RED) {
    "use strict";
    const fetch = require('node-fetch');

    function WhatsappSendMediaMTMNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.from     = config.from;
        node.apiKey   = config.apiKey;
        node.token    = config.token;
        node.to       = config.to;
        node.mediaUrl = config.mediaUrl;
        node.caption  = config.caption;

        node.on('input', function(msg) {
            const to = msg.payload.to || node.to;
            if (!to) {
                node.error("Destinatário (to) não definido", msg);
                return;
            }

            const mediaUrl = msg.payload.mediaUrl || node.mediaUrl;
            if (!mediaUrl) {
                node.error("URL da mídia não definida", msg);
                return;
            }

            // Monta o payload para mensagem de mídia
            const payload = {
                from: node.from,
                to: to,
                message: {
                    type: "media",
                    media: {
                        url: mediaUrl,
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
                    node.error("Erro ao enviar mensagem de mídia: " + err, msg);
                });
        });
    }
    RED.nodes.registerType("whatsapp-send-media-mtm", WhatsappSendMediaMTMNode);
};
