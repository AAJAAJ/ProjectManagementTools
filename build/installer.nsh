; NSIS 自定义安装脚本
; 设置默认安装路径为 D:\Program Files\ProjectManagementTools

; 安装初始化时设置默认目录
!macro NSIS_HOOK_PREINSTALL
  ; 如果安装目录是默认的 C 盘路径，改为 D 盘
  ${If} $INSTDIR == "$PROGRAMFILES64\ProjectManagementTools"
    StrCpy $INSTDIR "D:\Program Files\ProjectManagementTools"
  ${EndIf}
!macroend

; 安装完成后
!macro NSIS_HOOK_POSTINSTALL
!macroend

; 卸载前
!macro NSIS_HOOK_PREUNINSTALL
!macroend
