# 🗺️ Mapa de Portas de Switch - IFPR

Este projeto é uma aplicação web para mapeamento e gerenciamento de portas de switches de rede, desenvolvido para o IFPR - Campus União da Vitória.

## ✨ Funcionalidades

* Visualização gráfica de múltiplos switches e suas portas.
* Autenticação de utilizadores com Firebase.
* Adição, edição e exclusão de switches e dados de portas (IP, MAC, VLAN, etc.).
* Sistema de busca em tempo real.
* Cores de porta dinâmicas baseadas no tipo de dispositivo conectado.
* Histórico de alterações (logs) para auditoria.
* Gerenciador de modelos de switch, permitindo adicionar novos equipamentos sem alterar o código.
* Interface responsiva e intuitiva com notificações de feedback.

## 🚀 Tecnologias Utilizadas

* HTML5
* CSS3
* JavaScript (ES6 Modules)
* Firebase (Authentication e Realtime Database)

## 🔧 Como Executar Localmente

1.  Clone este repositório.
2.  Como o projeto usa Módulos ES6, ele precisa ser servido por um servidor web local para funcionar.
3.  Se tiver Python instalado, navegue até a pasta do projeto e execute:
    ```bash
    python -m http.server
    ```
4.  Acesse `http://localhost:8000` no seu navegador.