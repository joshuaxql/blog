---
title: "glazewm--windows下的平铺式桌面"
date: "2026-04-10"
summary: "介绍一下glazewm的安装和配置。"
tags: ["Tutorial"]
---

# 成果图
![](https://github.com/joshuaxql/pictures/blob/main/imgs/glazewm.png?raw=true)
 
# 安装
```shell
scoop install extras/glazewm
```

glazewm默认使用zebar，我认为它颜值不高，所以换成yasb
```shell
scoop install extras/yasb
```

# 配置
在yasb里选择自己喜欢的主题，我选择minty green（这套主题还需要安装cava）\
此外可以右键任务栏里的yasb和glazewm的图标设置它们开机自启。\
下面是我的个人配置：

## glazewm
C:\Users\用户名\.glzr\glazewm\config.yaml
```yaml
general:
  # Commands to run when the WM has started. This is useful for running a
  # script or launching another application.
  # Example: The below command launches Zebar.
  startup_commands: []

  # Commands to run just before the WM is shutdown.
  # Example: The below command kills Zebar.
  shutdown_commands: []

  # Commands to run after the WM config is reloaded.
  config_reload_commands: []

  # Whether to automatically focus windows underneath the cursor.
  focus_follows_cursor: false

  # Whether to switch back and forth between the previously focused
  # workspace when focusing the current workspace.
  toggle_workspace_on_refocus: false

  cursor_jump:
    # Whether to automatically move the cursor on the specified trigger.
    enabled: true

    # Trigger for cursor jump:
    # - 'monitor_focus': Jump when focus changes between monitors.
    # - 'window_focus': Jump when focus changes between windows.
    trigger: 'monitor_focus'

  # How windows should be hidden when switching workspaces.
  # - 'cloak': (Windows-only) Recommended option for Windows.
  # - 'hide': (Windows-only) Legacy option for Windows. Has stability issues with some apps.
  # - 'place_in_corner': Artifically hides the window by placing it in the corner of the
  #   monitor. On macOS, this is always used instead of cloak/hide.
  hide_method: 'cloak'

  # Affects which windows get shown in the native Windows taskbar. Has no
  # effect if `hide_method: 'hide'`.
  # - 'true': Show all windows (regardless of workspace).
  # - 'false': Only show windows from the currently shown workspaces.
  show_all_in_taskbar: false

gaps:
  # Whether to scale the gaps with the DPI of the monitor.
  scale_with_dpi: true

  # Gap between adjacent windows.
  inner_gap: '20px'

  # Gap between windows and the screen edge.
  outer_gap:
    top: '15px'
    right: '10px'
    bottom: '5px'
    left: '10px'

window_effects:
  # Visual effects to apply to the focused window.
  focused_window:
    # Highlight the window with a colored border.
    # ** Exclusive to Windows 11 due to API limitations.
    border:
      enabled: true
      color: '#8dbcff'

    # Remove the title bar from the window's frame. Note that this can
    # cause rendering issues for some applications.
    hide_title_bar:
      enabled: false

    # Change the corner style of the window's frame.
    # ** Exclusive to Windows 11 due to API limitations.
    corner_style:
      enabled: false
      # Allowed values: 'square', 'rounded', 'small_rounded'.
      style: 'small_rounded'

    # Change the transparency of the window.
    transparency:
      enabled: false
      # Can be something like '95%' or '0.95' for slightly transparent windows.
      # '0' or '0%' is fully transparent (and, by consequence, unfocusable).
      opacity: '95%'

  # Visual effects to apply to non-focused windows.
  other_windows:
    border:
      enabled: true
      color: '#a1a1a1'
    hide_title_bar:
      enabled: false
    corner_style:
      enabled: false
      style: 'small_rounded'
    transparency:
      enabled: true
      opacity: '80%'

window_behavior:
  # New windows are created in this state whenever possible.
  # Allowed values: 'tiling', 'floating'.
  initial_state: 'tiling'

  # Sets the default options for when a new window is created. This also
  # changes the defaults for when the state change commands, like
  # `set-floating`, are used without any flags.
  state_defaults:
    floating:
      # Whether to center floating windows by default.
      centered: true

      # Whether to show floating windows as always on top.
      shown_on_top: false

    fullscreen:
      # Maximize the window if possible. If the window doesn't have a
      # maximize button, then it'll be fullscreen'ed normally instead.
      maximized: false

      # Whether to show fullscreen windows as always on top.
      shown_on_top: false

workspaces:
  - name: '1'
  - name: '2'
  - name: '3'
  - name: '4'
  - name: '5'
  - name: '6'
  - name: '7'
  - name: '8'
  - name: '9'

window_rules:
  - commands: ['ignore']
    match:
      # Ignores any Zebar windows.
      - window_process: { equals: 'zebar' }

      # Ignores picture-in-picture windows for browsers.
      - window_title: { regex: '[Pp]icture.in.[Pp]icture' }
        window_class: { regex: 'Chrome_WidgetWin_1|MozillaDialogClass' }

      # Ignore rules for various 3rd-party apps.
      - window_process: { equals: 'PowerToys' }
        window_class: { regex: 'HwndWrapper\[PowerToys\.PowerAccent.*?\]' }
      - window_title: { equals: 'Command Palette' }
        window_class: { equals: 'WinUIDesktopWin32WindowClass' }
      - window_process: { equals: 'PowerToys' }
        window_title: { regex: '.*? - Peek' }
      - window_process: { equals: 'Lively' }
        window_class: { regex: 'HwndWrapper' }
      - window_process: { equals: 'EXCEL' }
        window_class: { not_regex: 'XLMAIN' }
      - window_process: { equals: 'WINWORD' }
        window_class: { not_regex: 'OpusApp' }
      - window_process: { equals: 'POWERPNT' }
        window_class: { not_regex: 'PPTFrameClass' }

binding_modes:
  # When enabled, the focused window can be resized via arrow keys or HJKL.
  - name: 'resize'
    keybindings:
      - commands: ['resize --width -2%']
        bindings: ['h', 'left']
      - commands: ['resize --width +2%']
        bindings: ['l', 'right']
      - commands: ['resize --height +2%']
        bindings: ['k', 'up']
      - commands: ['resize --height -2%']
        bindings: ['j', 'down']
      # Press enter/escape to return to default keybindings.
      - commands: ['wm-disable-binding-mode --name resize']
        bindings: ['escape', 'enter']

keybindings:
  # Shift focus in a given direction.
  - commands: ['focus --direction left']
    bindings: ['alt+h', 'alt+left']
  - commands: ['focus --direction right']
    bindings: ['alt+l', 'alt+right']
  - commands: ['focus --direction up']
    bindings: ['alt+k', 'alt+up']
  - commands: ['focus --direction down']
    bindings: ['alt+j', 'alt+down']

  # Move focused window in a given direction.
  - commands: ['move --direction left']
    bindings: ['alt+shift+h', 'alt+shift+left']
  - commands: ['move --direction right']
    bindings: ['alt+shift+l', 'alt+shift+right']
  - commands: ['move --direction up']
    bindings: ['alt+shift+k', 'alt+shift+up']
  - commands: ['move --direction down']
    bindings: ['alt+shift+j', 'alt+shift+down']

  # Resize focused window by a percentage or pixel amount.
  - commands: ['resize --width -2%']
    bindings: ['alt+u']
  - commands: ['resize --width +2%']
    bindings: ['alt+p']
  - commands: ['resize --height +2%']
    bindings: ['alt+o']
  - commands: ['resize --height -2%']
    bindings: ['alt+i']

  # As an alternative to the resize keybindings above, resize mode enables
  # resizing via arrow keys or HJKL. The binding mode is defined above with
  # the name 'resize'.
  - commands: ['wm-enable-binding-mode --name resize']
    bindings: ['alt+r']

  # Disables window management and all other keybindings until alt+shift+p
  # is pressed again.
  - commands: ['wm-toggle-pause']
    bindings: ['alt+shift+p']

  # Change tiling direction. This determines where new tiling windows will
  # be inserted.
  - commands: ['toggle-tiling-direction']
    bindings: ['alt+v']

  # Change focus from tiling windows -> floating -> fullscreen.
  - commands: ['wm-cycle-focus']
    bindings: ['alt+space']

  # Change the focused window to be floating.
  - commands: ['toggle-floating --centered']
    bindings: ['alt+shift+space']

  # Change the focused window to be tiling.
  - commands: ['toggle-tiling']
    bindings: ['alt+t']

  # Change the focused window to be fullscreen.
  - commands: ['toggle-fullscreen']
    bindings: ['alt+f']

  # Minimize focused window.
  - commands: ['toggle-minimized']
    bindings: ['alt+m']

  # Close focused window.
  - commands: ['close']
    bindings: ['alt+q']

  # Kill GlazeWM process safely.
  - commands: ['wm-exit']
    bindings: ['alt+shift+e']

  # Re-evaluate configuration file.
  - commands: ['wm-reload-config']
    bindings: ['alt+shift+r']

  # Redraw all windows.
  - commands: ['wm-redraw']
    bindings: ['alt+shift+w']

  # Launch CMD terminal. alternatively, use `shell-exec wt` or
  # `shell-exec %ProgramFiles%/Git/git-bash.exe` to start Windows
  # Terminal and Git Bash respectively.
  - commands: ['shell-exec wezterm-gui']
    bindings: ['alt+enter']

  # Focus the next/previous active workspace defined in `workspaces` config.
  - commands: ['focus --next-active-workspace']
    bindings: ['alt+s']
  - commands: ['focus --prev-active-workspace']
    bindings: ['alt+a']

  # Focus the workspace that last had focus.
  - commands: ['focus --recent-workspace']
    bindings: ['alt+d']

  # Change focus to a workspace defined in `workspaces` config.
  - commands: ['focus --workspace 1']
    bindings: ['alt+1']
  - commands: ['focus --workspace 2']
    bindings: ['alt+2']
  - commands: ['focus --workspace 3']
    bindings: ['alt+3']
  - commands: ['focus --workspace 4']
    bindings: ['alt+4']
  - commands: ['focus --workspace 5']
    bindings: ['alt+5']
  - commands: ['focus --workspace 6']
    bindings: ['alt+6']
  - commands: ['focus --workspace 7']
    bindings: ['alt+7']
  - commands: ['focus --workspace 8']
    bindings: ['alt+8']
  - commands: ['focus --workspace 9']
    bindings: ['alt+9']

  # Move the focused window's parent workspace to a monitor in a given
  # direction.
  - commands: ['move-workspace --direction left']
    bindings: ['alt+shift+a']
  - commands: ['move-workspace --direction right']
    bindings: ['alt+shift+f']
  - commands: ['move-workspace --direction up']
    bindings: ['alt+shift+d']
  - commands: ['move-workspace --direction down']
    bindings: ['alt+shift+s']

  # Move focused window to a workspace defined in `workspaces` config.
  - commands: ['move --workspace 1', 'focus --workspace 1']
    bindings: ['alt+shift+1']
  - commands: ['move --workspace 2', 'focus --workspace 2']
    bindings: ['alt+shift+2']
  - commands: ['move --workspace 3', 'focus --workspace 3']
    bindings: ['alt+shift+3']
  - commands: ['move --workspace 4', 'focus --workspace 4']
    bindings: ['alt+shift+4']
  - commands: ['move --workspace 5', 'focus --workspace 5']
    bindings: ['alt+shift+5']
  - commands: ['move --workspace 6', 'focus --workspace 6']
    bindings: ['alt+shift+6']
  - commands: ['move --workspace 7', 'focus --workspace 7']
    bindings: ['alt+shift+7']
  - commands: ['move --workspace 8', 'focus --workspace 8']
    bindings: ['alt+shift+8']
  - commands: ['move --workspace 9', 'focus --workspace 9']
    bindings: ['alt+shift+9']

```

## yasb
C:\Users\用户名\.config\yasb\config.yaml
```yaml
watch_stylesheet: true
watch_config: true
debug: false
komorebi:
  start_command: "komorebic start --whkd"
  stop_command: "komorebic stop --whkd"
  reload_command: "komorebic stop --whkd && komorebic start --whkd"
bars:
  primary-bar:
    enabled: true
    screens: ['*'] 
    class_name: "yasb-bar"
    alignment:
      position: "top"
      center: true
    blur_effect:
      enabled: false
      acrylic: true
      dark_mode: true
      round_corners: true
      border_color: None
    window_flags:
      always_on_top: true
      windows_app_bar: true
      hide_on_fullscreen: true
    dimensions:
      width: "97%"
      height: 24
    padding:
      top: 12
      left: 8
      bottom: -2
      right: 8
    widgets:
      left:
        [
          "glazewm_workspaces",
          "systray",
          "media",
        ]
      center:
        [
          "active_window",
          #"komorebi_workspaces"
        ]
      right:
        [
          "cava",
          "volume",
          "clock",
          #"language",
          #"weather",
          "power_menu"
        ]
widgets:
    language:
      type: "yasb.language.LanguageWidget"
      options:
        label: "<span>\uf11c</span>{lang[country_code]}"
        update_interval: 5
        callbacks:
          on_left: "do_nothing"
          on_middle: "do_nothing"
          on_right: "do_nothing"
    komorebi_workspaces:
      type: "komorebi.workspaces.WorkspaceWidget"
      options:
        label_offline: ""
        label_workspace_btn: "\udb81\udc3d"
      label_workspace_active_btn: "\udb81\udc3e"
      label_workspace_populated_btn: "\udb81\udc3e"
      label_default_name: ""
      label_zero_index: true
      hide_empty_workspaces: true
      hide_if_offline: true
      animation: true
    toggle_workspace_layer:
      enabled: false
      tiling_label: "Tiling"
      floating_label: "Floating"
    container_padding: 
      top: 0
      left: 8
      bottom: 0
      right: 8
    glazewm_workspaces:
      type: "glazewm.workspaces.GlazewmWorkspacesWidget"
      options:
        offline_label: "Offline"
        hide_empty_workspaces: true
        hide_if_offline: true
    media:
      type: "yasb.media.MediaWidget"
      options:
        label: "{artist} - {title}"
        label_alt: "{title}"
        max_field_size:
          label: 24
          label_alt: 48
        show_thumbnail: false
        controls_only: false
        controls_left: false
        hide_empty: true
        thumbnail_alpha: 150
        thumbnail_padding: 8
        thumbnail_corner_radius: 0
        icons:
          prev_track: "\uf048"
          next_track: "\uf051"
          play: "\uf04b"
          pause: "\uf04c"
      container_padding:
        top: 0
        left: 13
        bottom: 0
        right: 13
    active_window:
      type: "yasb.active_window.ActiveWindowWidget"
      options:
        label: "{win[title]}"
        label_alt: "{win[process][name]}"
        label_no_window: ""
        label_icon: true
        label_icon_size: 14
        max_length: 36
        max_length_ellipsis: "..."
        monitor_exclusive: true
    volume:
      type: "yasb.volume.VolumeWidget"
      options:
        label: "<span>{icon}</span> {level}"
        label_alt: "exec cmd.exe /c start ms-settings:sound"
        volume_icons:
          - "\ueee8"  # Icon for muted
          - "\uf026"  # Icon for 0-10% volume
          - "\uf027"  # Icon for 11-30% volume
          - "\uf027"  # Icon for 31-60% volume
          - "\uf028"  # Icon for 61-100% volume
        callbacks:
          on_right: "exec cmd.exe /c start ms-settings:sound"
    clock:
      type: "yasb.clock.ClockWidget"
      options:
        label: "{%a %b %d %H:%M}"
        label_alt: "{%A, %d %B %Y %H:%M}"
        timezones: []
        calendar:
          alignment: "center"
    power_menu:
      type: "yasb.power_menu.PowerMenuWidget"
      options:
        label: "\uf011"
        uptime: True
        blur: False
        blur_background: True
        animation_duration: 250 # Milisecond 
        button_row: 5 # Number of buttons in row, min 1 max 5
        buttons:
          signout: ["\udb80\udf43","Sign out"]
          shutdown: ["\uf011","Shut Down"]
          restart: ["\uead2","Restart"]
          hibernate: ["\uf28e","Hibernate"]
          cancel: ["\udb81\udf3a","Cancel"]
    cava:
      type: "yasb.cava.CavaWidget"
      options:
        bar_height: 12
        gradient: 1
        reverse: 0
        sensitivity: 100
        foreground: "#5f90b3"
        gradient_color_1: '#5f90b3'
        gradient_color_2: '#5f90b3'
        gradient_color_3: '#5f90b3'
        bars_number: 8
        bar_spacing: 2
        bar_width: 6
        sleep_timer: 0
        hide_empty: true
        container_padding:
          top: 0
          left: 0
          bottom: 0
          right: 0
    systray:
      type: "yasb.systray.SystrayWidget"
      options:
        class_name: "systray"
        show_unpinned: true
        show_unpinned_button: false
        show_battery: false
        show_volume: false
        show_network: false

```

# 最后
Enjoy your windows tiling window manager!