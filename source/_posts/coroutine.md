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

### 从一个案例说起
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

当我们希望从网上抓取一些有用的信息时，就可能会实现上述的代码这样的功能，以上的解决方式是依次完成每一个小的任务。当小任务不多的时候，这样的处理方式倒也是可行的，如果想要充分地利用计算机的资源，对于这样的需求，最容易想到的就是多线程和多进程，就像下面的代码一样。

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
不过多线程或者多进程的方案并不是万能的，这两种方案一些问题，第一，会占用额外的系统资源，而且进程会占用更多的资源，互联网领域有名的 C10K 问题，就印证了这点，频繁的上下文切换带来了大量的资源消耗。第二，多线程会有同步共享资源的问题，使用锁无疑又会增加资源的消耗，而多进程的方案会有进程间通信问题。
不过随着时间的推移，人们又推出了协程的概念，可以轻松应对上述问题。而 Python 也在语言层面提供了支持，使得协程即提高了程序运行效率，又保证了代码的可读性。

### 使用协程实现案例的功能
