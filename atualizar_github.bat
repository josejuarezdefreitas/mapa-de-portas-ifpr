@echo off
title Atualizador de Repositório GitHub

:: Garante que o script execute no diretório onde ele está localizado
cd /d "%~dp0"

echo.
echo =======================================================
echo    ATUALIZADOR DE REPOSITORIO PARA O GITHUB
echo =======================================================
echo.

:: Pede ao utilizador para inserir uma mensagem de commit
set /p commitMessage="=> Digite a mensagem do commit (descreva a alteracao): "

:: Se nenhuma mensagem for digitada, usa uma mensagem padrao (SEM ASPAS AQUI)
if "%commitMessage%"=="" set commitMessage=Atualizacao de rotina

echo.
echo -------------------------------------------------------
echo.

:: Executa os comandos do Git
echo Adicionando todos os arquivos...
git add .

echo.
echo Criando o commit com a mensagem: "%commitMessage%"
git commit -m "%commitMessage%"

echo.
echo Enviando as alteracoes para o GitHub...
git push

echo.
echo -------------------------------------------------------
echo.
echo PROCESSO CONCLUIDO!
echo.

:: Pausa o terminal para que o utilizador possa ver a saida dos comandos
pause