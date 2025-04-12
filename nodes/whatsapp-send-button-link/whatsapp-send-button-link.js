module.exports = function(RED) {
    "use strict";
    const fetch = require('node-fetch');

    function WhatsappSendButtonLinkNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.from        = config.from;
        node.apiKey      = config.apiKey;
        node.token       = config.token;
        node.to          = config.to;
        node.text        = config.text;
        node.buttonTitle = config.buttonTitle;
        node.urlLink     = config.url; // URL para o botão

        node.on('input', function(msg) {
            const to = msg.payload.to || node.to;
            if (!to) {
                node.error("Destinatário não definido", msg);
                return;
            }
            const text = msg.payload.text || node.text;
            const buttonTitle = msg.payload.buttonTitle || node.buttonTitle;
            const urlLink = msg.payload.url || node.urlLink;

            if (!text || !buttonTitle || !urlLink) {
                node.error("Parâmetros text, buttonTitle ou url não definidos", msg);
                return;
            }

            const payload = {
                from: node.from,
                to: to,
                message: {
                    type: "button",
                    text: text,
                    buttons: [{
                        type: "url",
                        title: buttonTitle,
                        payload: urlLink
                    }]
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
                    node.error("Erro ao enviar mensagem com botão link: " + err, msg);
                });
        });
    }
    RED.nodes.registerType("whatsapp-send-button-link", WhatsappSendButtonLinkNode);
};
