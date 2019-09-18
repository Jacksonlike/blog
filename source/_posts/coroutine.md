---
title: Python 协程
date: 2019-08-22 20:43:33
tags:
- Python
- coroutine
- 协程
categories:
- Python
description: 谈谈对协程的理解和认识
---

### 从一个实际案例说起
当我们希望从网上爬取一些有用的信息时，就可能会写出类似以下这样的代码，不过这里简化了任务的逻辑。
```python
import requests
import time
from functools import wraps

def func_time(func):
    @wraps(func)
    def new_func(*args, **kwargs):
        print(f'start {func.__name__}')
        start  = time.time()
        result = func(*args, **kwargs)
        stop   = time.time()
        print(f'finish {func.__name__}, and taking {format(stop - start, "0.2f")} s')
        return result
    return new_func

def do_work(url):
    requests.get(url)

@func_time
def do_works_serial(tasks):
    for task in tasks:
        do_work(task)

def main():
    tasks = [
        "https://movie.douban.com/subject/5912992/",
        "https://movie.douban.com/subject/30170448/",
        "https://movie.douban.com/subject/30334073/",
        "https://movie.douban.com/subject/1292064/",
        "https://movie.douban.com/subject/21937445/",
    ]
    do_works_serial(tasks)

# output:
# start do_works_serial
# finish do_works_serial, and taking 3.59 s
```

上面的代码处理方式是依次进行网络请求，上一个请求返回之后再进行下一个请求。

这种方式在需要处理的小任务不多的时候，倒也是可行的。但是处理方式非常笨拙，会有大量的时间耗费在等待请求的返回，没有充分地利用到计算机的资源，所以通常对于这样的需求，最容易想到的就是多线程和多进程，就像下面的代码一样。

```python
@func_time
def do_works_muti_threads(tasks):
    threads = set()
    for task in tasks:
        t = threading.Thread(target=do_work, args=(task,))
        t.start()
        threads.add(t)
    # 等待所有线程的结束
    for t in threads:
        t.join()

@func_time
def do_works_muti_processes(tasks):
    processes = set()
    for task in tasks:
        t = Process(target=do_work, args=(task,))
        t.start()
        processes.add(t)
    # 等待所有进程的结束
    for t in processes:
        t.join()

# output
# start do_works_muti_threads
# finish do_works_muti_threads, and taking 1.38 s
# start do_works_muti_processes
# finish do_works_muti_processes, and taking 1.61 s
```

可以发现，不论是多线程或者多进程的方案，都会提升程序的效率（当然这里的计时并不严谨，因为网络波动会影响耗时），实际上多线程或者多进程的也是软件工程解决并发问题常用的手段。

不过多线程或者多进程的方案并不是万能的，这两种方案存在一些问题，第一，会占用额外的系统资源，而且进程会占用更多的资源，互联网领域有名的 C10K 问题，就印证了这点，频繁的上下文切换带来了大量的资源消耗。第二，多线程会有同步共享资源的问题，使用锁无疑又会增加资源的消耗，而多进程的方案会有进程间通信问题。

随着技术的进步，人们又推出了协程的概念，可以轻松应对上述问题。而 Python 也在语言层面提供了支持，使得协程即提高了程序运行效率，又保证了代码的可读性，本文的示例代码都是基于 Python 3.7的（另一种基于生成器的协程，使用 `@asyncio.coroutine` 装饰，不过会在 Python 3.10 中移除，这里不做讨论了）。

### 使用协程解决并发问题
说了那么多，Python 3.7 中使用协程是如何解决上面提到案例呢？
```python
import asyncio
import aiohttp
import threading

async def do_work_async(url):
    print(f'{url}:{threading.currentThread().ident}')
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as _:
            print(f'{url} done')

async def coro_func(tasks):
    tasks = (asyncio.create_task(do_work_async(task)) for task in tasks)
    print('before tasks')
    await asyncio.gather(*tasks)
    print('finish tasks')

@func_time
def do_works_coroutine(tasks):
    asyncio.run(coro_func(tasks))

# output
# start do_works_coroutine
# before tasks
# https://movie.douban.com/subject/5912992/:3856
# https://movie.douban.com/subject/30170448/:3856
# https://movie.douban.com/subject/30334073/:3856
# https://movie.douban.com/subject/1292064/:3856
# https://movie.douban.com/subject/21937445/:3856
# https://movie.douban.com/subject/1292064/ done
# https://movie.douban.com/subject/21937445/ done
# https://movie.douban.com/subject/5912992/ done
# https://movie.douban.com/subject/30334073/ done
# https://movie.douban.com/subject/30170448/ done
# finish tasks
# finish do_works_coroutine, and taking 1.02 s
```

可以发现代码只有短短的10来行，不过对于没有接触过协程的同学来说，不太好理解，所以针对上面代码，这里稍作梳理，更多关于 `async` 的介绍和用法应该参考[官方文档](https://docs.python.org/3/library/asyncio.html)。

#### 概念梳理
- 协程函数: 定义形式为 `async def` 的函数
- 协程对象: 调用 *协程函数* 所返回的对象
- await: 等待协程的返回
- 协程函数直接调用并不会被执行，而是返回协程对象，另外还会得到一个警告 `coroutine 'xxx' was never awaited` ，所以说协程函数与 `await` 通常是配套使用的。
- asyncio.run： 该函数接收的参数是协程，负责管理整个事件循环，调用时会创建一个新的事件循环并在结束时关闭之，它应当被用作 asyncio 程序的主入口点，理想情况下应当只被调用一次。
- asyncio.create_task： 将协程打包并返回一个 `Task` 对象，而Task 对象被用来在事件循环中运行协程，可以通过 `Task` 对象取消正在运行的任务，或者是获取任务是否已经完成等信息。
- asyncio.gather： 并发的运行 `Task` 对象

#### 运行逻辑探讨
了解完上面这些内容之后，我们再回过头来分析下代码。
1. asyncio.run(coro_func(tasks)) 开始进入事件循环。
2. task 依次被创建，进入事件循环并开始等待运行；打印 "before tasks"。
3. await asyncio.gather，开始‘并发’的执行 task，通过打印的 log 发现虽说是‘并发’，但实际上依然是单线程运行。程序运行到 `aiohttp.ClientSession()` 或者 `session.get(url)` 时并不会阻塞，而是切出当前任务，由事件调度器开始调度下一个任务。
4. 当所有的任务都进入了等待状态之后，事件调度器也会暂停，直到有任务返回。
5. 有任务请求返回则会获取到调度器的控制权，打印对应的 “url done”。
6. 所有协程执行完成后，`asyncio.run` 返回，事件循环结束。

### 总结
#### 协程到底是什么
以上说了这么多之后，应该了解了什么是协程，协程的工作机理，但是如果要一句话描述出来，还真不太好说。所以在 `stackoverflow` 看到一句话[描述](https://stackoverflow.com/questions/553704/what-is-a-coroutine?tdsourcetag=s_pcqq_aiomsg)，感觉挺合适的，就迁移过来了。

**协程是一种通用控制结构，其中流控制在两个不同的例程之间协同传递而不返回。**

#### 并发编程中，协程的优劣

线程会比协程更重一些，需要操作系统知道线程的信息，操作系统会在合适的时机进行线程切换，这样做的优势就是代码简单，程序员友好，无需关系任务切换逻辑。

相比进程和线程，协程应该是最轻量的一种并发方案，任务切换完全由程序员自由控制，只有当上一个任务交出控制权下一个任务才能开始执行。对比线程，协程会更高效，但同时也存在一个问题，需要库提供者的支持，比如上面的例程中用到的 `aiohttp` ，如果开源社区没有的话，那么就需要自行实现了。

而多进程则是一种真正的并行方案，在多核 CPU 的机器上能同时运行多个进程。

总的来说，协程和线程更适合处理 I/O 密集的场景，特别是 Python 中的多线程实际上也只是单线程中执行；而对于 CPU 密集的场景来说，多进程、多机器、多处理器才能提高程序的运行速度。

