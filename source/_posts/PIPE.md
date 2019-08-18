---
title: 浅谈 IPC 的几种方式（一）
date: 2019-07-21 15:24:20
tags: 
- IPC
- Unix
- 进程通信
- C 语言
categories:
- Unix
description: 讨论 Unix 下的 IPC （进程间通信机制）--- 管道 PIPE
---

![](/images/background/barley.jpg)
### 前言
学而时习之不亦说乎，进程间通信相关的知识其实在很久以前就学习过，这方面的知识大部分工作根本用不着，但是对自己理解高阶代码有很大裨益，故而借这个周末又翻了翻 [APUE](https://book.douban.com/subject/1788421) 相关章节，以下复习笔记，和一些自己的总结和思考。

### 进程间通信
进程之间交换信息常见的途径有如下几种:
1. 第一种通过 fork 或者 exec 生成子进程，父进程的所有信息，在子进程中都可以获取到，达到共享信息的目的，但是这种信息交换的方式对于没有亲属关系的进程之间是无效的。
2. 第二种是通过约定，多个进程读写同一个文件的方式进行信息交换，这也是最容易被想到的方式。当程序及其简单的时候，这种方式实现起来非常简单倒是还有用武之地。但是代码量大起来，或者逻辑复杂之后，就显得比较低效，而且当不同进程同时读写文件的时候，容易发生混乱。
3. 第三种就是今天要介绍的进程间通信 (InterProcess Communication, IPC)。常见的进程间通信方式包括如下几种，接下来逐一介绍。
    - [无名管道 PIPE](#pipe) 
    - [有名管道 FIFO](#fifo) 
    - [信号 signal](#signal) 
    - [消息队列 MSG](#msg) 
    - [共享内存 SHM](#shm) 
    - [信号量 SEM](#sem) 
    - [套接字 Socket](#socket)

<span id="pipe"/>  


### 无名管道 PIPE

管道，命名就很形象，可以想象成一根水管连接两个进程，一边进水一边出水。

#### 特征
- 没有名字，无法使用 open() 进行打开
- 因为第一个特点，没有名字，不能 open，所以只能用于有共同祖先进程的进程之间通信
- [半双工](https://zh.wikipedia.org/w/index.php?title=%E9%9B%99%E5%B7%A5&oldformat=true&variant=zh-hans#%E5%8D%8A%E9%9B%99%E5%B7%A5)的工作方式，这一点也类似于真实的管道，读端写端分开
- 写入操作不具有原子性，所以一般只使用于一对一的简单通信

#### 使用
管道是通过 `pipe` 函数创建的
```c
#include <unistd.h>
int pipe(int fd[2]);  // 创建成功返回 0，否则为 -1
```
函数返回成功后，fd[0] 成为读端，fd[1] 成为写端。fd[1] 读取 fd[0] 的输入。实际上 PIPE 并没有限制一定在两个不同的进程间使用，但是单个进程间的管道没有任何作用，也就不做讨论。下图截自 [APUE](https://book.douban.com/subject/1788421) 描述了管道的一般工作模型。

![](/images/ipc/1.png)

首先进程调用 `pipe` 函数，接着调用 `fork` 函数创建子进程，所以产生的子进程和父进程一样都能获取 PIPE 读端和写端。紧接着各自关闭所不需要的文件 ID，上图表示的是父进程传输信息到子进程，所以父进程关闭了读端，子进程关闭了写端。因为管道的半双工的特点，所以一般不会用一个管道进行双向的信息互换，更常见的是创建两个管道进行信息互换（如协同进程）。

简单的 demo

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
int main(int argc, char const *argv[])
{
	int fd[2];
	if (-1 == pipe(fd)) {
		perror("pipe error");
		exit(1);
	}

	pid_t pid = fork();
	if (pid > 0) {             /* 父进程 */
		close(fd[0]);
		char *s = "hello, i am your father!";
		// sleep(10);
		write(fd[1], s, strlen(s));
		close(fd[1]);
	} 
	else if (pid == 0) {       /* 子进程 */
		close(fd[1]);
		
		char buf[30];
		bzero(buf, 30);
		read(fd[0], buf, 30);
		printf("read from father:%s\n", buf);
		
		close(fd[0]);
	}
	else {
		perror("fork error");
		exit(1);
	}
	return 0;
}
 /**************************************************
 * ouput：read from father:hello, i am your father!
 ****************************************************/
```

**注**，PIPE 是一种特殊的文件，也可以使用一般的文件 IO 函数进行读写，但是同 FIFO、socket 一样是不能使用 `lseek` 之类的函数进行定位，因为它们不同于普通文件存在于硬盘、Flash 等块设备上，它们只存在于内存，由内核维护。

如果想查看进程的管道，可以将上述示例代码，sleep 取消注释再运行，可以看到以下结果。

![](/images/ipc/2.png)

#### shell 中的管道

实际上有了以上的基础之后，shell中的管道倒是很容易理解。

下图说明了如何通过管道连接 `find`、`grep` 和 `wc` 命令，将 `find` 命令的标准输出重定向（通过 `dup2` 接口 ）到管道的写端，而将 `grep` 命令的标准输入指向管道的读端。`grep` 和 `wc` 之间也是同理。

![](/images/ipc/3.png)  


<span id="fifo"/> 
### 有名管道 FIFO

因为 `PIPE` 应用场景比较单一，性能较弱，限制条件太多。所以还有一种更强大的管道 `FIFO` 。

#### 特征
- 有名字，存在于普通的文件系统中，所以任何有权限的进程都可以通过文件 IO 函数读写 `FIFO`
- 具有写入原子性，多写者同时进行操作不会出现数据混乱
- First In First Out 原则，最先写入就会最先被读出

#### 使用

```c
# read.c
#define FIFO "/tmp/fifotest"
int main(int argc, char const *argv[])
{
	if (access(FIFO, F_OK)) {
		mkfifo(FIFO, 0644);
	}

	int fifo = open(FIFO, O_RDONLY); // 只读的方式打开FIFO
	
	char msg[20];
	memset(msg, 0, 20);

	read(fifo, msg, 20);
	printf("read from FIFO: %s\n", msg);
	
	return 0;
}

# write.c
#define FIFO "/tmp/fifotest"
int main(int argc, char const *argv[])
{
	if (access(FIFO, F_OK)) {
		mkfifo(FIFO, 0644);
	}

	int fifo = open(FIFO, O_WRONLY); // 只写的方式打开FIFO
	
	char msg[20];
	memset(msg, 0, 20);

	fgets(msg, 20, stdin);
	int n = write(fifo, msg, strlen(msg));
	printf("sebded %d bytes to FIFO\n", n);
	
	return 0;
}
```

这是完整源码[地址](https://github.com/Jacksonlike/blog_code/tree/master/IPC)。代码执行效果如下。
![](/images/ipc/5.png) 

示例代码非常的简单，不过有以下几点进行说明：  
- read 和 write 是两个同时独立运行的进程。
- 刚开始运行 read 进程而还没运行 write 进程时，或者是运行了 write 进程且 read 进程还没有运行时，`open` 函数会被阻塞，因为管道文件（包括 `FIFO`、`PIPE` 和 `socket` ）不可以只有读端或者只有写端被打开。
- 除了打开管道的时候可能发生阻塞，在进行读写操作的时候也可能会发生阻塞，具体规则如下表所示。

  ![](/images/ipc/4.png) 



### 参考文档

[对话 UNIX 探索管道](https://www.ibm.com/developerworks/cn/aix/library/au-spunix_pipeviewer/index.html)
[Unix 环境高级编程](https://book.douban.com/subject/1788421) 

