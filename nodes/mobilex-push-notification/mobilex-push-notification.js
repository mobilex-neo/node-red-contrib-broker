/**
 * Node-RED node for sending MobileX Push Notifications.
 *
 * This node authenticates using client credentials and then sends a push notification
 * based on the configuration and incoming message properties.
 *
 * Date: 2025-04-11 (Based on last interaction date)
 * Corrections based on successful curl request analysis.
 */
module.exports = function(RED) {
    /**
     * Represents the MobileX Push Notification Node.
     * @param {object} config - Node configuration set in the Node-RED editor.
     */
    function MobileXPushNotificationNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // --- Node Configuration Properties ---
        node.clientSecret = config.clientSecret;
        node.appCompanyId = config.appCompanyId;
        // Author should be a valid UUID string identifying the sender, as seen in the working curl request
        node.author = config.author || "a07122dd-447f-4d30-953c-283cbe320216"; // Default or configured author UUID
        node.subjectPush = config.subjectPush;
        node.contentPush = config.contentPush;

        // IMPORTANT: node.actionPush must be configured with a valid JSON string
        // representing an ARRAY of action objects. Each action object within the array
        // MUST contain the fields like "$order", "publishLevel", "permissionLevel", etc.,
        // exactly as shown in the successful curl request example.
        // Example valid JSON string for the node configuration field:
        // [{"name":"link","title":"Abrir Link","path":"","parameters":[{"title":"url","value":"https://www.mobilex.tech"}],"$order":3,"publishLevel":"1","permissionLevel":"1"}]
        // If no actions are needed, configure it as an empty array string: "[]"
        node.actionPush = config.actionPush;

        // --- API Endpoints ---
        // Use configured URLs or fallback to defaults
        node.apiAuthUrl = config.apiAuthUrl || "https://api.mobilex.tech/api/external/auth";
        node.apiPushUrl = config.apiPushUrl || "https://api.mobilex.tech/api/manager/messenger/message";

        // --- Node Execution Logic ---
        node.on('input', function(msg) {
            // Ensure axios is available. May need installation: `npm install axios` in Node-RED user directory.
            const axios = require('axios');

            // === Authentication Phase ===
            node.status({ fill: "blue", shape: "dot", text: "Autenticando..." });
            node.log("Iniciando autenticação...");

            // Prepare authentication data (form-urlencoded)
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_secret', node.clientSecret);

            // Perform authentication request
            axios.post(node.apiAuthUrl, params, {
                headers: {
                    // Correct Content-Type for URLSearchParams
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
            .then(authResponse => {
                let authData = authResponse.data;

                // Safely parse response if it's a string
                if (typeof authData === 'string') {
                    try {
                        authData = JSON.parse(authData);
                    } catch (parseError) {
                        node.error("Erro ao fazer parse da resposta da autenticação: " + parseError.message, msg);
                        node.error("Resposta da Auth (string): " + authResponse.data, msg);
                        node.status({ fill: "red", shape: "ring", text: "Erro parse auth" });
                        return; // Stop execution
                    }
                }

                // Check if authentication was successful and token exists
                if (authData && authData.access_token) {
                    const token = authData.access_token;
                    node.log("Autenticação realizada com sucesso.");
                    node.status({ fill: "blue", shape: "dot", text: "Enviando push..." });

                    // === Push Notification Phase ===

                    // Construct the base push payload - CORRECTED based on curl
                    const pushPayload = {
                        tiposArray: "2", // String "2" as per curl
                        targets: {
                            bornIn: {},          // Empty object as per curl
                            registeredIn: {},    // Empty object as per curl
                            specialty: [],       // Empty array as per curl
                            addressCity: [],     // Empty array as per curl
                            addressCountry: [],  // Empty array as per curl
                            addressState: [],    // CORRECTION 1: Use empty array [] as per curl
                            userids: []          // Initialize, will be populated from msg.userids
                        },
                        actions: [],             // Empty array as per curl (can be populated if needed)
                        actionPush: [],          // Initialize, will be populated from node.actionPush config
                        // CORRECTION 2: Removed $order, publishLevel, permissionLevel from top level
                        // These fields belong INSIDE the action objects within the actionPush array.
                        momentoEnvio: false,     // Boolean as per curl
                        subjectPush: node.subjectPush || msg.subjectPush || "Notificação Padrão", // Default subject
                        contentPush: node.contentPush || msg.contentPush || "Você tem uma nova mensagem.", // Default content
                        tipoEnvio: 1,            // Number 1 as per curl
                        author: node.author,     // Use configured or default author UUID
                        source: "web",           // String "web" as per curl
                        sendToAll: false,        // Boolean as per curl
                        sendInbox: false,        // Boolean as per curl
                        sendPush: true,          // Boolean as per curl
                        level: 1                 // Number 1 as per curl
                    };

                    // Safely parse msg.userids (expects JSON string array or JS array)
                    let userIdsInput = msg.userids || "[]"; // Default to empty array string
                    try {
                        if (typeof userIdsInput === 'string') {
                           pushPayload.targets.userids = JSON.parse(userIdsInput);
                        } else if (Array.isArray(userIdsInput)) {
                           pushPayload.targets.userids = userIdsInput; // Use if already an array
                        }
                        // Ensure it's actually an array after parsing/assignment
                        if (!Array.isArray(pushPayload.targets.userids)) {
                            node.warn("msg.userids did not result in an array. Using []. Input: " + userIdsInput);
                            pushPayload.targets.userids = [];
                        }
                    } catch (e) {
                        node.warn("Error parsing msg.userids: " + e.message + ". Using []. Input: " + userIdsInput);
                        pushPayload.targets.userids = [];
                    }

                    // Safely parse node.actionPush (expects JSON string array of action objects)
                    // The CONTENT of this string MUST follow the curl example structure!
                    let actionPushConfig = node.actionPush || "[]"; // Default to empty array string
                     try {
                         if (actionPushConfig && typeof actionPushConfig === 'string') {
                             pushPayload.actionPush = JSON.parse(actionPushConfig);
                         } else if (Array.isArray(actionPushConfig)) {
                             // Less common via config, but handle if it's already an array
                             pushPayload.actionPush = actionPushConfig;
                         }
                         // Ensure it's an array
                         if (!Array.isArray(pushPayload.actionPush)) {
                             node.warn("node.actionPush did not result in an array. Using []. Input: " + actionPushConfig);
                             pushPayload.actionPush = [];
                         }
                    } catch (e) {
                         node.warn("Error parsing node.actionPush: " + e.message + ". Using []. Input: " + actionPushConfig);
                         pushPayload.actionPush = [];
                    }

                    // Configure headers for the push request
                    const headersPush = {
                        'Accept': 'application/json, text/plain, */*',
                        'AppCompanyId': node.appCompanyId,
                        'Authorization': 'Bearer ' + token,
                        'Connection': 'keep-alive', // Axios handles keep-alive automatically
                        'Content-Type': 'application/json;charset=UTF-8',
                        // Extra browser headers from curl (Origin, Referer, User-Agent etc.) are generally NOT needed here.
                        // The 'logInfo' header from curl is omitted unless proven necessary.
                    };

                    node.log("Preparando envio da mensagem push com payload CORRIGIDO: " + JSON.stringify(pushPayload));

                    // Send the push notification request
                    axios.post(node.apiPushUrl, pushPayload, { headers: headersPush })
                    .then(pushResponse => {
                        let pushData = pushResponse.data;
                        // Attempt to parse if response is a string (less common but possible)
                         if (typeof pushData === 'string') {
                             try {
                                 pushData = JSON.parse(pushData);
                             } catch (parseError) {
                                 node.warn("Push response was a non-JSON string: " + pushData);
                                 // Keep the original string if parse fails but request was successful (status 2xx)
                             }
                         }
                        node.log("Mensagem push enviada com sucesso. Status: " + pushResponse.status + ". Resposta: " + JSON.stringify(pushData));
                        node.status({ fill: "green", shape: "dot", text: "Push enviado" });

                        // Send the response payload to the next node
                        msg.payload = pushData;
                        node.send(msg);
                    })
                    .catch(errPush => {
                        // Handle errors during the push request
                        node.status({ fill: "red", shape: "ring", text: "Erro push" });
                        if (errPush.response) {
                            // Server responded with an error status (4xx, 5xx)
                            node.error(`Erro no envio do push (HTTP Status: ${errPush.response.status}): ${JSON.stringify(errPush.response.data)}`, msg);
                        } else if (errPush.request) {
                            // Request was made but no response received
                            node.error("Erro no envio do push: Nenhuma resposta recebida do servidor.", msg);
                        } else {
                            // Error setting up the request
                            node.error("Erro na configuração da requisição de push: " + errPush.message, msg);
                        }
                    });

                } else {
                    // Handle authentication failure (token not found in response)
                    node.error("Erro na autenticação: token não encontrado na resposta.", msg);
                    node.error("Resposta da Auth recebida: " + JSON.stringify(authData), msg);
                    node.status({ fill: "red", shape: "ring", text: "Falha auth" });
                }
            })
            .catch(errAuth => {
                // Handle errors during the authentication request itself
                 node.status({ fill: "red", shape: "ring", text: "Erro auth" });
                 if (errAuth.response) {
                    // Server responded with an error status (4xx, 5xx)
                    let responseBody = errAuth.response.data;
                    // Try to stringify, but handle potential non-JSON responses gracefully
                    try { responseBody = JSON.stringify(responseBody); } catch(e) { /* Use raw if stringify fails */ }
                    node.error(`Erro na autenticação (HTTP Status: ${errAuth.response.status}): ${responseBody}`, msg);
                 } else if (errAuth.request) {
                    // Request was made but no response received
                    node.error("Erro na autenticação: Nenhuma resposta recebida do servidor.", msg);
                 } else {
                    // Error setting up the request
                    node.error("Erro na configuração da requisição de autenticação: " + errAuth.message, msg);
                 }
            });

             // Clear status indicator after a delay
             setTimeout(() => { node.status({}); }, 7000); // Clear after 7 seconds
        });

        // Optional: Handle node closure (e.g., clean up resources if any)
        // node.on('close', function() {
        //     // Cleanup tasks here
        // });
    }

    // Register the node type with Node-RED
    RED.nodes.registerType("mobilex-push-notification", MobileXPushNotificationNode);
};