module.exports = function(RED) {
    "use strict";
    const fetch = require('node-fetch');

    function WhatsappSendImageNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.from     = config.from;
        node.apiKey   = config.apiKey;
        node.token    = config.token;
        node.to       = config.to;
        node.imageUrl = config.imageUrl;
        node.caption  = config.caption;

        node.on('input', function(msg) {
            const to = msg.payload.to || node.to;
            if (!to) {
                node.error("Destinatário não definido", msg);
                return;
            }
            const imageUrl = msg.payload.imageUrl || node.imageUrl;
            if (!imageUrl) {
                node.error("URL da imagem não definida", msg);
                return;
            }
            const payload = {
                from: node.from,
                to: to,
                message: {
                    type: "image",
                    image: {
                        url: imageUrl,
                        caption: msg.payload.caption || node.caption || ""
                    }
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
                    node.error("Erro ao enviar imagem: " + err, msg);
                });
        });
    }
    RED.nodes.registerType("whatsapp-send-image", WhatsappSendImageNode);
};
