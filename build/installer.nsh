; NSIS 自定义安装脚本
; 设置默认安装路径为 D:\Program Files\ProjectManagementTools

; 安装前设置默认目录（用户点击安装按钮后、实际安装前触发）
!macro NSIS_HOOK_PREINSTALL
  ; 如果安装目录在 C 盘，替换为 D 盘的目标路径
  StrCpy $0 $INSTDIR 2
  ${If} $0 == "C:"
    StrCpy $INSTDIR "D:\Program Files\ProjectManagementTools"
  ${EndIf}
!macroend

; 安装完成后
!macro NSIS_HOOK_POSTINSTALL
!macroend

; 卸载前
!macro NSIS_HOOK_PREUNINSTALL
!macroend
