module.exports = function(RED) {
    "use strict";
    const fetch = require('node-fetch');

    function WhatsappSendButtonQuickReplyNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.from    = config.from;
        node.apiKey  = config.apiKey;
        node.token   = config.token;
        node.to      = config.to;
        node.text    = config.text;
        node.buttons = config.buttons; // Espera uma string JSON com os botões

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
            let buttons;
            try {
                buttons = msg.payload.buttons || (node.buttons ? JSON.parse(node.buttons) : []);
            } catch (e) {
                node.error("Erro ao parsear JSON dos botões", msg);
                return;
            }

            const payload = {
                from: node.from,
                to: to,
                message: {
                    type: "button",
                    text: text,
                    buttons: buttons
                }
            };

            const url = "https://api.nexmo.com/v0.1/messages";
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + Buffer.from(node.apiKey + ':' + node.token).toString('base64')
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
                    node.error("Erro ao enviar mensagem com botões quick reply: " + err, msg);
                });
        });
    }
    RED.nodes.registerType("whatsapp-send-button-quick-reply", WhatsappSendButtonQuickReplyNode);
};
