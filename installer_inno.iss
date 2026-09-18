; Script de Instalação Inno Setup Oficial - CCO Security Suite Rev 1.2
; Desenvolvedor: Yago Marinho | TecPrimus Soluções Tecnológicas
; Proteção por Senha de Instalação e Criptografia de Arquivos

#define MyAppName "CCO Security Suite"
#define MyAppVersion "1.2.0"
#define MyAppPublisher "TecPrimus Soluções Tecnológicas"
#define MyAppURL "https://github.com/YagoVasconcelos"
#define MyAppExeName "CCO Security Suite.exe"

[Setup]
; Identificação do Aplicativo
AppId={{C8E1B026-9C44-4F8A-92BC-71D0EE21B8A3}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} Rev {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=dist
OutputBaseFilename=CCO Security Suite Setup {#MyAppVersion} (Inno Setup)
SetupIconFile=build\icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest

; 1. Termos de Aceitação de Licença e Segurança (Obrigatório)
LicenseFile=build\termos_licenca.txt

; 2. Proteção Criptográfica por Senha de Instalação (Obrigatório: YAGO@2806)
Password=YAGO@2806
Encryption=yes

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Binários da aplicação compilada (da pasta win-unpacked gerada pelo build)
Source: "dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; IconFilename: "{app}\{#MyAppExeName}"

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
