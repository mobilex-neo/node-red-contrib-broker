# node-red-contrib-whatsapp

Este projeto fornece um conjunto de nodes para o Node-RED que permite o envio de mensagens via WhatsApp utilizando a API Oficial. Com estes nodes, é possível enviar diversos tipos de mensagens, como textos, imagens, vídeos, áudios, arquivos e mensagens interativas (botões com link ou respostas rápidas).

## Funcionalidades

- whatsapp-send-authentication-template: Envia um template de autenticação personalizado via WhatsApp, permitindo configurar nome do template, idioma e componentes via JSON.
- whatsapp-send-media-mtm: Envia mensagens que contêm mídia (imagens, vídeos, etc.), com a possibilidade de incluir uma legenda.
- whatsapp-mark-as-read: Atualiza o status de uma mensagem para "lida".
- whatsapp-send-audio: Envia mensagens de áudio informando a URL do arquivo e uma legenda opcional.
- whatsapp-send-button-link: Envia mensagens com botão do tipo link que direciona para uma URL.
- whatsapp-send-button-quick-reply: Envia mensagens com botões para respostas rápidas (definidos em JSON).
- whatsapp-send-file: Envia mensagens com um arquivo anexado, podendo incluir uma legenda.
- whatsapp-send-image: Envia uma imagem com legenda.
- whatsapp-send-text: Envia mensagens de texto.
- whatsapp-send-video: Envia mensagens com vídeo, podendo incluir legenda.

## Instalação

Para instalar este módulo no seu ambiente Node-RED, siga os passos abaixo:

1. Abra o terminal e navegue até o diretório do Node-RED (geralmente ~/.node-red):

   cd ~/.node-red

2. Instale o pacote via npm:

   npm install node-red-contrib-broker

3. Reinicie o Node-RED para que os novos nodes sejam carregados.

## Como Usar

1. Abra o editor do Node-RED e localize os nodes do pacote na paleta, identificados com o prefixo "whatsapp-...".
2. Arraste os nodes desejados para o fluxo.
3. Configure cada node com as credenciais da Vonage (API Key, Token) e outros parâmetros necessários, como:
   - Remetente: Número ou ID configurado no painel da Vonage.
   - Destinatário: Número de telefone para onde a mensagem será enviada.
   - Parâmetros específicos: Por exemplo, URL da mídia, nome do template, componentes em JSON, etc.
4. Conecte os nodes conforme a lógica do seu fluxo e injete mensagens com dados dinâmicos (caso necessário). Por exemplo, para o node "whatsapp-send-text" você pode configurar um msg.payload semelhante a:

   msg.payload = {
       to: "5541999999999",
       text: "Olá, esta é uma mensagem enviada via Code Flow!"
   };
   return msg;

## Documentação dos Nodes

Cada node possui um arquivo contendo a sua interface e uma ajuda inline para facilitar o entendimento de suas configurações. No editor do Node-RED, ao abrir um node, você poderá ver a documentação e os parâmetros detalhados, como:

- whatsapp-send-authentication-template: Informações sobre o nome do template, idioma e componentes (JSON).
- whatsapp-send-media-mtm: Parâmetros para envio de URL de mídia e legenda.
- whatsapp-mark-as-read: Campo para informar o ID da mensagem a ser marcada como lida.
- whatsapp-send-audio: Configurações para envio da URL do áudio e legenda.
- whatsapp-send-button-link: Campos para configurar o texto, título do botão e URL do link.
- whatsapp-send-button-quick-reply: Parâmetros para definir o texto da mensagem e botões de resposta em formato JSON.
- whatsapp-send-file: Configurações para envio da URL do arquivo e legenda.
- whatsapp-send-image: Campos para a URL da imagem e legenda.
- whatsapp-send-text: Configurações básicas para envio de mensagem de texto.
- whatsapp-send-video: Parâmetros para a URL do vídeo e legenda.



## Contribuições

Contribuições são bem-vindas! Se você deseja reportar algum problema, propor melhorias ou enviar novas features, sinta-se à vontade para:
- Abrir uma issue no repositório.
- Enviar um pull request com suas alterações.

## Licença

Este projeto está licenciado sob a Licença MIT – veja o arquivo LICENSE para detalhes.

## Contato

Caso haja dúvidas ou necessidade de suporte, entre em contato por meio dos canais disponibilizados no repositório.
