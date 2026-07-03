---
title: "Windows 安装 MinGW-w64"
date: "2026-07-03"
summary: "Windows 下配置 MinGW-w64 环境，用于编译 C/C++ 代码并与 Python 联动。"
tags: ["Tutorial"]
---

最近阅读 [qlib](https://github.com/microsoft/qlib) 源码时，发现数据模块中有 Python 调用 C++ 的部分，需要本地编译。macOS 自带 GCC，Windows 则需要自己搭一套——MinGW-w64 是最省事的选择。

# 下载 MinGW-w64

打开 [MinGW-w64 官方下载页](https://www.mingw-w64.org/downloads/)：

![mingw1.png](https://cloudflare-imgbed-cmn.pages.dev/file/1783089785981_mingw1.png)

按上图指引，点击 **MinGW-W64-builds** 会跳转到 GitHub Releases 页面：[mingw-builds-binaries/releases](https://github.com/niXman/mingw-builds-binaries/releases)。

在 Release 中找到以下版本下载：

```
x86_64-16.1.0-release-posix-seh-ucrt-rt_v14-rev1.7z
```

版本名各字段含义：

| 字段 | 含义 |
| :--- | :--- |
| `x86_64` | 64 位架构 |
| `posix` | 支持 POSIX 线程模型（C++11 线程需要） |
| `seh` | 使用 SEH 异常处理（64 位 Windows 推荐） |
| `ucrt` | 使用 Universal CRT（Windows 10+ 默认运行时） |

如果不确定选哪个版本，直接照上面下载即可。

# 安装与配置

解压 `7z` 文件到你喜欢的位置（比如 `D:\mingw64`），然后将 `bin` 目录加入系统环境变量：

1. 按 `Win + R`，输入 `sysdm.cpl` 打开系统属性
2. 点击 **高级** → **环境变量**
3. 在系统变量中找到 `Path`，双击编辑
4. 新建一条，填入 `bin` 目录的完整路径（如 `D:\mingw64\bin`）
5. 确定保存

打开终端验证安装：

```powershell
gcc --version
g++ --version
```

如果输出版本号，说明配置成功。

# make 命令

MinGW-w64 自带的 make 程序名为 `mingw32-make.exe`。如果想直接使用 `make` 命令，将 `bin` 目录下的 `mingw32-make.exe` 复制一份并重命名为 `make.exe`：

```powershell
Copy-Item "D:\mingw64\bin\mingw32-make.exe" -Destination "D:\mingw64\bin\make.exe"
```

之后就可以用 `make` 了：

```powershell
make --version
```

# 总结

MinGW-w64 的安装本质上就是三步：下载 → 解压 → 加环境变量。相比 MSYS2 全家桶，单包解压的方式更轻量，日常编译 Python 扩展或阅读源码中的 C++ 部分完全够用。
