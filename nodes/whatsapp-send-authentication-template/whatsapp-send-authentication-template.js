module.exports = function(RED) {
    "use strict";
    const fetch = require('node-fetch');

    function WhatsappSendAuthenticationTemplateNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Configurações básicas
        node.from         = config.from;
        node.apiKey       = config.apiKey;
        node.token        = config.token;
        node.to           = config.to;  // Opcional se definido na configuração
        node.templateName = config.templateName;
        node.language     = config.language;
        node.components   = config.components; // Espera-se string JSON

        node.on('input', function(msg) {
            const to = msg.payload.to || node.to;
            if (!to) {
                node.error("Destinatário (to) não definido", msg);
                return;
            }

            // Tenta obter os componentes (JSON)
            let components;
            try {
                components = msg.payload.components || (node.components ? JSON.parse(node.components) : []);
            } catch (e) {
                node.error("Erro ao processar JSON dos componentes", msg);
                return;
            }

            // Monta o payload conforme a documentação da Vonage para template de autenticação
            const payload = {
                from: node.from,
                to: to,
                message: {
                    type: "authentication_template",
                    template: {
                        name: node.templateName,
                        language: node.language,
                        components: components
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
                    node.error("Erro ao enviar template de autenticação: " + err, msg);
                });
        });
    }
    RED.nodes.registerType("whatsapp-send-authentication-template", WhatsappSendAuthenticationTemplateNode);
};
