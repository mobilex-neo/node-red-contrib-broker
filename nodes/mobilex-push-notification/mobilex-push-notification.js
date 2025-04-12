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
        node.actionPush = config.actionPush;  // Pode ser um JSON em string

        // URLs dos endpoints (pode ser parametrizado ou fixo)
        node.apiAuthUrl = config.apiAuthUrl || "https://api.mobilex.tech/api/external/auth";
        node.apiPushUrl = config.apiPushUrl || "https://api.mobilex.tech/api/manager/messenger/message";

        // Ao receber uma mensagem de entrada, executar o nó
        node.on('input', function(msg) {
            // Certifique-se de que axios está disponível. Pode ser necessário instalá-lo no diretório do Node-RED.
            const axios = require('axios');

            // --- Autenticação ---
            node.status({fill:"blue", shape:"dot", text:"Autenticando..."});
            node.log("Iniciando autenticação...");

            // Preparar os dados da autenticação (form-urlencoded)
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_secret', node.clientSecret);

            // Chamada para autenticar e obter o token
            axios.post(node.apiAuthUrl, params, { // 'params' é URLSearchParams
                headers: {
                    // CORREÇÃO: Usar o Content-Type correto para URLSearchParams
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
            .then(authResponse => {
                let authData = authResponse.data;

                // Tentativa de parse JSON se a resposta for string
                if (typeof authData === 'string') {
                    try {
                        authData = JSON.parse(authData);
                    } catch (parseError) {
                        node.error("Erro ao fazer parse da resposta da autenticação: " + parseError.message, msg);
                        node.error("Resposta recebida (string): " + authResponse.data, msg); // Logar a string problemática
                        node.status({fill:"red", shape:"ring", text:"Erro parse auth"});
                        return; // Interromper execução se o parse falhar
                    }
                }

                // Verificar se o token foi recebido
                if (authData && authData.access_token) {
                    const token = authData.access_token;
                    node.log("Autenticação realizada com sucesso.");
                    node.status({fill:"blue", shape:"dot", text:"Enviando push..."});

                    // --- Envio da Notificação Push ---

                    // Construir o payload base para o push
                    const pushPayload = {
                        tiposArray: "2",
                        targets: {
                            bornIn: {},
                            registeredIn: {},
                            specialty: [],
                            addressCity: [],
                            addressCountry: [],
                            addressState: {},
                            userids: [] // Inicializa como array vazio
                        },
                        actions: [],      // Inicializa como array vazio (se necessário)
                        actionPush: [],   // Inicializa como array vazio
                        $order: 3,
                        publishLevel: "1",
                        permissionLevel: "1",
                        momentoEnvio: false,
                        subjectPush: node.subjectPush || msg.subjectPush || "Notificação", // Padrão
                        contentPush: node.contentPush || msg.contentPush || "Você tem uma nova mensagem.", // Padrão
                        tipoEnvio: 1,
                        author: node.author || "Sistema", // Padrão
                        source: "web",
                        sendToAll: false,
                        sendInbox: false,
                        sendPush: true,
                        level: 1
                    };

                    // Parse com segurança msg.userids (espera-se que seja uma string JSON de array ou um array)
                    let userIds = msg.userids || "[]"; // Padrão é string de array vazio
                    try {
                        if (typeof userIds === 'string') {
                           pushPayload.targets.userids = JSON.parse(userIds);
                        } else if (Array.isArray(userIds)) {
                           pushPayload.targets.userids = userIds; // Já é um array
                        }
                        // Validação adicional: garantir que é um array
                        if (!Array.isArray(pushPayload.targets.userids)) {
                            node.warn("msg.userids não resultou em um array após parse. Usando array vazio.");
                            pushPayload.targets.userids = [];
                        }
                    } catch (e) {
                        node.warn("Erro ao fazer parse de msg.userids: " + e.message + ". Usando array vazio.");
                        pushPayload.targets.userids = [];
                    }

                    // Parse com segurança node.actionPush (espera-se que seja uma string JSON de array ou um array)
                    let actionPushConfig = node.actionPush || "[]"; // Padrão é string de array vazio
                     try {
                         if (actionPushConfig && typeof actionPushConfig === 'string') {
                             pushPayload.actionPush = JSON.parse(actionPushConfig);
                         } else if (Array.isArray(actionPushConfig)) {
                             pushPayload.actionPush = actionPushConfig; // Pode já ser um array vindo da config
                         }
                         // Validação adicional
                         if (!Array.isArray(pushPayload.actionPush)) {
                             node.warn("node.actionPush não resultou em um array após parse. Usando array vazio.");
                              pushPayload.actionPush = [];
                         }
                    } catch (e) {
                         node.warn("Erro ao fazer parse de node.actionPush: " + e.message + ". Usando array vazio.");
                         pushPayload.actionPush = [];
                    }


                    // Configurar os headers para a requisição push
                    const headersPush = {
                        'Accept': 'application/json, text/plain, */*',
                        'AppCompanyId': node.appCompanyId,
                        'Authorization': 'Bearer ' + token,
                        'Connection': 'keep-alive',
                        'Content-Type': 'application/json;charset=UTF-8',
                    };

                    node.log("Preparando envio da mensagem push com payload: " + JSON.stringify(pushPayload));

                    // Enviar a mensagem push
                    axios.post(node.apiPushUrl, pushPayload, {
                        headers: headersPush
                    })
                    .then(pushResponse => {
                        let pushData = pushResponse.data;
                        // Tentar parse se for string (algumas APIs podem retornar string mesmo com header JSON)
                         if (typeof pushData === 'string') {
                             try {
                                 pushData = JSON.parse(pushData);
                             } catch (parseError) {
                                 node.warn("Resposta do push recebida como string não-JSON: " + pushData);
                                 // Decidir se isso é um erro ou apenas um log
                                 // msg.payload = pushData; // Enviar a string original
                             }
                         }

                        node.log("Mensagem push enviada com sucesso. Resposta: " + JSON.stringify(pushData));
                        node.status({fill:"green", shape:"dot", text:"Push enviado"});
                        // Enviar a resposta para o próximo nó
                        msg.payload = pushData;
                        node.send(msg);
                    })
                    .catch(errPush => {
                        node.status({fill:"red", shape:"ring", text:"Erro push"});
                        // Melhorar log de erro do push
                        if (errPush.response) {
                            node.error(`Erro no envio do push (HTTP Status: ${errPush.response.status}): ${JSON.stringify(errPush.response.data)}`, msg);
                        } else if (errPush.request) {
                            node.error("Erro no envio do push: Nenhuma resposta recebida.", msg);
                        } else {
                            node.error("Erro na configuração da requisição de push: " + errPush.message, msg);
                        }
                    });

                } else {
                    node.error("Erro na autenticação: token não encontrado na resposta.", msg);
                    node.error("Resposta recebida: " + JSON.stringify(authData), msg);
                    node.status({fill:"red", shape:"ring", text:"Falha auth"});
                }
            })
            .catch(errAuth => {
                node.status({fill:"red", shape:"ring", text:"Erro auth"});
                // Melhorar log de erro da autenticação
                if (errAuth.response) {
                    // Tentar logar corpo da resposta, mesmo que não seja JSON
                    let responseBody = errAuth.response.data;
                    try { responseBody = JSON.stringify(responseBody); } catch(e) { /* Ignora se não puder stringificar */ }
                    node.error(`Erro na autenticação (HTTP Status: ${errAuth.response.status}): ${responseBody}`, msg);
                } else if (errAuth.request) {
                    node.error("Erro na autenticação: Nenhuma resposta recebida do servidor.", msg);
                } else {
                    node.error("Erro na configuração da requisição de autenticação: " + errAuth.message, msg);
                }
            });

             // Limpar status após um tempo
             setTimeout(() => { node.status({}); }, 5000); // Limpa após 5 segundos
        });
    }
    RED.nodes.registerType("mobilex-push-notification", MobileXPushNotificationNode);
};