module.exports = function(RED) {
    "use strict";
    const fetch = require('node-fetch');

    function WhatsappSendTextNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.from    = config.from;
        node.apiKey  = config.apiKey;
        node.token   = config.token;
        node.to      = config.to;
        node.text    = config.text;

        node.on('input', function(msg) {
            const to = msg.payload.to || node.to;
            if (!to) {
                node.error("Destinatário não definido", msg);
                return;
            }
            const text = msg.payload.text || node.text;
            if (!text) {
                node.error("Texto da mensagem não definido", msg);
                return;
            }
            const payload = {
                from: node.from,
                to: to,
                message: {
                    type: "text",
                    text: text
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
                    node.error("Erro ao enviar mensagem de texto: " + err, msg);
                });
        });
    }
    RED.nodes.registerType("whatsapp-send-text", WhatsappSendTextNode);
};
