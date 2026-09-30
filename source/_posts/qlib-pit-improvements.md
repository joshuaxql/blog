---
title: 改进 Qlib 的 PIT 财务数据库：合并存储与公告事件驱动计算
date: 2026-09-30 12:00:00
updated: 2026-09-30 12:00:00
cover: /img/qlib-pit.png
top_img: /img/qlib-pit.png
tags:
  - Qlib
  - 量化研究
categories:
  - 技术实践
description: 对照微软官方 Qlib 的 PIT 设计，介绍 joshuaxql/qlib 中每股两文件的合并存储、分组二分查询、公告事件计算与财务修订处理。
---

财务因子回测中，一个容易被忽略的问题是：**今天查到的历史财务数据，不一定是历史上的那一天能够看到的数据。**

微软官方 [Qlib](https://github.com/microsoft/qlib) 已经用 PIT（Point in Time）数据库处理公告日期和财报修订。在我的 [joshuaxql/qlib](https://github.com/joshuaxql/qlib) 中，围绕这一思路，重新实现了面向本地量化研究的财务存储与查询流程。核心变化不是取消版本历史，而是把它组织得更集中、更易校验，并减少日频因子计算中的重复工作。

## 一、为什么必须保留 PIT 语义

财务数据至少有两条时间轴：

- **报告期**：数据描述哪一个季度，例如 2025 年第一季度。
- **公告日期**：市场从什么时候开始能够看到这条数据。

同一报告期还可能有后续修订。下面是一组示意数据，不对应任何真实公司的财报：

| 报告期 | 公告日期 | EPS |
| --- | --- | ---: |
| 2025 Q1 | 2025-04-25 | 0.80 |
| 2025 Q1 | 2025-05-15 | 0.75 |

在 4 月 24 日的回测中，不能使用这份一季报；4 月 25 日至 5 月 14 日应该看到 0.80；5 月 15 日起才应该看到修订后的 0.75。

对于某个指标和报告期，PIT 查询可以概括为：

```text
先筛选：公告日期 <= 观察日期
再选择：该指标、该报告期中公告日期最晚的版本
```

不能把今天的最终版本回填到过去，也不能因为报告期已经结束，就认为财务数据已经公开。

## 二、官方设计与本地研究中的改进方向

官方 PIT 使用按股票、按指标拆分的文件。每个指标包含 `.data` 和 `.index`，数据记录保存 `date / period / value / _next`，索引定位某个报告期的首个版本，再沿 `_next` 修订链查找对应时点的版本。字段名中的 `_q`、`_a` 用来区分季度和年度。

这一设计已经解决了版本历史问题，但在指标和股票数量扩大后，有几个值得改进的工程点：

1. **小文件数量**：每个股票、每个指标都需要一对文件。
2. **查询重复工作**：对照版本的 `LocalPITProvider.period_feature()` 会读取指标数据，并为各报告期查找可见版本；长区间、多表达式查询还有复用空间。
3. **数据可检查性**：合并存储后，需要明确格式版本、索引边界和文件对一致性，不能只追求文件数量减少。
4. **来源修订语义**：下载、缓存、构建和表达式计算都要保留公告历史，不能在某一环节将其压成最终值。

官方文档本身也指出，PIT 计算还有性能优化空间。我的实现主要沿着上述几个方向展开。

## 三、合并存储：每只股票只保留两个文件

PIT v2 将同一股票的全部财务指标放进一对文件，用全局字段字典管理指标名称与编号：

```text
financial/
├── fields.json
├── 000001.SZ/
│   ├── pit.data
│   └── pit.index
└── 600000.SH/
    ├── pit.data
    └── pit.index
```

`fields.json` 保存 `field_id`、原始指标名称、来源、频率等元数据。股票文件只保存数值编号，不反复存储字段名；重建时仍在配置中的指标保留已有编号。

如果有 N 只股票、F 个指标，并假设每股都包含全部指标：

- 逐指标文件组织约为 **2 × N × F** 个文件。
- 合并后最终数据文件为 **2 × N + 1** 个。

例如 5,000 只股票、163 个指标，文件数量从约 163 万个变为 10,001 个。

### 记录布局与完整性

所有记录采用小端、无填充布局：

| 文件 | 记录字段 | 单条大小 |
| --- | --- | ---: |
| `pit.data` | `field_id:uint32, date:uint32, period:uint32, value:float64, next:uint64` | 28 字节 |
| `pit.index` | `field_id:uint32, period:uint32, offset:uint64, count:uint64` | 24 字节 |

报告期统一使用 `YYYYQQ`，季度编号是 01～04，例如 `202501` 表示 2025 Q1，年报位于 Q4。这一版字段字典仅支持季度频率，并未沿用官方独立年度字段的全部语义。

两个文件各有 72 字节头部，包含 magic、格式版本、记录大小、generation、记录数和 SHA-256 校验和。加载时验证文件长度、校验和、文件对 generation、记录排序、索引、修订链和字段编号。

这样，截断、损坏或中断更新造成的不一致可以被显式拒绝，而不是被当成正常数据继续计算。

## 四、版本查询：从修订链追踪到分组二分定位

`pit.data` 按下面的顺序排列：

```text
(field_id, period, date)
```

因此，同一指标、同一报告期的全部版本连续存放，并按公告日期升序排列。`pit.index` 记录这一组的起点 `offset` 和长度 `count`。

查询观察日 T 的版本时，可以直接在组内执行：

```python
position = np.searchsorted(group_dates, T, side="right") - 1
```

`position < 0` 表示还没有可见版本。`side="right"` 对应公告当日可见的约定。

虽然格式仍保留 `next` 并验证修订链，但快照查询不需要沿链逐条读取。对包含 R 个修订版本的单组，版本定位使用二分搜索，复杂度为 O(log R)；这不等于包含文件加载和校验在内的完整查询都只有 O(log R)。

仓库还提供纯 C 的 `qlib_pit_asof`，通过 NumPy 数组和 ctypes 批量定位各组版本。没有编译 `pit.dll` 时，使用 NumPy 回退，PIT 查询不强制依赖原生库。

## 五、日频因子：按公告事件计算，而不是每天重建快照

财务数据通常不会每个交易日都变化。除了单日快照查询，更关键的优化是长时间区间的表达式计算。

`qlib/data/base.py` 中的 `_prepare_pit()` 会收集一次查询里的 PIT 投影，合并需要的字段，然后共用该股票的一次公告事件扫描：

```text
收集表达式与财务字段
        ↓
加载股票 PIT 数据
        ↓
按公告日期批量更新季度状态
        ↓
重新计算受影响的 PIT 表达式
        ↓
将事件结果映射到交易日历
```

同一天相关字段先全部更新，再计算表达式，避免依赖两个指标的表达式读到“一个已更新、另一个未更新”的中间状态。旧季度修订只改变那个季度，不会被误认为出现了一个新报告期。

例如，同时请求：

```python
[
    "P($$eps)",
    "PRef($$eps, -1)",
    "P(Mean($$eps, 4))",
]
```

这些表达式可以共用公告事件扫描，而不是各自重复遍历历史。事件计算仍需要处理季度序列和算子，不能仅凭这一结构就声称整体查询达到某个固定倍数的加速。

### 显式 NaN 不是“继续使用旧值”

如果一次修订将某个指标改成 NaN，这个事件应该使旧值失效。实现中保留显式 NaN 修订，并通过：

```python
event_series.reindex(trading_calendar, method="ffill")
```

延续**最近一次事件的结果**，而不是对数值列直接调用 `.ffill()`。后者可能跨过一个明确的 NaN 修订，错误地恢复旧值。

此外，季度序列使用完整自然季度网格。`PRef($$eps, -1)` 表示上一自然季度，而不是上一条非空记录；缺失季度仍然是 NaN。

## 六、从 Tushare CSV 到 PIT：修订历史不能在构建阶段丢失

当前实现的财务来源限定为 Tushare `fina_indicator`，通过 `fina_indicator_vip` 按季度下载全市场数据，显式请求全部 163 个数值指标，包括默认不展示的字段。

构建流程为：

```text
季度 CSV 宽表 → 按股票分组 → 当前股票展开为指标长表 → pit.data / pit.index
```

不生成中间数据库，也不预先将全市场所有指标展开为长表。不过选中的 CSV 宽表仍会读入内存，内存占用会随输入数据量增长，并不是全程流式构建。

构建中明确处理以下情况：

- **不同公告日期**：保留同一报告期的不同公告版本。
- **同日修订**：优先选择更大的 `update_flag`；同优先级下存在冲突记录则报错。
- **异常公告日**：来源记录的公告日早于报告期末时，跳过并打印明细，避免提前暴露报告期数据。
- **无效数值**：拒绝无穷值，但保留 NaN 修订。
- **单位与口径**：保持来源定义，不自动将百分比除以 100，也不将累计指标擅自转换为单季度指标。

独立构建先在临时目录完成，再替换 `financial/`，减少构建失败对已有数据的影响。最近若干季度可刷新缓存，以收集后续修订。

## 七、增量更新与缓存

`write_stock(..., update=True)` 会合并历史记录，相同 `(field, period, date)` 键由本次输入替换，其他版本保留。重复输入可以保持幂等，但物理上会重写该股票文件对，**并不是只向文件尾追加**。

两个文件通过相同 generation 检测不完整更新。这里提供的是一致性检测，不是双文件事务或多写者并发保证；应按单写者使用，完成更新后再查询。

读取端使用按字节预算限制的股票级 LRU 缓存，默认预算为 128 MiB。文件或字段字典变化时，相关缓存会失效；数据提供器层面的缓存也可以通过 `D.clear_cache()` 或重新初始化清理。

## 总结

这次 PIT 改进可以归纳为三个层次：

1. **存储层**：每股两文件、稳定字段编号、明确的格式与完整性校验。
2. **查询层**：连续版本布局、分组二分定位、可选 C 加速与字节受限缓存。
3. **计算层**：按公告事件更新季度状态，多表达式共用扫描，再映射到交易日。

它们共同服务于同一个目标：在保留“当时能知道什么”的前提下，让本地财务因子研究更易维护，并减少不必要的重复计算。

## 参考与源码

- [我的 Qlib 仓库](https://github.com/joshuaxql/qlib) · [在线文档](https://qlib-joshuaxql.readthedocs.io/)
- [本文版本的 PIT 文档](https://github.com/joshuaxql/qlib/blob/2dba402ae27b602ab5ba5c35af12078c1bab7a01/docs/pit.md)
- [合并存储、版本查询与缓存：qlib/data/pit.py](https://github.com/joshuaxql/qlib/blob/2dba402ae27b602ab5ba5c35af12078c1bab7a01/qlib/data/pit.py)
- [公告事件计算：qlib/data/base.py](https://github.com/joshuaxql/qlib/blob/2dba402ae27b602ab5ba5c35af12078c1bab7a01/qlib/data/base.py)
- [CSV 构建：scripts/dump/pit.py](https://github.com/joshuaxql/qlib/blob/2dba402ae27b602ab5ba5c35af12078c1bab7a01/scripts/dump/pit.py)
- [PIT 测试](https://github.com/joshuaxql/qlib/blob/2dba402ae27b602ab5ba5c35af12078c1bab7a01/tests/test_pit.py) · [离线基准](https://github.com/joshuaxql/qlib/blob/2dba402ae27b602ab5ba5c35af12078c1bab7a01/scripts/benchmark_pit.py)
- [微软官方 PIT 设计文档](https://github.com/microsoft/qlib/blob/be725493eb1a6bbb42bf11b37aa7669f59610ff1/docs/advanced/PIT.rst)
- [微软官方 LocalPITProvider](https://github.com/microsoft/qlib/blob/be725493eb1a6bbb42bf11b37aa7669f59610ff1/qlib/data/data.py) · [官方 PIT 数据构建脚本](https://github.com/microsoft/qlib/blob/be725493eb1a6bbb42bf11b37aa7669f59610ff1/scripts/dump_pit.py)
