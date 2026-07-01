---
title: "MiniQMT 获取实时 Tick 数据"
date: "2026-07-01"
summary: "量化交易中获取实时 tick 数据是实盘的基础。MiniQMT 提供了多种获取方式，本文帮你理清不同场景该用哪个。"
tags: ["Tutorial", "Quant"]
---

写了一个策略，需要实时 tick 数据来驱动交易决策。打开 MiniQMT 文档，发现有好几个接口——`get_full_tick`、`subscribe_whole_quote`、`subscribe_quote`……该用哪个？

它们的区别不在功能，而在**使用模式**。理解了这个，就知道怎么选。

# 核心概念：订阅 vs 获取

普通获取接口调用一次返回一次结果。实时场景下需要持续获取最新数据，就必须轮询——比如每秒调一次。但数据可能在 0.5 秒后就更新了，轮询间隔的 0.5 秒就成了浪费的机会成本。

订阅模式则不同：一旦订阅成功，数据更新时它会主动推送给你。接口有一个 `callback` 参数，每次新数据到来时该函数就会被调用一次。延迟更低，数据第一时间到达程序。

对应到 MiniQMT 的接口：

| 模式 | 接口 |
| :--- | :--- |
| 主动获取 | `get_full_tick` |
| 订阅推送 | `subscribe_whole_quote`、`subscribe_quote` |
| 取消订阅 | `unsubscribe_quote` |

订阅接口需要配套的取消订阅接口来停止推送，否则会一直占用资源。

# 重要前提：交易时段才能用

`subscribe_quote` 和 `subscribe_whole_quote` **在非交易时间无法触发回调**。使用或测试这两个接口时，务必选在开盘时间内。盘后调试实时数据会比较困难，建议用 `get_full_tick` 代替。

# subscribe_whole_quote（推荐）

全推数据的订阅接口。一次订阅即可接收多只股票的实时 tick，有更新时主动推送。**日常实盘首选。**

```python
from xtquant import xtdata

def on_data(datas):
    print(datas)

seq = xtdata.subscribe_whole_quote(code_list=['600519.SH', '000001.SZ'], callback=on_data)
xtdata.run()
```

`xtdata.run()` 并非必须，仅用于阻塞程序保持运行。订阅模式会持续推送数据，让程序一直运行才能持续接收。

# get_full_tick

全推数据的主动获取接口。调用一次返回当前时间最新的市场横截面数据。**适合盘后测试、定时采样、或不需要持续推送的场景。**

用法简单：传入股票代码数组，返回以代码为 key 的字典，对应值是该股票的最新 tick 数据。非交易时间返回上一个交易日最后一个 tick 数据。

注意，此接口不能传 `period` 参数，返回默认是最新的 tick 周期数据。

```python
from xtquant import xtdata
res = xtdata.get_full_tick(['600519.SH'])
res['600519.SH']
```

# subscribe_quote

单股订阅接口。每次只能传入一只股票代码，但支持 `period` 参数，可以获取 tick 级别以外的数据（如分钟线）。

根据迅投官方声明，此接口不宜订阅过多股票，性能不如全推订阅。**仅在需要单股票多周期的场景下使用。**

# unsubscribe_quote

取消订阅接口。当不再需要数据推送时，必须显式调用此接口来停止。若大量订阅且不及时取消，会造成 CPU 和内存资源的浪费。

```python
xtdata.unsubscribe_quote(seq)
```

# 如何选择：一张图看懂

| 场景 | 推荐接口 | 原因 |
| :--- | :--- | :--- |
| 实盘持续监控多只股票 | `subscribe_whole_quote` | 订阅推送，延迟低，支持多股票 |
| 盘后测试/定时采样 | `get_full_tick` | 调用即返回，非交易时间也有数据 |
| 单股票多周期需求 | `subscribe_quote` | 支持 period 参数 |
| 停止数据推送 | `unsubscribe_quote` | 释放资源，必须调用 |

# 总结

实时 tick 数据是量化实盘交易的数据基础。MiniQMT 的四个接口各有分工，核心选择只有两个：

- **持续接收** → `subscribe_whole_quote`（订阅推送）
- **按需获取** → `get_full_tick`（主动调用）

先想清楚你的场景需要哪种模式，再选接口，就不会用错。
