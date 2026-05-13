---
title: "wezterm配置"
date: "2026-04-25"
summary: "介绍一下wezterm的安装和配置。"
tags: ["Tutorial"]
---

# wezterm是什么
wezterm是由rust编写的性能强劲的终端模拟器，我认为是windows下最好用的终端模拟器。

# 为什么不用windows自带的终端
对我来说，windows自带的终端软件定制性不够，而wezterm有很多配置项来让我打造适合自己的terminal。

# 安装

```shell
scoop install extras/wezterm
```

# 配置

wezterm.lua
```lua
local wezterm = require("wezterm")

local config = wezterm.config_builder()

require("config.appearance")(wezterm, config)
require("config.keymaps")(wezterm, config)

return config
```

config/apperance.lua
```lua
return function(wezterm, config)
	-- 默认的长宽
	config.initial_cols = 120
	config.initial_rows = 30
	config.window_decorations = "RESIZE"
	config.window_background_opacity = 0.8
	config.use_fancy_tab_bar = false
	config.tab_max_width = 25
	config.hide_tab_bar_if_only_one_tab = false
	config.enable_scroll_bar = false
	config.enable_tab_bar = false
	config.font_size = 12
	config.color_scheme = "Tokyo Night"
	config.font = wezterm.font("JetBrainsMono Nerd Font Mono", { weight = "Bold" })
	config.default_prog = {
		"C:\\Users\\39261\\AppData\\Local\\Microsoft\\WindowsApps\\Microsoft.PowerShell_8wekyb3d8bbwe\\pwsh.exe",
		"--NoLogo",
	}
	config.window_padding = { top = 0 }
end
```

config/keymaps.lua
```lua
return function(wezterm, config)
	config.leader = { key = 'a', mods = 'CTRL', timeout_milliseconds = 1000 }
	config.keys = {
		{ key = "c", mods = "LEADER", action = wezterm.action.CloseCurrentPane({ confirm = true }) },
		{
			key = "d",
			mods = "LEADER",
			action = wezterm.action.SplitHorizontal({ domain = "CurrentPaneDomain" }),
		},
		{ key = "D", mods = "LEADER", action = wezterm.action.SplitVertical({ domain = "CurrentPaneDomain" }) },
		{ key = "h", mods = "LEADER", action = wezterm.action.ActivatePaneDirection("Left") },
		{ key = "j", mods = "LEADER", action = wezterm.action.ActivatePaneDirection("Down") },
		{ key = "k", mods = "LEADER", action = wezterm.action.ActivatePaneDirection("Up") },
		{ key = "l", mods = "LEADER", action = wezterm.action.ActivatePaneDirection("Right") },
		{ key = "LeftArrow", mods = "LEADER", action = wezterm.action.AdjustPaneSize({ "Left", 5 }) },
		{ key = "DownArrow", mods = "LEADER", action = wezterm.action.AdjustPaneSize({ "Down", 5 }) },
		{ key = "UpArrow", mods = "LEADER", action = wezterm.action.AdjustPaneSize({ "Up", 5 }) },
		{ key = "RightArrow", mods = "LEADER", action = wezterm.action.AdjustPaneSize({ "Right", 5 }) },
		{ key = "L", mods = "LEADER", action = wezterm.action.ActivateTabRelative(1) },
		{ key = "H", mods = "LEADER", action = wezterm.action.ActivateTabRelative(-1) },
	}
	for i = 1, 9 do
    	table.insert(config.keys, {
    	key = tostring(i),
        mods = 'LEADER',
        action = wezterm.action.ActivateTab(i - 1),
    	})
	end
end
```