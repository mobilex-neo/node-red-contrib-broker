module.exports = function(RED) {
    "use strict";
    const fetch = require('node-fetch');

    function WhatsappMarkAsReadNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.apiKey    = config.apiKey;
        node.token     = config.token;
        node.messageId = config.messageId; // ID fixo se configurado

        node.on('input', function(msg) {
            const messageId = msg.payload.message_id || node.messageId;
            if (!messageId) {
                node.error("ID da mensagem não definido", msg);
                return;
            }

            const payload = {
                message_id: messageId,
                status: "read"
            };

            // Para atualização de status, pode ser usado o mesmo endpoint ou outro conforme a API
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
                    node.error("Erro ao marcar mensagem como lida: " + err, msg);
                });
        });
    }
    RED.nodes.registerType("whatsapp-mark-as-read", WhatsappMarkAsReadNode);
};
