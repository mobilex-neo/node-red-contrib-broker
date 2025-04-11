module.exports = function(RED) {
    function MobileXPushNotificationNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // Propriedades do nó configuradas no editor
        node.clientSecret = config.clientSecret;
        node.appCompanyId = config.appCompanyId;
        node.author = config.author;
        node.subjectPush = config.subjectPush;
        node.contentPush = config.contentPush;
        node.actionPush = config.actionPush;  // Pode ser um JSON em string (converter se necessário)
        
        // URLs dos endpoints (pode ser parametrizado ou fixo)
        node.apiAuthUrl = config.apiAuthUrl || "https://api.mobilex.tech/api/external/auth";
        node.apiPushUrl = config.apiPushUrl || "https://api.mobilex.tech/api/manager/messenger/message";
        
        // Ao receber uma mensagem de entrada, executar o nó
        node.on('input', function(msg) {
            const axios = require('axios');

            // Preparar os dados da autenticação (form-urlencoded)
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_secret', node.clientSecret);
            node.info("Iniciando autenticação com client_secret: " + node.clientSecret);
            // Chamada para autenticar e obter o token
            axios.post(node.apiAuthUrl, params, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(authResponse => {
                node.info("Autenticação realizada com sucesso.");
                if (authResponse.data && authResponse.data.access_token) {
                    const token = authResponse.data.access_token;

                    // Construir o payload para o push. Você pode estender para usar dados de msg.payload, msg.userids, etc.
                    const pushPayload = {
                        tiposArray: "2",
                        targets: {
                            bornIn: {},
                            registeredIn: {},
                            specialty: [],
                            addressCity: [],
                            addressCountry: [],
                            addressState: {},
                            userids: JSON.parse(msg.userids) || []  // ou defina um padrão
                        },
                        actions: [],
                        actionPush: (node.actionPush) ? JSON.parse(node.actionPush) : [],
                        $order: 3,
                        publishLevel: "1",
                        permissionLevel: "1",
                        momentoEnvio: false,
                        subjectPush: node.subjectPush || msg.subjectPush,
                        contentPush: node.contentPush || msg.contentPush,
                        tipoEnvio: 1,
                        author: node.author,
                        source: "web",
                        sendToAll: false,
                        sendInbox: false,
                        sendPush: true,
                        level: 1
                    };

                    // Configurar os headers para a requisição push
                    const headersPush = {
                        'Accept': 'application/json, text/plain, */*',
                        'AppCompanyId': node.appCompanyId,
                        'Authorization': 'Bearer ' + token,
                        'Connection': 'keep-alive',
                        'Content-Type': 'application/json;charset=UTF-8',
                    };
                    node.info("Preparando envio da mensagem push com payload: " + JSON.stringify(pushPayload));
                    // Enviar a mensagem push
                    axios.post(node.apiPushUrl, pushPayload, {
                        headers: headersPush
                    })
                    .then(pushResponse => {
                        msg.payload = pushResponse.data;
                        node.send(msg);
                    })
                    .catch(errPush => {
                        node.error("Erro no envio da mensagem push: " + errPush.message, msg);
                    });
                } else {
                    node.error("Erro na autenticação: token não encontrado.", msg);
                }
            })
            .catch(errAuth => {
                node.error("Erro na autenticação: " + errAuth, msg);
            });
        });
    }
    RED.nodes.registerType("mobilex-push-notification", MobileXPushNotificationNode);
};
