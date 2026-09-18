; Script de Customização NSIS - CCO Security Suite Rev 1.2
; Proteção por Senha de Instalação e Aceite Contratual

Page custom PasswordPage PasswordPageLeave

Var PasswordDialog
Var PasswordInput
Var PasswordValue
Var PasswordLabel

Function PasswordPage
  !insertmacro MUI_HEADER_TEXT "Validação de Segurança e Licenciamento" "Digite a senha de instalação autorizada pela TecPrimus Soluções Tecnológicas"
  
  nsDialogs::Create 1018
  Pop $PasswordDialog
  ${If} $PasswordDialog == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 30u "Este instalador é protegido por criptografia e controle de distribuição restrita.$\r$\n$\r$\nPara prosseguir com a instalação da CCO Security Suite Rev 1.2, informe a Senha de Instalação oficial:"
  Pop $PasswordLabel

  ${NSD_CreatePassword} 0 36u 100% 14u ""
  Pop $PasswordInput
  ${NSD_SetFocus} $PasswordInput

  nsDialogs::Show
FunctionEnd

Function PasswordPageLeave
  ${NSD_GetText} $PasswordInput $PasswordValue
  ${If} $PasswordValue != "YAGO@2806"
    MessageBox MB_ICONSTOP|MB_OK "Senha de instalação incorreta!$\r$\n$\r$\nAcesso negado. A instalação será encerrada imediatamente para proteger a integridade do sistema."
    Quit
  ${EndIf}
FunctionEnd
